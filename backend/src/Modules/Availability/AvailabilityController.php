<?php

declare(strict_types=1);

namespace App\Modules\Availability;

use App\Config\Config;
use App\Database\Connection;
use App\Shared\ApiError;
use App\Shared\Response;
use DateInterval;
use DateTimeImmutable;
use DateTimeZone;
use PDO;
use PDOException;
use Throwable;

/**
 * GET /api/public/availability — public, no auth. Returns counts only.
 * Query: service_id (optional int; omit = all active services),
 *        from/to (optional YYYY-MM-DD; default today → +13 days Manila).
 */
final class AvailabilityController
{
    /**
     * @param array<string, string>|null $query e.g. $_GET; null reads $_GET (live HTTP)
     */
    public static function handle(?array $query = null, ?PDO $pdo = null, ?DateTimeImmutable $now = null): array
    {
        $query ??= $_GET;        $now ??= new DateTimeImmutable('now', new DateTimeZone(AvailabilityService::MANILA_TZ));

        $from = trim((string) ($query['from'] ?? ''));
        $to = trim((string) ($query['to'] ?? ''));
        if ($from === '') {
            $from = $now->format('Y-m-d');
        }
        if ($to === '') {
            $to = $now->add(new DateInterval('P13D'))->format('Y-m-d');
        }

        if (!self::isDate($from) || !self::isDate($to)) {
            return self::invalid('Dates must use YYYY-MM-DD format.');
        }
        if ($from > $to) {
            return self::invalid('Invalid date range.');
        }
        $window = (int) (new DateTimeImmutable($to))->diff(new DateTimeImmutable($from))->days;
        if ($window > AvailabilityService::MAX_WINDOW_DAYS - 1) {
            return self::invalid('Date range must not exceed 31 days.');
        }

        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('availability-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $services = self::loadServices($pdo, $query);
        } catch (Throwable $e) {
            ApiError::log('availability-services', $e);

            return ApiError::serverError();
        }

        if ($services === null) {
            return self::invalid('Unknown or inactive service.');
        }

        try {
            $days = [];
            foreach ($services as $service) {
                foreach (AvailabilityService::days($pdo, $service, $from, $to, $now) as $day) {
                    $days[] = $day;
                }
            }
        } catch (Throwable $e) {
            ApiError::log('availability-compute', $e);

            return ApiError::serverError();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Availability retrieved.', $days, 200),
        ];
    }

    /**
     * @param array<string, string> $query
     * @return array<int, array{id: int, name: string}>|null null = unknown/inactive service_id
     */
    private static function loadServices(PDO $pdo, array $query): ?array
    {
        $raw = trim((string) ($query['service_id'] ?? ''));

        if ($raw === '') {
            $stmt = $pdo->query(
                'SELECT id, name FROM appointment_services WHERE is_active = 1 ORDER BY id'
            );
            /** @var array<int, array{id: string, name: string}> $rows */
            $rows = $stmt->fetchAll();

            return array_map(
                static fn (array $r): array => ['id' => (int) $r['id'], 'name' => $r['name']],
                $rows
            );
        }

        if (!ctype_digit($raw)) {
            return null;
        }

        $stmt = $pdo->prepare(
            'SELECT id, name FROM appointment_services WHERE id = :id AND is_active = 1'
        );
        $stmt->execute([':id' => (int) $raw]);
        /** @var array{id: string, name: string}|false $row */
        $row = $stmt->fetch();

        if ($row === false) {
            return null;
        }

        return [['id' => (int) $row['id'], 'name' => $row['name']]];
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
