<?php

declare(strict_types=1);

namespace App\Modules\Health;

use App\Config\Config;
use App\Database\Connection;
use App\Shared\ApiError;
use PDO;
use Throwable;

/**
 * Database liveness probe. No schema assumptions — runs SELECT 1 only.
 * Safe by design: failure yields 503 with a fixed message, never DSN/SQL/credentials.
 */
final class DbHealthController
{
    /**
     * @param callable(array): PDO|null $connector injectable for tests; defaults to real MySQL factory
     * @return array{status: int, body: string}
     */
    public static function check(?callable $connector = null): array
    {
        try {
            $pdo = $connector !== null
                ? $connector(Config::db())
                : Connection::make(Config::db());

            if ($pdo === null || !Connection::ping($pdo)) {
                return ApiError::unavailable();
            }

            $payload = [
                'success' => true,
                'message' => 'Database connection is working.',
                'data' => ['status' => 'ok'],
            ];

            return [
                'status' => 200,
                'body' => (string) json_encode($payload, JSON_UNESCAPED_SLASHES),
            ];
        } catch (Throwable $e) {
            ApiError::log('db-health', $e);

            return ApiError::unavailable();
        }
    }
}
