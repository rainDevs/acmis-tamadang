<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Config\Config;

/**
 * Hardened native-PHP session handling (see RULES.md §8).
 * - Cookie name ACMISSESSID; HttpOnly always; Secure + SameSite via env.
 * - session_regenerate_id() on privilege change (login) against fixation.
 * - Server-side idle timeout (default 120 min); absolute session age is the
 *   browser-session cookie (lifetime 0).
 * - destroy() removes data, cookie, and the server-side session file.
 */
final class Session
{
    public const COOKIE_NAME = 'ACMISSESSID';
    public const IDLE_SECONDS = 7200;

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name(self::COOKIE_NAME);
        $secure = Config::env('SESSION_SECURE', '0') === '1';
        $sameSite = Config::env('SESSION_SAMESITE', 'Lax');
        if (!in_array($sameSite, ['Lax', 'Strict', 'None'], true)) {
            $sameSite = 'Lax';
        }
        // SameSite=None requires Secure or browsers reject the cookie.
        if ($sameSite === 'None') {
            $secure = true;
        }

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'secure' => $secure,
            'samesite' => $sameSite,
        ]);
        session_start();

        $now = time();
        $last = (int) ($_SESSION['last_activity'] ?? $now);
        if ($now - $last > self::IDLE_SECONDS) {
            self::destroy();
            session_start();
            $_SESSION['last_activity'] = $now;

            return;
        }
        $_SESSION['last_activity'] = $now;
    }

    public static function destroy(): void
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            $params = session_get_cookie_params();
            if (PHP_SAPI !== 'cli') {
                setcookie(
                    (string) session_name(),
                    '',
                    ['expires' => time() - 3600, 'path' => $params['path'] ?? '/', 'httponly' => true, 'secure' => (bool) ($params['secure'] ?? false), 'samesite' => $params['samesite'] ?? 'Lax']
                );
            }
            session_destroy();
        }
    }

    /**
     * @return array{id: int, username: string, display_name: string, role: string}|null
     */
    public static function currentUser(): ?array
    {
        /** @var array{id: int, username: string, display_name: string, role: string}|null $user */
        $user = $_SESSION['staff_user'] ?? null;

        return $user;
    }

    /**
     * @param array{id: int, username: string, display_name: string, role: string} $user
     */
    public static function login(array $user): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['staff_user'] = $user;
        $_SESSION['last_activity'] = time();
    }
}
