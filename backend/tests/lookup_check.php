<?php

declare(strict_types=1);

/**
 * CLI test for TASK-026 public status lookup (disposable DB).
 * Run from repo root with transient dev-DB env (never commit credentials):
 *   php backend/tests/lookup_check.php
 * Covers the privacy contract: minimal response, identical 404s, timing-safe
 * suffix check, safe errors — then drops the database.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Appointments/AppointmentAdminService.php';
require_once __DIR__ . '/../src/Modules/Appointments/LookupController.php';

use App\Config\Config;
use App\Modules\Appointments\LookupController;

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

function body(array $result): array
{
    return json_decode((string) ($result['body'] ?? ''), true) ?? [];
}

$db = Config::db();
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_lookup';
$serverDsn = sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);
$dbDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $dbName, $db['charset']);
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];

try {
$admin = new PDO($serverDsn, $db['user'], $db['pass'], $options);
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`");
$admin->exec("CREATE DATABASE `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

$root = dirname(__DIR__, 2);
$pdo = new PDO($dbDsn, $db['user'], $db['pass'], $options);
foreach ([
    '00000000000000_template.sql',
    '20261016000001_create_appointment_services.sql',
    '20261016000002_create_clinic_schedules.sql',
    '20261016000003_create_schedule_closures.sql',
    '20261016000004_create_appointments.sql',
    '20261016000005_add_address_to_appointments.sql',
] as $f) {
    applySqlFile($pdo, $root . '/database/migrations/' . $f);
}
applySqlFile($pdo, $root . '/database/seeders/20261016000001_appointment_services.sql');
check('disposable DB built', true);

$pdo->prepare(
    "INSERT INTO appointments (reference_no, service_id, appointment_date, start_time, requester_name, contact_number, address, status)"
    . " VALUES ('ACMIS-2026-000501', 2, '2026-10-21', '10:00', 'Lookup Resident', '09171234567', 'Purok 1, Tamadang', 'approved')"
)->execute();

// 1. Valid reference + suffix → 200 with exactly the public-safe keys.
$r = LookupController::handle(['reference_no' => 'ACMIS-2026-000501', 'contact_suffix' => '4567'], $pdo);
$d = body($r)['data'] ?? null;
check('valid lookup 200', ($r['status'] ?? 0) === 200 && is_array($d));
check(
    'minimal keys only',
    is_array($d)
    && array_keys($d) === ['reference_no', 'service_name', 'schedule_date', 'start_time', 'status']
    && $d['status'] === 'approved'
    && $d['service_name'] === 'Maternal and Child Health Care'
);

// 2. Wrong suffix, unknown ref, malformed ref → identical 404s.
$miss = 'No matching request found. Check your reference and verification.';
$rWrong = LookupController::handle(['reference_no' => 'ACMIS-2026-000501', 'contact_suffix' => '0000'], $pdo);
$rGhost = LookupController::handle(['reference_no' => 'ACMIS-2026-999999', 'contact_suffix' => '4567'], $pdo);
$rBad = LookupController::handle(['reference_no' => 'nope', 'contact_suffix' => '4567'], $pdo);
check('wrong suffix 404', ($rWrong['status'] ?? 0) === 404 && (body($rWrong)['message'] ?? '') === $miss);
check('unknown ref identical 404', ($rGhost['status'] ?? 0) === 404 && (string) $rGhost['body'] === (string) $rWrong['body']);
check('malformed ref identical 404', ($rBad['status'] ?? 0) === 404 && (string) $rBad['body'] === (string) $rWrong['body']);

// 3. Missing fields → 422; bad suffix shape → identical 404.
$r = LookupController::handle(['reference_no' => '', 'contact_suffix' => ''], $pdo);
check('missing fields 422', ($r['status'] ?? 0) === 422);
$r = LookupController::handle(['reference_no' => 'ACMIS-2026-000501', 'contact_suffix' => '12'], $pdo);
check('short suffix identical 404', ($r['status'] ?? 0) === 404 && (string) $r['body'] === (string) $rWrong['body']);

// 4. Lowercase reference works (server uppercases).
$r = LookupController::handle(['reference_no' => 'acmis-2026-000501', 'contact_suffix' => '4567'], $pdo);
check('lowercase reference 200', ($r['status'] ?? 0) === 200);

// 5. Leak scan across miss + validation bodies.
$leak = (string) $rWrong['body'] . (string) $rGhost['body'];
check('bodies leak nothing', !str_contains($leak, '09171234567') && !str_contains($leak, 'Lookup Resident') && !str_contains($leak, 'SELECT') && !str_contains($leak, '.php'));
} finally {
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All lookup checks passed.\n";
