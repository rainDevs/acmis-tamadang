<?php

declare(strict_types=1);

namespace App\Modules\Availability;

use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use PDO;

/**
 * Availability computation: weekly template − closures − occupying bookings.
 * Occupying statuses are pending + approved (capacity 1/slot per approved
 * schedule Q-02); all other statuses free the slot. Returns counts only —
 * never patient data (RULES.md §9).
 */
final class AvailabilityService
{
    public const MANILA_TZ = 'Asia/Manila';
    public const DEFAULT_WINDOW_DAYS = 14;
    public const MAX_WINDOW_DAYS = 31;

    /**
     * @param array{id: int, name: string} $service
     * @return array<int, array{date: string, service_id: int, service_name: string, closed: bool, slots: array<int, array{start_time: string, capacity: int, booked: int, slots_left: int, is_available: bool}>, slots_left: int, capacity: int}>
     */
    public static function days(PDO $pdo, array $service, string $from, string $to, DateTimeImmutable $now): array
    {
        $schedules = self::loadSchedules($pdo, (int) $service['id']);
        $closures = self::loadClosures($pdo, $from, $to);
        $booked = self::loadBookings($pdo, (int) $service['id'], $from, $to);

        $today = $now->format('Y-m-d');
        $nowTime = $now->format('H:i:s');
        $result = [];

        $cursor = new DateTimeImmutable($from, new DateTimeZone(self::MANILA_TZ));
        $end = new DateTimeImmutable($to, new DateTimeZone(self::MANILA_TZ));
        $step = new DateInterval('P1D');

        for ($day = $cursor; $day <= $end; $day = $day->add($step)) {
            $date = $day->format('Y-m-d');
            $dow = (int) $day->format('N'); // 1=Monday .. 7=Sunday
            $daySlots = [];
            $dayLeft = 0;
            $dayCapacity = 0;
            $closed = isset($closures[$date]);

            if (!$closed && isset($schedules[$dow])) {
                foreach ($schedules[$dow] as $row) {
                    foreach (self::expandSlots($row) as $slot) {
                        $key = $date . '|' . $slot['start'];
                        $taken = $booked[$key] ?? 0;
                        $left = max(0, $slot['capacity'] - $taken);
                        $past = $date < $today || ($date === $today && $slot['start'] <= $nowTime);
                        $daySlots[] = [
                            'start_time' => substr($slot['start'], 0, 5),
                            'capacity' => $slot['capacity'],
                            'booked' => $taken,
                            'slots_left' => $left,
                            'is_available' => $left > 0 && !$past,
                        ];
                        $dayLeft += (!$past ? $left : 0);
                        $dayCapacity += $slot['capacity'];
                    }
                }
            }

            $result[] = [
                'date' => $date,
                'service_id' => (int) $service['id'],
                'service_name' => $service['name'],
                'closed' => $closed,
                'slots' => $daySlots,
                'slots_left' => $closed ? 0 : $dayLeft,
                'capacity' => $dayCapacity,
            ];
        }

        return $result;
    }

    /**
     * Active template rows for a service, keyed by ISO day-of-week.
     * Service-specific rows override the global (NULL) rows for the same day.
     *
     * @return array<int, array<int, array{start_time: string, end_time: string, slot_duration_minutes: int, capacity_per_slot: int}>>
     */
    private static function loadSchedules(PDO $pdo, int $serviceId): array
    {
        $stmt = $pdo->prepare(
            'SELECT service_id, day_of_week, start_time, end_time, slot_duration_minutes, capacity_per_slot'
            . ' FROM clinic_schedules WHERE is_active = 1 AND (service_id IS NULL OR service_id = :sid)'
            . ' ORDER BY day_of_week, start_time'
        );
        $stmt->execute([':sid' => $serviceId]);

        $global = [];
        $specific = [];
        /** @var array{service_id: string|null, day_of_week: string, start_time: string, end_time: string, slot_duration_minutes: string, capacity_per_slot: string} $row */
        foreach ($stmt->fetchAll() as $row) {
            $entry = [
                'start_time' => (string) $row['start_time'],
                'end_time' => (string) $row['end_time'],
                'slot_duration_minutes' => (int) $row['slot_duration_minutes'],
                'capacity_per_slot' => (int) $row['capacity_per_slot'],
            ];
            $dow = (int) $row['day_of_week'];
            if ($row['service_id'] === null) {
                $global[$dow][] = $entry;
            } else {
                $specific[$dow][] = $entry;
            }
        }

        $merged = $global;
        foreach ($specific as $dow => $rows) {
            $merged[$dow] = $rows;
        }

        return $merged;
    }

    /**
     * @return array<string, true>
     */
    private static function loadClosures(PDO $pdo, string $from, string $to): array
    {
        $stmt = $pdo->prepare(
            'SELECT closure_date FROM schedule_closures WHERE closure_date BETWEEN :from AND :to'
        );
        $stmt->execute([':from' => $from, ':to' => $to]);

        $set = [];
        foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $date) {
            $set[(string) $date] = true;
        }

        return $set;
    }

    /**
     * Occupying bookings keyed by "date|HH:MM:SS".
     *
     * @return array<string, int>
     */
    private static function loadBookings(PDO $pdo, int $serviceId, string $from, string $to): array
    {
        $stmt = $pdo->prepare(
            "SELECT appointment_date, start_time, COUNT(*) AS c FROM appointments"
            . " WHERE service_id = :sid AND appointment_date BETWEEN :from AND :to"
            . " AND status IN ('pending', 'approved')"
            . ' GROUP BY appointment_date, start_time'
        );
        $stmt->execute([':sid' => $serviceId, ':from' => $from, ':to' => $to]);

        $map = [];
        /** @var array{appointment_date: string, start_time: string, c: string} $row */
        foreach ($stmt->fetchAll() as $row) {
            $map[$row['appointment_date'] . '|' . $row['start_time']] = (int) $row['c'];
        }

        return $map;
    }

    /**
     * Expand one template row into slot start times (HH:MM:SS).
     *
     * @param array{start_time: string, end_time: string, slot_duration_minutes: int, capacity_per_slot: int} $row
     * @return array<int, array{start: string, capacity: int}>
     */
    private static function expandSlots(array $row): array
    {
        $slots = [];
        $step = max(1, $row['slot_duration_minutes']) * 60;
        $start = self::toSeconds($row['start_time']);
        $end = self::toSeconds($row['end_time']);

        for ($t = $start; $t + $step <= $end; $t += $step) {
            $slots[] = ['start' => gmdate('H:i:s', $t), 'capacity' => $row['capacity_per_slot']];
        }

        return $slots;
    }

    private static function toSeconds(string $time): int
    {
        $parts = array_map('intval', explode(':', $time) + [0, 0, 0]);

        return $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
    }
}
