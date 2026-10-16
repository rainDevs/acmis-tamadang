<?php

declare(strict_types=1);

namespace App\Modules\Appointments;

use PDO;
use PDOException;
use Throwable;

/**
 * Transactional appointment booking (see RULES.md §10).
 * Capacity is enforced inside the transaction with SELECT ... FOR UPDATE so
 * concurrent requests cannot overbook a slot. There is deliberately no UNIQUE
 * key on the slot (cancelled/completed rows must coexist with re-bookings).
 */
final class AppointmentService
{
    /**
     * @param array{service_id: int, appointment_date: string, start_time: string, requester_name: string, contact_number: string, address: string} $data start_time "HH:MM:SS"
     * @return array{reference_no: string, status: string, service_id: int, appointment_date: string, start_time: string}
     *
     * @throws SlotTakenException
     */
    public static function book(PDO $pdo, array $data): array
    {
        try {
            $pdo->beginTransaction();

            $count = $pdo->prepare(
                "SELECT COUNT(*) FROM appointments WHERE service_id = :sid"
                . ' AND appointment_date = :date AND start_time = :time'
                . " AND status IN ('pending', 'approved') FOR UPDATE"
            );
            $count->execute([
                ':sid' => $data['service_id'],
                ':date' => $data['appointment_date'],
                ':time' => $data['start_time'],
            ]);

            $capacity = self::slotCapacity($pdo, $data['service_id'], $data['appointment_date'], $data['start_time']);
            if ((int) $count->fetchColumn() >= $capacity) {
                $pdo->rollBack();

                throw new SlotTakenException('Selected schedule is no longer available.');
            }

            $reference = self::generateReference($pdo);
            $insert = $pdo->prepare(
                'INSERT INTO appointments (reference_no, service_id, appointment_date, start_time, requester_name, contact_number, address, status)'
                . " VALUES (:ref, :sid, :date, :time, :name, :contact, :address, 'pending')"
            );
            $insert->execute([
                ':ref' => $reference,
                ':sid' => $data['service_id'],
                ':date' => $data['appointment_date'],
                ':time' => $data['start_time'],
                ':name' => $data['requester_name'],
                ':contact' => $data['contact_number'],
                ':address' => $data['address'],
            ]);

            $pdo->commit();
        } catch (SlotTakenException $e) {
            throw $e;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;
        }

        return [
            'reference_no' => $reference,
            'status' => 'pending',
            'service_id' => $data['service_id'],
            'appointment_date' => $data['appointment_date'],
            'start_time' => substr($data['start_time'], 0, 5),
        ];
    }

    /**
     * Capacity of the exact slot, read under the same lock. Falls back to 1
     * when the template row cannot be resolved (validated earlier by caller).
     */
    private static function slotCapacity(PDO $pdo, int $serviceId, string $date, string $time): int
    {
        $dow = (int) (new \DateTimeImmutable($date))->format('N');
        $stmt = $pdo->prepare(
            'SELECT capacity_per_slot FROM clinic_schedules'
            . ' WHERE is_active = 1 AND day_of_week = :dow AND (service_id IS NULL OR service_id = :sid)'
            . ' AND start_time <= :time_lo AND ADDTIME(start_time, SEC_TO_TIME(slot_duration_minutes * 60)) > :time_hi'
            . ' ORDER BY service_id DESC LIMIT 1'
        );
        $stmt->execute([':dow' => $dow, ':sid' => $serviceId, ':time_lo' => $time, ':time_hi' => $time]);
        /** @var string|false $value */
        $value = $stmt->fetchColumn();

        return $value === false ? 1 : max(1, (int) $value);
    }

    /**
     * Collision-safe reference: ACMIS-YYYY-XXXXXX, retried inside the transaction.
     */
    private static function generateReference(PDO $pdo): string
    {
        $year = gmdate('Y');
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $reference = sprintf('ACMIS-%s-%06d', $year, random_int(0, 999999));
            $check = $pdo->prepare('SELECT 1 FROM appointments WHERE reference_no = :ref');
            $check->execute([':ref' => $reference]);
            if ($check->fetchColumn() === false) {
                return $reference;
            }
        }

        throw new \RuntimeException('Could not generate a unique reference number.');
    }
}
