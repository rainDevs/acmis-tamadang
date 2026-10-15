<?php

declare(strict_types=1);

namespace App\Modules\Health;

/**
 * Liveness probe only. No database, no auth, no business rules.
 */
final class HealthController
{
    /**
     * @return array{status: int, body: string}
     */
    public static function check(): array
    {
        $payload = [
            'success' => true,
            'message' => 'ACMIS API is running.',
            'data' => [
                'status' => 'ok',
                'time' => gmdate('c'),
            ],
        ];

        return [
            'status' => 200,
            'body' => (string) json_encode($payload, JSON_UNESCAPED_SLASHES),
        ];
    }
}
