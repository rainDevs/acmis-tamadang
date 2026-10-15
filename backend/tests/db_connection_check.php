<?php

declare(strict_types=1);

/**
 * CLI test for TASK-007: DB connection factory + safe error conventions.
 * Run from repo root: php backend/tests/db_connection_check.php
 * No MySQL server required: unreachable-host and injected-PDO paths cover both outcomes.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Health/DbHealthController.php';

use App\Config\Config;
use App\Database\Connection;
use App\Modules\Health\DbHealthController;
use App\Shared\ApiError;

$failures = 0;

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

// 1. Config defaults (no secrets in code).
putenv('DB_HOST');
putenv('DB_PORT');
putenv('DB_NAME');
putenv('DB_USER');
putenv('DB_PASS');
putenv('DB_CHARSET');
$cfg = Config::db();
check('config defaults host', $cfg['host'] === 'localhost');
check('config defaults port', $cfg['port'] === '3306');
check('config defaults name', $cfg['name'] === 'acmis');
check('config defaults charset', $cfg['charset'] === 'utf8mb4');
check('config defaults empty credentials', $cfg['user'] === '' && $cfg['pass'] === '');

// 2. Error envelopes: correct codes + safe fixed messages.
$unauth = ApiError::unauthenticated();
check('401 status', $unauth['status'] === 401);
check('401 safe message', str_contains($unauth['body'], 'Authentication required.'));

$forbid = ApiError::forbidden();
check('403 status', $forbid['status'] === 403);

$validation = ApiError::validation('Name is required.', ['name' => 'Name is required.']);
$decoded = json_decode($validation['body'], true);
check('422 status', $validation['status'] === 422);
check('422 envelope shape', ($decoded['success'] ?? null) === false && isset($decoded['data']['fields']['name']));

$server = ApiError::serverError();
check('500 safe message', $server['status'] === 500 && str_contains($server['body'], 'An unexpected error occurred.'));

$unavail = ApiError::unavailable();
check('503 safe message', $unavail['status'] === 503 && str_contains($unavail['body'], 'Database unavailable.'));

// 3. Safe bodies leak nothing (no paths, DSN fragments, or credential keys).
foreach (['401' => $unauth['body'], '403' => $forbid['body'], '500' => $server['body'], '503' => $unavail['body']] as $label => $body) {
    $lower = strtolower($body);
    check("{$label} leaks no internals", !str_contains($lower, 'sql') && !str_contains($body, 'mysql:host') && !str_contains($body, 'DB_PASS') && !str_contains($body, 'C:\\'));
}

// 4. Unreachable MySQL fails safely (no credential/DSN in the thrown message path we expose).
putenv('DB_PASS=secret-pw-should-never-leak');
$badCfg = array_merge(Config::db(), ['host' => 'invalid-host-that-does-not-resolve', 'port' => '3306']);
$threw = false;
$leaked = false;
try {
    Connection::make($badCfg);
} catch (Throwable $e) {
    $threw = true;
    // The raw exception stays server-side; what we would send is the fixed 503 instead.
    $safe = ApiError::unavailable();
    $leaked = str_contains($safe['body'], 'secret-pw-should-never-leak') || str_contains($safe['body'], 'invalid-host');
}
check('unreachable DB throws (factory does not swallow)', $threw);
check('safe 503 leaks neither password nor host', $leaked === false);
putenv('DB_PASS');

// 5. DbHealthController maps failure to safe 503 via injected failing connector.
$failResult = DbHealthController::check(static function (array $cfg): never {
    throw new RuntimeException('simulated connect failure');
});
check('db-health failure maps to 503', $failResult['status'] === 503 && str_contains($failResult['body'], 'Database unavailable.'));

// 6. DbHealthController success path via injected in-memory PDO (test-only stand-in for MySQL).
if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    echo "SKIP: sqlite PDO driver not available; success-path probe not run.\n";
} else {
    $okResult = DbHealthController::check(static function (array $cfg): PDO {
        $pdo = new PDO('sqlite::memory:');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    });
    $okBody = json_decode($okResult['body'], true);
    check('db-health success returns 200 ok', $okResult['status'] === 200 && ($okBody['data']['status'] ?? null) === 'ok');

    // 7. Prepared-statement convention works (variable input bound, never concatenated).
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE probe (id INTEGER PRIMARY KEY, name TEXT)');
    $stmt = $pdo->prepare('INSERT INTO probe (name) VALUES (:name)');
    $stmt->execute([':name' => 'Test Resident 1']);
    $sel = $pdo->prepare('SELECT name FROM probe WHERE name = :name');
    $sel->execute([':name' => 'Test Resident 1']);
    check('prepared statements round-trip', $sel->fetchColumn() === 'Test Resident 1');
    check('PDO ping succeeds', Connection::ping($pdo) === true);
}

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All DB connection checks passed.\n";
