<?php

declare(strict_types=1);

/**
 * CLI test for TASK-009: public availability endpoint.
 * Run from repo root with transient dev-DB env (never commit credentials):
 *   $env:DB_HOST='localhost'; $env:DB_PORT='3306'; $env:DB_NAME='acmis_avail';
 *   $env:DB_USER='root'; $env:DB_PASS='<dev-pw>'; php backend/tests/availability_check.php
 * Builds a disposable database from the real migrations + seeders, asserts,
 * then drops it. No residue on success or failure.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Availability/AvailabilityService.php';
require_once __DIR__ . '/../src/Modules/Availability/AvailabilityController.php';

use App\Config\Config;
use App\Modules\Availability\AvailabilityController;

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

$db = Config::db();
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_avail';
$serverDsn = sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);
$dbDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $dbName, $db['charset']);
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];

/**
 * Apply one .sql file statement-by-statement. Our migration files contain only
 * plain DDL/DML (no procedures, no semicolons inside strings), so stripping
 * full-line comments and splitting on ";\n" is sufficient here. Statements run
 * via query() + closeCursor() because PDO::exec() on a result-producing
 * statement (e.g. the template's SELECT 1) crashes this PHP/mysqlnd build.
 */
function applySqlFile(PDO $pdo, string $file): void
{
    $lines = file($file, FILE_IGNORE_NEW_LINES);
    $code = '';
    foreach ($lines as $line) {
        if (str_starts_with(ltrim($line), '--')) {
            continue;
        }
        $code .= $line . "\n";
    }
    foreach (explode(";\n", $code) as $chunk) {
        $stmt = trim($chunk);
        if ($stmt !== '') {
            $result = $pdo->query($stmt);
            if ($result instanceof PDOStatement) {
                $result->closeCursor();
            }
        }
    }
}

// --- Setup: fresh disposable DB from real migrations + seeders. ---
$admin = new PDO($serverDsn, $db['user'], $db['pass'], $options);
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`");
$admin->exec("CREATE DATABASE `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

$root = dirname(__DIR__, 2);
$files = array_merge(
    glob($root . '/database/migrations/*.sql') ?: [],
    glob($root . '/database/seeders/*.sql') ?: []
);
sort($files);
$pdo = new PDO($dbDsn, $db['user'], $db['pass'], $options);
foreach ($files as $file) {
    applySqlFile($pdo, $file);
}
check('disposable DB built from migrations + seeders', true);

$manila = new DateTimeZone('Asia/Manila');
// Next Monday strictly after today (avoids partial-today edge effects).
$monday = new DateTimeImmutable('today', $manila);
do {
    $monday = $monday->add(new DateInterval('P1D'));
} while ((int) $monday->format('N') !== 1);
$mon = $monday->format('Y-m-d');
$sun = $monday->add(new DateInterval('P6D'))->format('Y-m-d');
$wed = $monday->add(new DateInterval('P2D'))->format('Y-m-d');

$now = new DateTimeImmutable('now', $manila);
$handle = static fn (array $q): array => AvailabilityController::handle($q, $GLOBALS['pdo'], $GLOBALS['now']);

