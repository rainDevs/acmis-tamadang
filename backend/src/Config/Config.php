<?php

declare(strict_types=1);

namespace App\Config;

/**
 * Environment-based configuration. Placeholders only — never commit real secrets.
 * Reads from getenv() so php -S, Apache/XAMPP, and CLI all work the same way.
 * See backend/.env.example for the full variable list.
 */
final class Config
{
    /**
     * @param string $default
     */
    public static function env(string $key, string $default = ''): string
    {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }

        return (string) $value;
    }

    /**
     * Load KEY=VALUE pairs from a .env file into the process environment.
     * Real environment variables always win; values are never logged.
     * Call once at bootstrap (front controller, CLI tests set their own env).
     */
    public static function loadEnvFile(string $path): void
    {
        if (!is_file($path) || !is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));
            if ($key === '' || getenv($key) !== false) {
                continue;
            }
            if (strlen($value) >= 2 && str_starts_with($value, '"') && str_ends_with($value, '"')) {
                $value = stripcslashes(substr($value, 1, -1));
            } elseif (strlen($value) >= 2 && str_starts_with($value, "'") && str_ends_with($value, "'")) {
                $value = substr($value, 1, -1);
            }
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }

    /**
     * Database connection settings (no connection made here).
     *
     * @return array{host: string, port: string, name: string, user: string, pass: string, charset: string}
     */
    public static function db(): array
    {
        return [
            'host' => self::env('DB_HOST', 'localhost'),
            'port' => self::env('DB_PORT', '3306'),
            'name' => self::env('DB_NAME', 'acmis'),
            'user' => self::env('DB_USER', ''),
            'pass' => self::env('DB_PASS', ''),
            'charset' => self::env('DB_CHARSET', 'utf8mb4'),
        ];
    }
}
