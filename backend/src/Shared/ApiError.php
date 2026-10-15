<?php

declare(strict_types=1);

namespace App\Shared;

use Throwable;

/**
 * Standard safe-error envelopes (see RULES.md §6, §13).
 * Client receives only safe messages; diagnostics stay server-side via error_log.
 * Never pass SQL errors, stack traces, file paths, DSNs, or secrets as $message.
 */
final class ApiError
{
    /**
     * @return array{status: int, body: string}
     */
    private static function fail(string $message, int $status): array
    {
        return [
            'status' => $status,
            'body' => Response::json(false, $message, null, $status),
        ];
    }

    /**
     * @param array<string, string> $fields field => message (values must already be safe)
     * @return array{status: int, body: string}
     */
    public static function validation(string $message = 'Invalid input.', array $fields = []): array
    {
        return [
            'status' => 422,
            'body' => Response::json(false, $message, ['fields' => $fields], 422),
        ];
    }

    /**
     * @return array{status: int, body: string}
     */
    public static function unauthenticated(): array
    {
        return self::fail('Authentication required.', 401);
    }

    /**
     * @return array{status: int, body: string}
     */
    public static function forbidden(): array
    {
        return self::fail('You do not have permission to perform this action.', 403);
    }

    /**
     * @return array{status: int, body: string}
     */
    public static function notFound(): array
    {
        return self::fail('Not found.', 404);
    }

    /**
     * @return array{status: int, body: string}
     */
    public static function unavailable(): array
    {
        return self::fail('Database unavailable.', 503);
    }

    /**
     * @return array{status: int, body: string}
     */
    public static function serverError(): array
    {
        return self::fail('An unexpected error occurred.', 500);
    }

    /**
     * Log server-side detail without secrets. Call before returning a safe 500/503.
     * Logs exception class + code only; scrubs any configured DB password out of the message.
     */
    public static function log(string $context, Throwable $e): void
    {
        $pass = (string) getenv('DB_PASS');
        $message = $e->getMessage();
        if ($pass !== '') {
            $message = str_replace($pass, '***', $message);
        }
        // Keep the log line free of stack traces (which may contain paths/args).
        error_log(sprintf(
            'ACMIS %s: %s (code %s) msg_len=%d',
            $context,
            $e::class,
            (string) $e->getCode(),
            strlen($message)
        ));
    }
}
