<?php

declare(strict_types=1);

namespace App\Modules\Services;

use App\Config\Config;
use App\Database\Connection;
use App\Modules\Auth\AccessPolicy;
use App\Shared\ApiError;
use App\Shared\Response;
use PDO;
use Throwable;

/**
 * Scheduling master-data administration (TASK-020, admin+ only).
 * Every endpoint gates on AccessPolicy module `services`.
 */
final class ServicesAdminController
{
    /**
     * Module gate: passes the session user through or returns the 401/403
     * error to return verbatim.
     *
     * @return array{user: array}|array{status: int, body: string}
     */
    private static function gate(): array
    {
        $auth = AccessPolicy::requireModule('services');
        if (!isset($auth['user'])) {
            return $auth;
        }

        return ['user' => $auth['user']];
    }

    /**
     * PDO factory: passes the connection through or returns the 503 error
     * to return verbatim.
     *
     * @return array{pdo: PDO}|array{status: int, body: string}
     */
    private static function connect(): array
    {
        try {
            return ['pdo' => Connection::make(Config::db())];
        } catch (Throwable $e) {
            ApiError::log('services-admin-connect', $e);

            return ApiError::unavailable();
        }
    }

    /**
     * GET /api/services — full catalog incl. inactive (admin view).
     */
    public static function listServices(?PDO $pdo = null): array
    {
        $gate = self::gate();
        if (!isset($gate['user'])) {
            return $gate;
        }

        if ($pdo === null) {
            $connected = self::connect();
            if (!isset($connected['pdo'])) {
                return $connected;
            }
            $pdo = $connected['pdo'];
        }

        try {
            $result = ServicesAdminService::services($pdo);
        } catch (Throwable $e) {
            ApiError::log('services-admin-list', $e);

            return ApiError::serverError();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Services retrieved.', $result, 200),
        ];
    }

    /**
     * PATCH /api/services/{id} — $body null reads php://input (live HTTP).
     *
     * @param array<string, mixed>|null $body
     */
    public static function updateService(?array $body = null, ?int $id = null, ?PDO $pdo = null): array
    {
        $gate = self::gate();
        if (!isset($gate['user'])) {
            return $gate;
        }

        if ($id === null || $id < 1) {
            return ApiError::notFound();
        }

        if ($body === null) {
            $decoded = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($decoded)) {
                return ApiError::validation('Invalid request body.');
            }
            $body = $decoded;
        }

        if ($pdo === null) {
            $connected = self::connect();
            if (!isset($connected['pdo'])) {
                return $connected;
            }
            $pdo = $connected['pdo'];
        }

        try {
            $result = ServicesAdminService::updateService($pdo, $id, $body);
        } catch (Throwable $e) {
            ApiError::log('services-admin-update', $e);

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
            'body' => Response::json(true, 'Service updated.', $result['service'], 200),
        ];
    }

    /**
     * GET /api/schedules — $query null reads $_GET (live).
     *
     * @param array<string, string>|null $query
     */
    public static function listSchedules(?array $query = null, ?PDO $pdo = null): array
    {
        $gate = self::gate();
        if (!isset($gate['user'])) {
            return $gate;
        }

        $query ??= $_GET;

        if ($pdo === null) {
            $connected = self::connect();
            if (!isset($connected['pdo'])) {
                return $connected;
            }
            $pdo = $connected['pdo'];
        }

        try {
            $result = ServicesAdminService::schedules($pdo, (string) ($query['service_id'] ?? ''));
        } catch (Throwable $e) {
            ApiError::log('schedules-admin-list', $e);

            return ApiError::serverError();
        }

        if (isset($result['error'])) {
            return ApiError::validation($result['error']);
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Schedules retrieved.', $result, 200),
        ];
    }

    /**
     * PATCH /api/schedules/{id} — $body null reads php://input (live HTTP).
     *
     * @param array<string, mixed>|null $body
     */
    public static function updateSchedule(?array $body = null, ?int $id = null, ?PDO $pdo = null): array
    {
        $gate = self::gate();
        if (!isset($gate['user'])) {
            return $gate;
        }

        if ($id === null || $id < 1) {
            return ApiError::notFound();
        }

        if ($body === null) {
            $decoded = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($decoded)) {
                return ApiError::validation('Invalid request body.');
            }
            $body = $decoded;
        }

        if ($pdo === null) {
            $connected = self::connect();
            if (!isset($connected['pdo'])) {
                return $connected;
            }
            $pdo = $connected['pdo'];
        }

        try {
            $result = ServicesAdminService::updateSchedule($pdo, $id, $body);
        } catch (Throwable $e) {
            ApiError::log('schedules-admin-update', $e);

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
            'body' => Response::json(true, 'Schedule updated.', $result['schedule'], 200),
        ];
    }

    /**
     * GET /api/closures.
     */
    public static function listClosures(?PDO $pdo = null): array
    {
        $gate = self::gate();
        if (!isset($gate['user'])) {
            return $gate;
        }

        if ($pdo === null) {
            $connected = self::connect();
            if (!isset($connected['pdo'])) {
                return $connected;
            }
            $pdo = $connected['pdo'];
        }

        try {
            $result = ServicesAdminService::closures($pdo);
        } catch (Throwable $e) {
            ApiError::log('closures-admin-list', $e);

            return ApiError::serverError();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Closures retrieved.', $result, 200),
        ];
    }

    /**
     * POST /api/closures — $body null reads php://input (live HTTP).
     *
     * @param array<string, mixed>|null $body
     */
    public static function addClosure(?array $body = null, ?PDO $pdo = null): array
    {
        $gate = self::gate();
        if (!isset($gate['user'])) {
            return $gate;
        }

        if ($body === null) {
            $decoded = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($decoded)) {
                return ApiError::validation('Invalid request body.');
            }
            $body = $decoded;
        }

        if ($pdo === null) {
            $connected = self::connect();
            if (!isset($connected['pdo'])) {
                return $connected;
            }
            $pdo = $connected['pdo'];
        }

        try {
            $result = ServicesAdminService::addClosure(
                $pdo,
                (string) ($body['closure_date'] ?? ''),
                (string) ($body['reason'] ?? '')
            );
        } catch (Throwable $e) {
            ApiError::log('closures-admin-add', $e);

            return ApiError::serverError();
        }

        if (isset($result['error'])) {
            if (($result['conflict'] ?? false) === true) {
                return [
                    'status' => 409,
                    'body' => Response::json(false, $result['error'], null, 409),
                ];
            }

            return ApiError::validation($result['error']);
        }

        return [
            'status' => 201,
            'body' => Response::json(true, 'Closure added.', $result['closure'], 201),
        ];
    }

    /**
     * DELETE /api/closures/{id}.
     */
    public static function deleteClosure(?int $id = null, ?PDO $pdo = null): array
    {
        $gate = self::gate();
        if (!isset($gate['user'])) {
            return $gate;
        }

        if ($id === null || $id < 1) {
            return ApiError::notFound();
        }

        if ($pdo === null) {
            $connected = self::connect();
            if (!isset($connected['pdo'])) {
                return $connected;
            }
            $pdo = $connected['pdo'];
        }

        try {
            $result = ServicesAdminService::deleteClosure($pdo, $id);
        } catch (Throwable $e) {
            ApiError::log('closures-admin-delete', $e);

            return ApiError::serverError();
        }

        if (isset($result['error'])) {
            return ApiError::notFound();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Closure removed.', null, 200),
        ];
    }
}
