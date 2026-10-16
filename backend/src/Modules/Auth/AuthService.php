<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use PDO;

/**
 * Credential verification + login throttling (see RULES.md §8).
 * Generic outcomes only — callers must not distinguish unknown users from
 * wrong passwords (no account enumeration). No session handling here.
 */
final class AuthService
{
    public const MAX_FAILURES = 5;
    public const LOCK_MINUTES = 5;

    /**
     * @return array{locked: bool}|array{user: array{id: int, username: string, display_name: string, role: string}}|array{failed: bool}
     */
    public static function attempt(PDO $pdo, string $username, string $password): array
    {
        $username = trim($username);

        if (self::isLocked($pdo, $username)) {
            return ['locked' => true];
        }

        $user = self::findActiveUser($pdo, $username);
        $verified = $user !== null && password_verify($password, $user['password_hash']);

        if (!$verified) {
            self::recordFailure($pdo, $username);
            if (self::isLocked($pdo, $username)) {
                return ['locked' => true];
            }

            return ['failed' => true];
        }

        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $update = $pdo->prepare('UPDATE staff_users SET password_hash = :hash WHERE id = :id');
            $update->execute([':hash' => password_hash($password, PASSWORD_DEFAULT), ':id' => $user['id']]);
        }

        self::clearFailures($pdo, $username);

        return ['user' => [
            'id' => (int) $user['id'],
            'username' => $user['username'],
            'display_name' => $user['display_name'],
            'role' => $user['role'],
        ]];
    }

    /**
     * @return array{id: string, username: string, display_name: string, role: string, password_hash: string}|null
     */
    private static function findActiveUser(PDO $pdo, string $username): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT id, username, display_name, role, password_hash'
            . ' FROM staff_users WHERE username = :username AND is_active = 1'
        );
        $stmt->execute([':username' => $username]);
        /** @var array{id: string, username: string, display_name: string, role: string, password_hash: string}|false $row */
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * Lock state is evaluated on the database clock (locked_until > NOW())
     * so PHP/MySQL timezone skew can never stretch or shrink a lockout.
     */
    private static function isLocked(PDO $pdo, string $username): bool
    {
        $stmt = $pdo->prepare(
            'SELECT 1 FROM staff_login_attempts'
            . ' WHERE username = :username AND locked_until IS NOT NULL AND locked_until > NOW()'
        );
        $stmt->execute([':username' => $username]);

        return (bool) $stmt->fetchColumn();
    }

    private static function recordFailure(PDO $pdo, string $username): void
    {
        $insert = $pdo->prepare(
            'INSERT INTO staff_login_attempts (username, failures) VALUES (:username, 1)'
            . ' ON DUPLICATE KEY UPDATE failures = failures + 1'
        );
        $insert->execute([':username' => $username]);

        $count = $pdo->prepare('SELECT failures FROM staff_login_attempts WHERE username = :username');
        $count->execute([':username' => $username]);
        if ((int) $count->fetchColumn() >= self::MAX_FAILURES) {
            $lock = $pdo->prepare('UPDATE staff_login_attempts SET locked_until = DATE_ADD(NOW(), INTERVAL :mins MINUTE) WHERE username = :username');
            $lock->execute([':mins' => self::LOCK_MINUTES, ':username' => $username]);
        }
    }

    private static function clearFailures(PDO $pdo, string $username): void
    {
        $stmt = $pdo->prepare('DELETE FROM staff_login_attempts WHERE username = :username');
        $stmt->execute([':username' => $username]);
    }
}
