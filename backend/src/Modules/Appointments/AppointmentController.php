<?php

declare(strict_types=1);

namespace App\Modules\Appointments;

use App\Config\Config;
use App\Database\Connection;
use App\Modules\Availability\AvailabilityService;
use App\Shared\ApiError;
use App\Shared\Response;
use DateTimeImmutable;
use DateTimeZone;
use PDO;
use Throwable;

/**
 * POST /api/public/appointments — public, no auth. Creates one `pending`
 * request. Every client value is validated server-side (RULES.md §6); the
 * capacity decision happens inside a transaction (AppointmentService).
 */
final class AppointmentController
{
    /**
     * @param array<string, mixed>|null $body decoded JSON; null reads php://input (live HTTP)
     */
    public static function handle(?array $body = null, ?PDO $pdo = null, ?DateTimeImmutable $now = null): array
    {
        if ($body === null) {
            $raw = (string) file_get_contents('php://input');
            $decoded = json_decode($raw, true);
            if (!is_array($decoded)) {
                return self::invalid('Invalid request body.');
            }
            $body = $decoded;
        }

        $now ??= new DateTimeImmutable('now', new DateTimeZone(AvailabilityService::MANILA_TZ));
        $today = $now->format('Y-m-d');

        $name = trim((string) ($body['full_name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100) {
            return self::invalid('Full name is required.');
        }

        $contact = (string) ($body['contact_number'] ?? '');
        $contact = (string) preg_replace('/\s+/', '', $contact);
        if (!preg_match('/^09\d{9}$/', $contact)) {
            return self::invalid('Enter a valid 11-digit mobile number (e.g. 09xx xxx xxxx).');
        }

        $address = trim((string) ($body['address'] ?? ''));
        if ($address === '' || mb_strlen($address) > 255) {
            return self::invalid('Address is required.');
        }

        $serviceRaw = trim((string) ($body['service_id'] ?? ''));
        if (!ctype_digit($serviceRaw)) {
            return self::invalid('Unknown or inactive service.');
        }

        $date = trim((string) ($body['appointment_date'] ?? ''));
        if (!self::isDate($date)) {
            return self::invalid('Appointment date must use YYYY-MM-DD format.');
        }
        if ($date < $today) {
            return self::invalid('Appointment date must not be in the past.');
        }

        $time = trim((string) ($body['start_time'] ?? ''));
        if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $time)) {
            return self::invalid('Start time must use HH:MM 24-hour format.');
        }
        $timeSec = $time . ':00';

        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('appointments-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $service = self::loadService($pdo, (int) $serviceRaw);
            if ($service === null) {
                return self::invalid('Unknown or inactive service.');
            }

            // Slot must exist on the template grid and not be in the past.
            // Full-vs-free is decided under lock in AppointmentService (409).
            $slotExists = false;
            foreach (AvailabilityService::days($pdo, $service, $date, $date, $now) as $day) {
                foreach ($day['slots'] as $slot) {
                    if ($slot['start_time'] === $time) {
                        $slotExists = true;
                        break 2;
                    }
                }
            }
            if (!$slotExists) {
                return self::invalid('Selected schedule is not available.');
            }
            if ($date === $today && $timeSec <= $now->format('H:i:s')) {
                return self::invalid('Selected schedule is no longer available.');
            }

            $created = AppointmentService::book($pdo, [
                'service_id' => $service['id'],
                'appointment_date' => $date,
                'start_time' => $timeSec,
                'requester_name' => $name,
                'contact_number' => $contact,
                'address' => $address,
            ]);
        } catch (SlotTakenException $e) {
            return [
                'status' => 409,
                'body' => Response::json(false, $e->getMessage(), null, 409),
            ];
        } catch (Throwable $e) {
            ApiError::log('appointments-create', $e);

            return ApiError::serverError();
        }

        return [
            'status' => 201,
            'body' => Response::json(true, 'Appointment request submitted.', $created, 201),
        ];
    }

    /**
     * @return array{id: int, name: string}|null
     */
    private static function loadService(PDO $pdo, int $serviceId): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT id, name FROM appointment_services WHERE id = :id AND is_active = 1'
        );
        $stmt->execute([':id' => $serviceId]);
        /** @var array{id: string, name: string}|false $row */
        $row = $stmt->fetch();

        if ($row === false) {
            return null;
        }

        return ['id' => (int) $row['id'], 'name' => $row['name']];
    }

    private static function isDate(string $value): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return false;
        }

        [$y, $m, $d] = array_map('intval', explode('-', $value));

        return checkdate($m, $d, $y);
    }

    /**
     * @return array{status: int, body: string}
     */
    private static function invalid(string $message): array
    {
        return [
            'status' => 422,
            'body' => Response::json(false, $message, null, 422),
        ];
    }
}
