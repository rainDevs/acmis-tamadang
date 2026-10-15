<?php

declare(strict_types=1);

namespace App\Modules\Services;

use App\Config\Config;
use App\Database\Connection;
use App\Shared\ApiError;
use App\Shared\Response;
use PDO;
use Throwable;

/**
 * GET /api/public/services — public, no auth. Approved catalog only
 * (docs/DECISIONS.md 2026-10-16, Q-01). Read-only; no patient data.
 */
final class ServicesController
{
    public static function list(?PDO $pdo = null): array
    {
        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('services-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $stmt = $pdo->query(
                'SELECT id, name, description, duration_minutes'
                . ' FROM appointment_services WHERE is_active = 1 ORDER BY id'
            );
            /** @var array<int, array{id: string, name: string, description: string|null, duration_minutes: string}> $rows */
            $rows = $stmt->fetchAll();
            $services = array_map(
                static fn (array $r): array => [
                    'id' => (int) $r['id'],
                    'name' => $r['name'],
                    'description' => $r['description'],
                    'duration_minutes' => (int) $r['duration_minutes'],
                ],
                $rows
            );
        } catch (Throwable $e) {
            ApiError::log('services-list', $e);

            return ApiError::serverError();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Services retrieved.', $services, 200),
        ];
    }
}
