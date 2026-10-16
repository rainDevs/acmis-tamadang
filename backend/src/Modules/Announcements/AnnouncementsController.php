<?php

declare(strict_types=1);

namespace App\Modules\Announcements;

use App\Config\Config;
use App\Database\Connection;
use App\Shared\ApiError;
use App\Shared\Response;
use PDO;
use Throwable;

/**
 * GET /api/public/announcements — public, no auth. Read-only community
 * board (TASK-025). Reference rows only; publishing workflow (who
 * creates/edits) is deferred to TASK-021. `posted_at` is exposed as `date`
 * to match the board UI contract.
 */
final class AnnouncementsController
{
    public static function list(?PDO $pdo = null): array
    {
        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('announcements-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $stmt = $pdo->query(
                'SELECT id, type, title, body, pinned, posted_at'
                . ' FROM announcements ORDER BY pinned DESC, posted_at DESC LIMIT 50'
            );
            /** @var array<int, array{id: string, type: string, title: string, body: string, pinned: string, posted_at: string}> $rows */
            $rows = $stmt->fetchAll();
            $items = array_map(
                static fn (array $r): array => [
                    'id' => (int) $r['id'],
                    'type' => $r['type'],
                    'title' => $r['title'],
                    'body' => $r['body'],
                    'pinned' => (bool) $r['pinned'],
                    'date' => $r['posted_at'],
                ],
                $rows
            );
        } catch (Throwable $e) {
            ApiError::log('announcements-list', $e);

            return ApiError::serverError();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Announcements retrieved.', $items, 200),
        ];
    }
}
