<?php

declare(strict_types=1);

namespace App\Modules\Services;

use App\Modules\Appointments\AppointmentAdminService;
use PDO;

/**
 * Scheduling master-data administration (TASK-020, admin+ only via
 * AccessPolicy module `services`). No auth here — the controller gates.
 *
 * Edit-only by design: service names stay the approved Q-01 catalog and the
 * schedule structure stays the approved Q-02 template (no create/delete, no
 * approved rule for those). Closures are operational dates, so they support
 * add/remove. Changes apply to future bookings; existing rows are untouched.
 */
final class ServicesAdminService
{
    public const SERVICE_FIELDS = ['description', 'duration_minutes', 'is_active'];
    public const SCHEDULE_FIELDS = ['start_time', 'end_time', 'slot_duration_minutes', 'capacity_per_slot', 'is_active'];

    /**
     * @return array{services: array}
     */
    public static function services(PDO $pdo): array
    {
        $stmt = $pdo->query(
            'SELECT id, name, description, duration_minutes, is_active'
            . ' FROM appointment_services ORDER BY id'
        );

        return ['services' => array_map(
            static fn (array $r): array => [
                'id' => (int) $r['id'],
                'name' => $r['name'],
                'description' => $r['description'],
                'duration_minutes' => (int) $r['duration_minutes'],
                'is_active' => (bool) $r['is_active'],
            ],
            $stmt->fetchAll()
        )];
    }

    /**
     * @param array<string, mixed> $fields
     * @return array{service: array}|array{error: string, missing?: bool}
     */
    public static function updateService(PDO $pdo, int $id, array $fields): array
    {
        $unknown = array_diff(array_keys($fields), self::SERVICE_FIELDS);
        if ($unknown !== []) {
            return ['error' => 'Only description, duration_minutes, and is_active may be changed.'];
        }
        if ($fields === []) {
            return ['error' => 'No changes supplied.'];
        }

        $sets = [];
        $params = [':id' => $id];
        if (array_key_exists('description', $fields)) {
            $description = trim((string) $fields['description']);
            if (mb_strlen($description) > 255) {
                return ['error' => 'Description is too long.'];
            }
            $sets[] = 'description = :description';
            $params[':description'] = $description !== '' ? $description : null;
        }
        if (array_key_exists('duration_minutes', $fields)) {
            $duration = (int) $fields['duration_minutes'];
            if (!ctype_digit((string) $fields['duration_minutes']) || $duration < 5 || $duration > 480) {
                return ['error' => 'Duration must be 5–480 minutes.'];
            }
            $sets[] = 'duration_minutes = :duration';
            $params[':duration'] = $duration;
        }
        if (array_key_exists('is_active', $fields)) {
            $active = $fields['is_active'];
            if (!in_array($active, [0, 1, '0', '1', true, false], true)) {
                return ['error' => 'Active flag must be true or false.'];
            }
            $sets[] = 'is_active = :active';
            $params[':active'] = (int) ((bool) $active);
        }

        $check = $pdo->prepare('SELECT id FROM appointment_services WHERE id = :id');
        $check->execute([':id' => $id]);
        if ($check->fetch() === false) {
            return ['error' => 'Not found.', 'missing' => true];
        }

        $stmt = $pdo->prepare('UPDATE appointment_services SET ' . implode(', ', $sets) . ' WHERE id = :id');
        $stmt->execute($params);

        $row = $pdo->prepare('SELECT id, name, description, duration_minutes, is_active FROM appointment_services WHERE id = :id');
        $row->execute([':id' => $id]);
        $service = $row->fetch();
        $service['id'] = (int) $service['id'];
        $service['duration_minutes'] = (int) $service['duration_minutes'];
        $service['is_active'] = (bool) $service['is_active'];

        return ['service' => $service];
    }

