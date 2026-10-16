<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Config\Config;
use App\Database\Connection;
use App\Shared\ApiError;
use App\Shared\Response;
use PDO;
use Throwable;

/**
 * POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me.
 * Login/logout additionally require the request Origin (when present) to
 * match the API host — cheap CSRF mitigation for cookie auth. Full token
 * flow is deferred (see TASKS.md TASK-013): production is same-origin with
 * SameSite=Lax, which already withholds cookies on cross-site POSTs.
 */
final class AuthController
{
    /**
     * @param array<string, mixed>|null $body decoded JSON; null reads php://input (live HTTP)
     */
    public static function login(?array $body = null, ?PDO $pdo = null): array
    {
        if (!self::originAllowed()) {
            return ApiError::forbidden();
        }

        if ($body === null) {
            $decoded = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($decoded)) {
                return self::invalid('Invalid request body.');
            }
            $body = $decoded;
        }

        $username = trim((string) ($body['username'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        if ($username === '' || $password === '') {
            return [
                'status' => 401,
                'body' => Response::json(false, 'Incorrect username or password.', null, 401),
            ];
        }

        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('auth-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $result = AuthService::attempt($pdo, $username, $password);
        } catch (Throwable $e) {
            ApiError::log('auth-attempt', $e);

            return ApiError::serverError();
        }

        if (isset($result['locked'])) {
            error_log(sprintf('ACMIS auth locked: %s', $username));

            return [
                'status' => 429,
                'body' => Response::json(false, 'Too many failed attempts. Try again later.', null, 429),
            ];
        }

        if (!isset($result['user'])) {
            error_log(sprintf('ACMIS auth failed: %s', $username));

            return [
                'status' => 401,
                'body' => Response::json(false, 'Incorrect username or password.', null, 401),
            ];
        }

        Session::login($result['user']);
        error_log(sprintf('ACMIS auth success: %s', $result['user']['username']));

        return [
            'status' => 200,
            'body' => Response::json(true, 'Signed in.', ['user' => $result['user']], 200),
        ];
    }

    public static function logout(): array
    {
        if (!self::originAllowed()) {
            return ApiError::forbidden();
        }

        Session::start();
        Session::destroy();

        return [
            'status' => 200,
            'body' => Response::json(true, 'Signed out.', null, 200),
        ];
    }

    public static function me(): array
    {
        Session::start();
        $user = Session::currentUser();

        if ($user === null) {
            return ApiError::unauthenticated();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Session active.', ['user' => $user], 200),
        ];
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

    /**
     * Browsers send Origin on cross-origin POSTs. When present it must match
     * this API's own host; absence (same-origin form posts, curl) is allowed.
     */
    private static function originAllowed(): bool
    {
        $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
        if ($origin === '') {
            return true;
        }

        $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
        $appHost = strtolower((string) parse_url(Config::env('APP_URL', ''), PHP_URL_HOST));
        $serverHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));

        return $originHost !== '' && ($originHost === $appHost || $originHost === $serverHost);
    }
}
