<?php

declare(strict_types=1);

namespace App\Database;

use PDO;
use PDOException;

/**
 * PDO MySQL connection factory (see RULES.md §6–§7).
 * Prepared statements for every variable-input query; never concatenate untrusted input.
 */
final class Connection
{
    /**
     * @param array{host: string, port: string, name: string, user: string, pass: string, charset: string} $cfg
     */
    public static function make(array $cfg): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $cfg['host'],
            $cfg['port'],
            $cfg['name'],
            $cfg['charset']
        );

        return new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }

    /**
     * Liveness probe. Returns false (never throws) so callers can map to a safe 503.
     */
    public static function ping(PDO $pdo): bool
    {
        try {
            $stmt = $pdo->query('SELECT 1');
            return $stmt !== false;
        } catch (PDOException $e) {
            return false;
        }
    }
}
