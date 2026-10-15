<?php

declare(strict_types=1);

namespace App\Shared;

/**
 * Standard JSON envelope: { success, message, data }.
 * Never include SQL errors, stack traces, file paths, or secrets here —
 * callers pass only safe messages (see RULES.md §6).
 */
final class Response
{
    public static function json(bool $success, string $message, mixed $data = null, int $status = 200): string
    {
        if (PHP_SAPI !== 'cli') {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
        }

        return (string) json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data,
        ], JSON_UNESCAPED_SLASHES);
    }
}
