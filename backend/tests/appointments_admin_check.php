<?php

declare(strict_types=1);

/**
 * CLI test for TASK-015 appointment administration (disposable DB).
 * Run from repo root with transient dev-DB env (never commit credentials):
 *   php backend/tests/appointments_admin_check.php
 * Covers auth gating, role gating, transitions, reasons, history, filters,
 * pagination, and safe errors — then drops the database.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Auth/Session.php';
require_once __DIR__ . '/../src/Modules/Auth/RequireAuth.php';
require_once __DIR__ . '/../src/Modules/Auth/AccessPolicy.php';
require_once __DIR__ . '/../src/Modules/Appointments/AppointmentAdminController.php';
require_once __DIR__ . '/../src/Modules/Appointments/AppointmentAdminService.php';

use App\Config\Config;
use App\Modules\Appointments\AppointmentAdminController;
use App\Modules\Auth\Session;

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
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_admin';
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
    '20261016000006_create_staff_users.sql',
    '20261016000007_create_staff_login_attempts.sql',
    '20261016000008_add_description_to_staff_users.sql',
    '20261016000010_create_appointment_status_history.sql',
] as $f) {
    applySqlFile($pdo, $root . '/database/migrations/' . $f);
}
applySqlFile($pdo, $root . '/database/seeders/20261016000001_appointment_services.sql');
applySqlFile($pdo, $root . '/database/seeders/20261016000002_clinic_schedules_weekday.sql');
check('disposable DB built', true);

$pdo->prepare(
    "INSERT INTO staff_users (username, password_hash, display_name, role, is_active)"
    . " VALUES ('boss', :hash, 'Boss Admin', 'admin', 1)"
)->execute([':hash' => password_hash('correct-horse-10', PASSWORD_DEFAULT)]);
$adminId = (int) $pdo->lastInsertId();
$pdo->prepare(
    "INSERT INTO staff_users (username, password_hash, display_name, role, is_active)"
    . " VALUES ('eyes', :hash, 'Eyes Staff', 'staff', 1)"
)->execute([':hash' => password_hash('correct-horse-10', PASSWORD_DEFAULT)]);

$refs = ['ACMIS-2026-000301', 'ACMIS-2026-000302', 'ACMIS-2026-000303', 'ACMIS-2026-000304', 'ACMIS-2026-000305', 'ACMIS-2026-000306', 'ACMIS-2026-000307'];
foreach ($refs as $i => $ref) {
    $pdo->prepare(
        "INSERT INTO appointments (reference_no, service_id, appointment_date, start_time, requester_name, contact_number, address, status)"
        . " VALUES (:ref, 1, '2026-10-2" . ($i % 2 === 0 ? '0' : '1') . "', '09:00', :name, '09170000001', 'Purok 1, Tamadang', 'pending')"
    )->execute([':ref' => $ref, ':name' => 'Test Resident ' . ($i + 1)]);
}

Session::start();
Session::destroy();

// 1. Guests are denied everywhere with 401.
check('guest list 401', (AppointmentAdminController::list([], $pdo)['status'] ?? 0) === 401);
check('guest detail 401', (AppointmentAdminController::detail($refs[0], $pdo)['status'] ?? 0) === 401);
check('guest patch 401', (AppointmentAdminController::updateStatus(['status' => 'approved'], $refs[0], $pdo)['status'] ?? 0) === 401);

// 2. Staff role: list + detail 200, PATCH 403.
Session::login(['id' => 99, 'username' => 'eyes', 'display_name' => 'Eyes Staff', 'role' => 'staff']);
$r = AppointmentAdminController::list([], $pdo);
check('staff list 200', ($r['status'] ?? 0) === 200 && count(body($r)['data']['rows'] ?? []) === 5);
check('staff list counts', (body($r)['data']['counts']['pending'] ?? 0) === 7);
check('staff list hides contact', !str_contains((string) $r['body'], '09170000001'));
$r = AppointmentAdminController::detail($refs[0], $pdo);
check('staff detail 200 with contact+history', ($r['status'] ?? 0) === 200 && isset(body($r)['data']['contact_number'], body($r)['data']['history']));
$r = AppointmentAdminController::updateStatus(['status' => 'approved'], $refs[0], $pdo);
check('staff patch 403', ($r['status'] ?? 0) === 403);
Session::destroy();

// 3. Admin: approve → history; illegal repeat; reason rules; full lifecycle.
Session::login(['id' => $adminId, 'username' => 'boss', 'display_name' => 'Boss Admin', 'role' => 'admin']);
$r = AppointmentAdminController::updateStatus(['status' => 'approved'], $refs[0], $pdo);
$d = body($r)['data'] ?? [];
check('admin approve 200 pending→approved', ($r['status'] ?? 0) === 200 && ($d['status'] ?? '') === 'approved');
check('history records actor', ($d['history'][0]['actor'] ?? '') === 'Boss Admin');
$r = AppointmentAdminController::updateStatus(['status' => 'approved'], $refs[0], $pdo);
check('repeat approve 422', ($r['status'] ?? 0) === 422);
$r = AppointmentAdminController::updateStatus(['status' => 'rejected'], $refs[1], $pdo);
check('reject without reason 422', ($r['status'] ?? 0) === 422);
$r = AppointmentAdminController::updateStatus(['status' => 'rejected', 'reason' => 'Duplicate request.'], $refs[1], $pdo);
$d = body($r)['data'] ?? [];
check('reject with reason 200 + note stored', ($r['status'] ?? 0) === 200 && ($d['history'][0]['note'] ?? '') === 'Duplicate request.');
$r = AppointmentAdminController::updateStatus(['status' => 'completed'], $refs[2], $pdo);
check('pending→completed 422', ($r['status'] ?? 0) === 422);
$r = AppointmentAdminController::updateStatus(['status' => 'bogus'], $refs[2], $pdo);
check('unknown status 422', ($r['status'] ?? 0) === 422);
$r = AppointmentAdminController::updateStatus(['status' => 'completed'], $refs[0], $pdo);
check('approved→completed 200', ($r['status'] ?? 0) === 200);
$r = AppointmentAdminController::updateStatus(['status' => 'cancelled', 'reason' => 'No show risk.'], $refs[0], $pdo);
check('completed is terminal 422', ($r['status'] ?? 0) === 422);
$r = AppointmentAdminController::detail('ACMIS-2026-999999', $pdo);
check('unknown reference 404', ($r['status'] ?? 0) === 404);
$r = AppointmentAdminController::detail('not-a-ref', $pdo);
check('malformed reference 404', ($r['status'] ?? 0) === 404);

// 4. Filters + pagination + invalid filters.
$r = AppointmentAdminController::list(['status' => 'pending'], $pdo);
check('status filter (5 pending left)', ($r['status'] ?? 0) === 200 && (body($r)['data']['total'] ?? -1) === 5);
$r = AppointmentAdminController::list(['q' => '000303'], $pdo);
check('q filter by reference', ($r['status'] ?? 0) === 200 && (body($r)['data']['total'] ?? -1) === 1);
$r = AppointmentAdminController::list(['per_page' => '5', 'page' => '2'], $pdo);
$d = body($r)['data'] ?? [];
check('pagination page 2', ($r['status'] ?? 0) === 200 && ($d['page'] ?? 0) === 2 && count($d['rows'] ?? []) === 2);
$r = AppointmentAdminController::list(['status' => 'bogus'], $pdo);
check('bad status filter 422', ($r['status'] ?? 0) === 422);
$r = AppointmentAdminController::list(['date_from' => '2026-13-99'], $pdo);
check('bad date filter 422', ($r['status'] ?? 0) === 422);

// 5. Leak scan on error bodies.
$leak = (string) AppointmentAdminController::updateStatus(['status' => 'approved'], $refs[1], $pdo)['body']
    . (string) AppointmentAdminController::detail('ACMIS-2026-999999', $pdo)['body'];
check('error bodies leak nothing', !str_contains($leak, 'SELECT') && !str_contains($leak, '.php') && !str_contains($leak, 'staff_users'));
Session::destroy();
} finally {
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All appointment-admin checks passed.\n";
