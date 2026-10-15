<?php

declare(strict_types=1);

/**
 * CLI smoke test for the health endpoint (no web server needed).
 * Run from repo root: php backend/tests/health_check.php
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Modules/Health/HealthController.php';

use App\Modules\Health\HealthController;
use App\Shared\Response;

$failures = 0;

/**
 * @param bool $condition
 */
function check(string $name, bool $condition): void
{
    global $failures;
    if ($condition) {
        echo "PASS: {$name}\n";
    } else {
        $failures++;
        echo "FAIL: {$name}\n";
    }
}

// 1. Health payload shape.
$result = HealthController::check();
check('health returns status 200', $result['status'] === 200);

$body = json_decode($result['body'], true);
check('health body is valid JSON array', is_array($body));
check('health envelope success=true', ($body['success'] ?? null) === true);
check('health data.status=ok', ($body['data']['status'] ?? null) === 'ok');
check('health data.time present', is_string($body['data']['time'] ?? null) && $body['data']['time'] !== '');

// 2. Standard envelope shape for errors (safe 404 message, no internals).
$notFound = Response::json(false, 'Not found.', null, 404);
$decoded = json_decode($notFound, true);
check('404 envelope success=false', ($decoded['success'] ?? null) === false);
check('404 envelope message safe', ($decoded['message'] ?? null) === 'Not found.');
check('404 envelope has data key', array_key_exists('data', (array) $decoded));
check('404 body leaks no paths', str_contains($notFound, 'backend') === false && str_contains($notFound, 'C:\\') === false);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All health checks passed.\n";