try {
// --- 1. Weekday shape: 18 slots/day, all free. ---
$res = $handle(['service_id' => '1', 'from' => $mon, 'to' => $sun]);
check('week window returns 200', $res['status'] === 200);
$days = json_decode($res['body'], true)['data'];
check('7 day objects', count($days) === 7);
$weekday = null;
$weekend = null;
foreach ($days as $d) {
    if ($d['date'] === $mon) {
        $weekday = $d;
    }
    if ($d['date'] === $sun) {
        $weekend = $d;
    }
}
check('Monday has 18 slots', count($weekday['slots'] ?? []) === 18);
check('Monday totals 18/18', ($weekday['slots_left'] ?? -1) === 18 && ($weekday['capacity'] ?? -1) === 18);
check('first slot 08:00 available', ($weekday['slots'][0]['start_time'] ?? '') === '08:00' && ($weekday['slots'][0]['is_available'] ?? false) === true);
check('last slot 16:30', ($weekday['slots'][17]['start_time'] ?? '') === '16:30');
check('Sunday empty (no template)', ($weekend['slots'] ?? null) === [] && ($weekend['closed'] ?? null) === false);

// --- 2. pending booking occupies; cancelled frees. ---
$pdo->prepare(
    "INSERT INTO appointments (reference_no, service_id, appointment_date, start_time, requester_name, contact_number, status)"
    . " VALUES ('ACMIS-2026-000101', 1, :d, '08:00:00', 'Leak Probe ZXQ', '09175551234', 'pending')"
)->execute([':d' => $mon]);
$res = $handle(['service_id' => '1', 'from' => $mon, 'to' => $mon]);
$day = json_decode($res['body'], true)['data'][0];
check('pending booking zeroes the slot', ($day['slots'][0]['slots_left'] ?? -1) === 0 && ($day['slots'][0]['is_available'] ?? true) === false);
check('day total drops to 17', ($day['slots_left'] ?? -1) === 17);
check('response leaks no requester data', !str_contains($res['body'], 'Leak Probe') && !str_contains($res['body'], '0917555') && !str_contains($res['body'], 'requester') && !str_contains($res['body'], 'contact_number'));
$pdo->prepare("UPDATE appointments SET status = 'cancelled' WHERE reference_no = 'ACMIS-2026-000101'")->execute();
$day = json_decode($handle(['service_id' => '1', 'from' => $mon, 'to' => $mon])['body'], true)['data'][0];
check('cancelled booking frees the slot', ($day['slots'][0]['slots_left'] ?? -1) === 1 && ($day['slots_left'] ?? -1) === 18);

// --- 3. approved occupies; completed frees. ---
$pdo->prepare(
    "INSERT INTO appointments (reference_no, service_id, appointment_date, start_time, requester_name, contact_number, status)"
    . " VALUES ('ACMIS-2026-000102', 1, :d, '08:30:00', 'Test Resident 2', '09170000002', 'approved')"
)->execute([':d' => $mon]);
$day = json_decode($handle(['service_id' => '1', 'from' => $mon, 'to' => $mon])['body'], true)['data'][0];
check('approved booking occupies', ($day['slots'][1]['slots_left'] ?? -1) === 0);
$pdo->prepare("UPDATE appointments SET status = 'completed' WHERE reference_no = 'ACMIS-2026-000102'")->execute();
$day = json_decode($handle(['service_id' => '1', 'from' => $mon, 'to' => $mon])['body'], true)['data'][0];
check('completed booking frees', ($day['slots'][1]['slots_left'] ?? -1) === 1);

// --- 4. Closure closes the day. ---
$pdo->prepare("INSERT INTO schedule_closures (closure_date, reason) VALUES (:d, 'Test holiday')")->execute([':d' => $wed]);
$found = null;
foreach (json_decode($handle(['service_id' => '1', 'from' => $mon, 'to' => $sun])['body'], true)['data'] as $d) {
    if ($d['date'] === $wed) {
        $found = $d;
    }
}
check('closure yields closed day', ($found['closed'] ?? false) === true && ($found['slots'] ?? null) === [] && ($found['slots_left'] ?? -1) === 0);

// --- 5. Invalid params → safe 422. ---
foreach ([
    'unknown service' => ['service_id' => '999', 'from' => $mon, 'to' => $mon],
    'non-numeric service' => ['service_id' => 'abc', 'from' => $mon, 'to' => $mon],
    'bad date' => ['service_id' => '1', 'from' => 'not-a-date', 'to' => $mon],
    'impossible date' => ['service_id' => '1', 'from' => '2026-02-30', 'to' => $mon],
    'reversed range' => ['service_id' => '1', 'from' => $sun, 'to' => $mon],
    'oversize window' => ['service_id' => '1', 'from' => $mon, 'to' => $monday->add(new DateInterval('P60D'))->format('Y-m-d')],
] as $label => $q) {
    $r = $handle($q);
    $b = json_decode($r['body'], true);
    check("422 for {$label}", $r['status'] === 422 && ($b['success'] ?? null) === false && !str_contains($r['body'], 'SQL'));
}

// --- 6. Past dates: slots present but unavailable. ---
$yesterday = (new DateTimeImmutable('yesterday', $manila))->format('Y-m-d');
$past = json_decode($handle(['service_id' => '1', 'from' => $yesterday, 'to' => $yesterday])['body'], true)['data'][0] ?? null;
$anyAvail = false;
foreach (($past['slots'] ?? []) as $s) {
    $anyAvail = $anyAvail || $s['is_available'];
}
check('past date has no available slots', $past !== null && $anyAvail === false);

// --- 7. All-services default: one day object per active service. ---
$all = json_decode($handle(['from' => $mon, 'to' => $mon])['body'], true)['data'];
check('all-services returns 6 day objects', count($all) === 6);

} finally {
// --- Teardown (always runs, even on failure). ---
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All availability checks passed.\n";
