<?php

declare(strict_types=1);

namespace App\Modules\Appointments;

use App\Config\Config;
use App\Database\Connection;
use App\Modules\Auth\AccessPolicy;
use App\Modules\Auth\RequireAuth;
use App\Shared\ApiError;
use App\Shared\Response;
use PDO;
use Throwable;

/**
 * Staff appointment administration (TASK-015). Every endpoint requires a
 * signed-in staff session; status changes additionally require the
 * superadmin/admin review role (owner-approved, docs/DECISIONS.md).
 */
final class AppointmentAdminController
{
    /**
     * GET /api/appointments — staff-only list. $query null reads $_GET (live).
     *
     * @param array<string, string>|null $query
     */
    public static function list(?array $query = null, ?PDO $pdo = null): array
    {
        $auth = RequireAuth::check();
        if (!isset($auth['user'])) {
            return $auth;
        }

        $query ??= $_GET;

        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('admin-list-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $result = AppointmentAdminService::list($pdo, [
                'status' => (string) ($query['status'] ?? 'all'),
                'service_id' => (string) ($query['service_id'] ?? ''),
                'date_from' => (string) ($query['date_from'] ?? ''),
                'date_to' => (string) ($query['date_to'] ?? ''),
                'q' => (string) ($query['q'] ?? ''),
                'page' => (string) ($query['page'] ?? '1'),
                'per_page' => (string) ($query['per_page'] ?? (string) AppointmentAdminService::DEFAULT_PER_PAGE),
            ]);
        } catch (Throwable $e) {
            ApiError::log('admin-list', $e);

            return ApiError::serverError();
        }

        if (isset($result['error'])) {
            return ApiError::validation($result['error']);
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Requests retrieved.', $result, 200),
        ];
    }

    /**
     * GET /api/appointments/{reference} — staff-only detail.
     */
    public static function detail(?string $referenceNo = null, ?PDO $pdo = null): array
    {
        $auth = RequireAuth::check();
        if (!isset($auth['user'])) {
            return $auth;
        }

        $referenceNo = strtoupper(trim((string) ($referenceNo ?? '')));
        if (!AppointmentAdminService::isReference($referenceNo)) {
            return ApiError::notFound();
        }

        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('admin-detail-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $record = AppointmentAdminService::detail($pdo, $referenceNo);
        } catch (Throwable $e) {
            ApiError::log('admin-detail', $e);

            return ApiError::serverError();
        }

        if ($record === null) {
            return ApiError::notFound();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Request retrieved.', $record, 200),
        ];
    }

    /**
     * PATCH /api/appointments/{reference}/status — superadmin/admin only
     * (default matrix module `appointments.review`).
     * $body null reads php://input (live HTTP).
     *
     * @param array<string, mixed>|null $body
     */
    public static function updateStatus(?array $body = null, ?string $referenceNo = null, ?PDO $pdo = null): array
    {
        $auth = AccessPolicy::requireModule('appointments.review');
        if (!isset($auth['user'])) {
            return $auth;
        }

        $referenceNo = strtoupper(trim((string) ($referenceNo ?? '')));
        if (!AppointmentAdminService::isReference($referenceNo)) {
            return ApiError::notFound();
        }

        if ($body === null) {
            $decoded = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($decoded)) {
                return ApiError::validation('Invalid request body.');
            }
            $body = $decoded;
        }

        $next = strtolower(trim((string) ($body['status'] ?? '')));
        $reason = (string) ($body['reason'] ?? '');

        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('admin-status-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $result = AppointmentAdminService::setStatus($pdo, $referenceNo, $next, $reason, (int) $auth['user']['id']);
        } catch (Throwable $e) {
            ApiError::log('admin-status', $e);

            return ApiError::serverError();
        }

        if (isset($result['error'])) {
            if (($result['missing'] ?? false) === true) {
                return ApiError::notFound();
            }

            return ApiError::validation($result['error']);
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Status updated.', $result['record'], 200),
        ];
    }
}
