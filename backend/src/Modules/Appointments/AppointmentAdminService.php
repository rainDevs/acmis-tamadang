<?php

declare(strict_types=1);

namespace App\Modules\Appointments;

use PDO;

/**
 * Staff appointment administration queries (TASK-015). All callers must pass
 * through AppointmentAdminController (RequireAuth gate + role gate); this
 * class enforces transitions and writes history rows but performs no auth.
 */
final class AppointmentAdminService
{
    public const STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'];

    /**
     * Server-authoritative status transitions (RULES.md §10 + API.md).
     * Terminal states accept no further action.
     */
    public const TRANSITIONS = [
        'pending' => ['approved', 'rejected'],
        'approved' => ['completed', 'no_show', 'cancelled'],
        'rejected' => [],
        'cancelled' => [],
        'completed' => [],
        'no_show' => [],
    ];

    public const REASON_REQUIRED = ['rejected', 'cancelled'];

    public const DEFAULT_PER_PAGE = 5;
    public const MAX_PER_PAGE = 50;

    /**
     * Filtered staff list. Counts respect every filter except `status` (chip
     * totals); rows respect all filters. Data-minimized rows: no contact or
     * address in list view (detail-only, RULES.md §9).
     *
     * @param array{status?: string, service_id?: string, date_from?: string, date_to?: string, q?: string, page?: string, per_page?: string} $filters
     * @return array{rows: array, page: int, per_page: int, total: int, pages: int, counts: array<string, int>}|array{error: string}
     */
    public static function list(PDO $pdo, array $filters): array
    {
        $status = trim((string) ($filters['status'] ?? 'all'));
        if ($status === '') {
            $status = 'all';
        }
        if ($status !== 'all' && !in_array($status, self::STATUSES, true)) {
            return ['error' => 'Unknown status filter.'];
        }

        $serviceId = trim((string) ($filters['service_id'] ?? ''));
        if ($serviceId !== '' && !ctype_digit($serviceId)) {
            return ['error' => 'Unknown service filter.'];
        }

        $dateFrom = trim((string) ($filters['date_from'] ?? ''));
        $dateTo = trim((string) ($filters['date_to'] ?? ''));
        foreach (['date_from' => $dateFrom, 'date_to' => $dateTo] as $key => $value) {
            if ($value !== '' && !self::isDate($value)) {
                return ['error' => 'Invalid date filter. Use YYYY-MM-DD.'];
            }
        }
        if ($dateFrom !== '' && $dateTo !== '' && $dateFrom > $dateTo) {
            return ['error' => 'Invalid date range.'];
        }

        $q = mb_substr(trim((string) ($filters['q'] ?? '')), 0, 100);

        $page = (int) ($filters['page'] ?? 1);
        $perPage = (int) ($filters['per_page'] ?? self::DEFAULT_PER_PAGE);
        if ($page < 1) {
            $page = 1;
        }
        if ($perPage < 1 || $perPage > self::MAX_PER_PAGE) {
            return ['error' => 'Invalid page size.'];
        }

        $where = [];
        $params = [];
        if ($serviceId !== '') {
            $where[] = 'a.service_id = :service_id';
            $params[':service_id'] = (int) $serviceId;
        }
        if ($dateFrom !== '') {
            $where[] = 'a.appointment_date >= :date_from';
            $params[':date_from'] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = 'a.appointment_date <= :date_to';
            $params[':date_to'] = $dateTo;
        }
        if ($q !== '') {
            // NOTE: native MySQL prepares reject a reused named placeholder
            // (HY093) — use two distinct placeholders (see docs/TESTING.md).
            $where[] = '(a.reference_no LIKE :q_ref OR a.requester_name LIKE :q_name)';
            $params[':q_ref'] = '%' . $q . '%';
            $params[':q_name'] = '%' . $q . '%';
        }
        $base = $where !== [] ? ' WHERE ' . implode(' AND ', $where) : '';

        // Chip totals ignore the status filter but respect everything else.
        $counts = ['all' => 0];
        foreach (self::STATUSES as $s) {
            $counts[$s] = 0;
        }
        $stmt = $pdo->prepare(
            'SELECT a.status, COUNT(*) AS c FROM appointments a'
            . ' LEFT JOIN appointment_services s ON s.id = a.service_id'
            . $base . ' GROUP BY a.status'
        );
        $stmt->execute($params);
        foreach ($stmt->fetchAll() as $row) {
            $counts[$row['status']] = (int) $row['c'];
            $counts['all'] += (int) $row['c'];
        }

        $rowWhere = $base;
        $rowParams = $params;
        if ($status !== 'all') {
            $rowWhere .= ($rowWhere === '' ? ' WHERE ' : ' AND ') . 'a.status = :status';
            $rowParams[':status'] = $status;
        }

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM appointments a' . $rowWhere);
        $countStmt->execute($rowParams);
        $total = (int) $countStmt->fetchColumn();
        $pages = max(1, (int) ceil($total / $perPage));
        $page = min($page, $pages);

        $listStmt = $pdo->prepare(
            'SELECT a.reference_no, a.status, a.service_id, s.name AS service_name,'
            . ' a.appointment_date, a.start_time, a.requester_name'
            . ' FROM appointments a LEFT JOIN appointment_services s ON s.id = a.service_id'
            . $rowWhere
            . ' ORDER BY a.appointment_date DESC, a.start_time DESC, a.id DESC'
            . ' LIMIT :limit OFFSET :offset'
        );
        foreach ($rowParams as $key => $value) {
            $listStmt->bindValue($key, $value);
        }
        $listStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $listStmt->bindValue(':offset', ($page - 1) * $perPage, PDO::PARAM_INT);
        $listStmt->execute();

        return [
            'rows' => $listStmt->fetchAll(),
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'pages' => $pages,
            'counts' => $counts,
        ];
    }