    /**
     * @return array{schedules: array}|array{error: string}
     */
    public static function schedules(PDO $pdo, string $serviceId): array
    {
        if ($serviceId !== '' && !ctype_digit($serviceId)) {
            return ['error' => 'Unknown service filter.'];
        }
        $sql = 'SELECT c.id, c.service_id, s.name AS service_name, c.day_of_week,'
            . ' c.start_time, c.end_time, c.slot_duration_minutes, c.capacity_per_slot, c.is_active'
            . ' FROM clinic_schedules c LEFT JOIN appointment_services s ON s.id = c.service_id';
        $params = [];
        if ($serviceId !== '') {
            $sql .= ' WHERE (c.service_id = :service_id OR c.service_id IS NULL)';
            $params[':service_id'] = (int) $serviceId;
        }
        $sql .= ' ORDER BY c.day_of_week, c.start_time, c.id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return ['schedules' => array_map(
            static fn (array $r): array => [
                'id' => (int) $r['id'],
                'service_id' => $r['service_id'] === null ? null : (int) $r['service_id'],
                'service_name' => $r['service_name'],
                'day_of_week' => (int) $r['day_of_week'],
                'start_time' => substr((string) $r['start_time'], 0, 5),
                'end_time' => substr((string) $r['end_time'], 0, 5),
                'slot_duration_minutes' => (int) $r['slot_duration_minutes'],
                'capacity_per_slot' => (int) $r['capacity_per_slot'],
                'is_active' => (bool) $r['is_active'],
            ],
            $stmt->fetchAll()
        )];
    }

    /**
     * @param array<string, mixed> $fields
     * @return array{schedule: array}|array{error: string, missing?: bool}
     */
    public static function updateSchedule(PDO $pdo, int $id, array $fields): array
    {
        $unknown = array_diff(array_keys($fields), self::SCHEDULE_FIELDS);
        if ($unknown !== []) {
            return ['error' => 'Only start_time, end_time, slot_duration_minutes, capacity_per_slot, and is_active may be changed.'];
        }
        if ($fields === []) {
            return ['error' => 'No changes supplied.'];
        }

        $current = $pdo->prepare('SELECT start_time, end_time, slot_duration_minutes, capacity_per_slot FROM clinic_schedules WHERE id = :id');
        $current->execute([':id' => $id]);
        $row = $current->fetch();
        if ($row === false) {
            return ['error' => 'Not found.', 'missing' => true];
        }

        $start = array_key_exists('start_time', $fields) ? trim((string) $fields['start_time']) : substr((string) $row['start_time'], 0, 5);
        $end = array_key_exists('end_time', $fields) ? trim((string) $fields['end_time']) : substr((string) $row['end_time'], 0, 5);
        if (!self::isTime($start) || !self::isTime($end) || $end <= $start) {
            return ['error' => 'Invalid time window. Use HH:MM with end after start.'];
        }

        $sets = ['start_time = :start_time', 'end_time = :end_time'];
        $params = [':id' => $id, ':start_time' => $start . ':00', ':end_time' => $end . ':00'];
        if (array_key_exists('slot_duration_minutes', $fields)) {
            if (!ctype_digit((string) $fields['slot_duration_minutes']) || (int) $fields['slot_duration_minutes'] < 5 || (int) $fields['slot_duration_minutes'] > 480) {
                return ['error' => 'Slot duration must be 5–480 minutes.'];
            }
            $sets[] = 'slot_duration_minutes = :duration';
            $params[':duration'] = (int) $fields['slot_duration_minutes'];
        }
        if (array_key_exists('capacity_per_slot', $fields)) {
            if (!ctype_digit((string) $fields['capacity_per_slot']) || (int) $fields['capacity_per_slot'] < 1 || (int) $fields['capacity_per_slot'] > 50) {
                return ['error' => 'Capacity must be 1–50 per slot.'];
            }
            $sets[] = 'capacity_per_slot = :capacity';
            $params[':capacity'] = (int) $fields['capacity_per_slot'];
        }
        if (array_key_exists('is_active', $fields)) {
            if (!in_array($fields['is_active'], [0, 1, '0', '1', true, false], true)) {
                return ['error' => 'Active flag must be true or false.'];
            }
            $sets[] = 'is_active = :active';
            $params[':active'] = (int) ((bool) $fields['is_active']);
        }

        $stmt = $pdo->prepare('UPDATE clinic_schedules SET ' . implode(', ', $sets) . ' WHERE id = :id');
        $stmt->execute($params);

        $fresh = $pdo->prepare(
            'SELECT c.id, c.service_id, s.name AS service_name, c.day_of_week, c.start_time, c.end_time,'
            . ' c.slot_duration_minutes, c.capacity_per_slot, c.is_active'
            . ' FROM clinic_schedules c LEFT JOIN appointment_services s ON s.id = c.service_id WHERE c.id = :id'
        );
        $fresh->execute([':id' => $id]);
        $schedule = $fresh->fetch();
        $schedule['id'] = (int) $schedule['id'];
        $schedule['service_id'] = $schedule['service_id'] === null ? null : (int) $schedule['service_id'];
        $schedule['day_of_week'] = (int) $schedule['day_of_week'];
        $schedule['start_time'] = substr((string) $schedule['start_time'], 0, 5);
        $schedule['end_time'] = substr((string) $schedule['end_time'], 0, 5);
        $schedule['slot_duration_minutes'] = (int) $schedule['slot_duration_minutes'];
        $schedule['capacity_per_slot'] = (int) $schedule['capacity_per_slot'];
        $schedule['is_active'] = (bool) $schedule['is_active'];

        return ['schedule' => $schedule];
    }

    /**
     * @return array{closures: array}
     */
    public static function closures(PDO $pdo): array
    {
        $stmt = $pdo->query('SELECT id, closure_date, reason FROM schedule_closures ORDER BY closure_date DESC');

        return ['closures' => array_map(
            static fn (array $r): array => [
                'id' => (int) $r['id'],
                'closure_date' => $r['closure_date'],
                'reason' => $r['reason'],
            ],
            $stmt->fetchAll()
        )];
    }

    /**
     * @return array{closure: array}|array{error: string, conflict?: bool}
     */
    public static function addClosure(PDO $pdo, string $date, string $reason): array
    {
        $date = trim($date);
        if (!AppointmentAdminService::isDate($date)) {
            return ['error' => 'Invalid closure date. Use YYYY-MM-DD.'];
        }
        $reason = trim($reason);
        if (mb_strlen($reason) > 255) {
            return ['error' => 'Reason is too long.'];
        }

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO schedule_closures (closure_date, reason) VALUES (:date, :reason)'
            );
            $stmt->execute([':date' => $date, ':reason' => $reason !== '' ? $reason : null]);
        } catch (\PDOException $e) {
            if ((string) $e->getCode() === '23000') {
                return ['error' => 'That date is already closed.', 'conflict' => true];
            }
            throw $e;
        }

        return ['closure' => [
            'id' => (int) $pdo->lastInsertId(),
            'closure_date' => $date,
            'reason' => $reason !== '' ? $reason : null,
        ]];
    }

    /**
     * @return array{deleted: bool}|array{error: string, missing?: bool}
     */
    public static function deleteClosure(PDO $pdo, int $id): array
    {
        $stmt = $pdo->prepare('DELETE FROM schedule_closures WHERE id = :id');
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            return ['error' => 'Not found.', 'missing' => true];
        }

        return ['deleted' => true];
    }

    public static function isTime(string $value): bool
    {
        if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $value)) {
            return false;
        }

        return true;
    }
}