    /**
     * Full staff detail incl. contact, address, and actor history.
     * Returns null when the reference does not exist.
     */
    public static function detail(PDO $pdo, string $referenceNo): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT a.reference_no, a.status, a.service_id, s.name AS service_name,'
            . ' a.appointment_date, a.start_time, a.requester_name,'
            . ' a.contact_number, a.address, a.created_at'
            . ' FROM appointments a LEFT JOIN appointment_services s ON s.id = a.service_id'
            . ' WHERE a.reference_no = :ref'
        );
        $stmt->execute([':ref' => $referenceNo]);
        $row = $stmt->fetch();
        if ($row === false) {
            return null;
        }

        $hist = $pdo->prepare(
            'SELECT h.status, h.created_at AS at, u.display_name AS actor, h.note'
            . ' FROM appointment_status_history h'
            . ' LEFT JOIN staff_users u ON u.id = h.actor_user_id'
            . ' WHERE h.appointment_id = (SELECT id FROM appointments WHERE reference_no = :ref)'
            . ' ORDER BY h.id'
        );
        $hist->execute([':ref' => $referenceNo]);

        $row['history'] = array_map(
            static fn (array $h): array => [
                'status' => $h['status'],
                'at' => $h['at'],
                'actor' => $h['actor'] ?? 'Staff',
                'note' => $h['note'],
            ],
            $hist->fetchAll()
        );

        return $row;
    }

    /**
     * Staff status change inside a transaction (row lock serializes concurrent
     * transitions). Returns the updated detail or an error envelope part.
     *
     * @return array{record: array}|array{error: string, missing?: bool}
     */
    public static function setStatus(PDO $pdo, string $referenceNo, string $next, string $reason, int $actorUserId): array
    {
        if (!in_array($next, self::STATUSES, true)) {
            return ['error' => 'Unknown status.'];
        }
        $reason = trim($reason);
        if (in_array($next, self::REASON_REQUIRED, true) && $reason === '') {
            return ['error' => 'A short reason is required.'];
        }
        if (mb_strlen($reason) > 500) {
            return ['error' => 'Reason is too long.'];
        }

        try {
            $pdo->beginTransaction();

            $lock = $pdo->prepare(
                'SELECT id, status FROM appointments WHERE reference_no = :ref FOR UPDATE'
            );
            $lock->execute([':ref' => $referenceNo]);
            $current = $lock->fetch();
            if ($current === false) {
                $pdo->rollBack();

                return ['error' => 'Not found.', 'missing' => true];
            }

            $allowed = self::TRANSITIONS[$current['status']] ?? [];
            if (!in_array($next, $allowed, true)) {
                $pdo->rollBack();

                return ['error' => 'This status change is not allowed.'];
            }

            $update = $pdo->prepare(
                'UPDATE appointments SET status = :status WHERE id = :id'
            );
            $update->execute([':status' => $next, ':id' => $current['id']]);

            $insert = $pdo->prepare(
                'INSERT INTO appointment_status_history (appointment_id, status, actor_user_id, note)'
                . ' VALUES (:appointment_id, :status, :actor, :note)'
            );
            $insert->execute([
                ':appointment_id' => $current['id'],
                ':status' => $next,
                ':actor' => $actorUserId,
                ':note' => $reason !== '' ? $reason : null,
            ]);

            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        $record = self::detail($pdo, $referenceNo);

        return ['record' => $record];
    }

    public static function isDate(string $value): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return false;
        }
        [$y, $m, $d] = array_map('intval', explode('-', $value));

        return checkdate($m, $d, $y);
    }

    public static function isReference(string $value): bool
    {
        return (bool) preg_match('/^ACMIS-\d{4}-[0-9A-Z]{6}$/', $value);
    }
}
