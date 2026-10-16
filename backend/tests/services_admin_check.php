<?php

declare(strict_types=1);

/**
 * CLI test for TASK-020 services administration (disposable DB).
 * Run from repo root with transient dev-DB env (never commit credentials):
 *   php backend/tests/services_admin_check.php
 * Covers auth/role gating, edit-only rules, validation, closures CRUD,
 * and safe errors — then drops the database.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Auth/Session.php';
require_once __DIR__ . '/../src/Modules/Auth/RequireAuth.php';
require_once __DIR__ . '/../src/Modules/Auth/AccessPolicy.php';
require_once __DIR__ . '/../src/Modules/Appointments/AppointmentAdminService.php';
require_once __DIR__ . '/../src/Modules/Services/ServicesAdminService.php';
require_once __DIR__ . '/../src/Modules/Services/ServicesAdminController.php';

use App\Config\Config;
use App\Modules\Auth\Session;
use App\Modules\Services\ServicesAdminController;

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
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_svcadm';
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
] as $f) {
    applySqlFile($pdo, $root . '/database/migrations/' . $f);
}
applySqlFile($pdo, $root . '/database/seeders/20261016000001_appointment_services.sql');
applySqlFile($pdo, $root . '/database/seeders/20261016000002_clinic_schedules_weekday.sql');
check('disposable DB built', true);

Session::start();
Session::destroy();

// 1. Guests 401 everywhere.
check('guest services 401', (ServicesAdminController::listServices($pdo)['status'] ?? 0) === 401);
check('guest schedules 401', (ServicesAdminController::listSchedules([], $pdo)['status'] ?? 0) === 401);
check('guest closures 401', (ServicesAdminController::listClosures($pdo)['status'] ?? 0) === 401);
check('guest patch service 401', (ServicesAdminController::updateService(['duration_minutes' => 20], 1, $pdo)['status'] ?? 0) === 401);
check('guest post closure 401', (ServicesAdminController::addClosure(['closure_date' => '2026-12-25'], $pdo)['status'] ?? 0) === 401);
check('guest delete closure 401', (ServicesAdminController::deleteClosure(1, $pdo)['status'] ?? 0) === 401);

// 2. Staff role 403 everywhere (matrix: services admin+).
Session::login(['id' => 31, 'username' => 'eyes', 'display_name' => 'Eyes Staff', 'role' => 'staff']);
check('staff services 403', (ServicesAdminController::listServices($pdo)['status'] ?? 0) === 403);
check('staff patch schedule 403', (ServicesAdminController::updateSchedule(['capacity_per_slot' => 2], 1, $pdo)['status'] ?? 0) === 403);
check('staff post closure 403', (ServicesAdminController::addClosure(['closure_date' => '2026-12-25'], $pdo)['status'] ?? 0) === 403);
Session::destroy();

// 3. Admin: services list + edits.
Session::login(['id' => 32, 'username' => 'boss', 'display_name' => 'Boss Admin', 'role' => 'admin']);
$r = ServicesAdminController::listServices($pdo);
$d = body($r)['data'] ?? null;
check('admin services 200 (6 rows)', ($r['status'] ?? 0) === 200 && count($d['services'] ?? []) === 6);
$r = ServicesAdminController::updateService(['description' => 'All-ages checkups.', 'duration_minutes' => 20], 1, $pdo);
$d = body($r)['data'] ?? [];
check('admin service edit 200', ($r['status'] ?? 0) === 200 && ($d['duration_minutes'] ?? 0) === 20 && ($d['description'] ?? '') === 'All-ages checkups.');
$r = ServicesAdminController::updateService(['name' => 'New Name'], 1, $pdo);
check('service rename rejected 422', ($r['status'] ?? 0) === 422);
$r = ServicesAdminController::updateService(['duration_minutes' => 0], 1, $pdo);
check('bad duration 422', ($r['status'] ?? 0) === 422);
$r = ServicesAdminController::updateService(['is_active' => false], 2, $pdo);
check('service deactivate 200', ($r['status'] ?? 0) === 200 && ($d = body($r)['data']) && $d['is_active'] === false);
$r = ServicesAdminController::updateService(['duration_minutes' => 30], 999, $pdo);
check('unknown service 404', ($r['status'] ?? 0) === 404);

// 4. Admin: schedules list + edits.
$r = ServicesAdminController::listSchedules([], $pdo);
check('admin schedules 200 (5 rows)', ($r['status'] ?? 0) === 200 && count((body($r)['data']['schedules'] ?? [])) === 5);
$id = (int) (body($r)['data']['schedules'][0]['id'] ?? 0);
$r = ServicesAdminController::updateSchedule(['start_time' => '08:30', 'end_time' => '16:30', 'capacity_per_slot' => 2], $id, $pdo);
$d = body($r)['data'] ?? [];
check('admin schedule edit 200', ($r['status'] ?? 0) === 200 && ($d['start_time'] ?? '') === '08:30' && ($d['capacity_per_slot'] ?? 0) === 2);
$r = ServicesAdminController::updateSchedule(['start_time' => '16:00', 'end_time' => '09:00'], $id, $pdo);
check('bad window 422', ($r['status'] ?? 0) === 422);
$r = ServicesAdminController::updateSchedule(['day_of_week' => 6], $id, $pdo);
check('structure field rejected 422', ($r['status'] ?? 0) === 422);
$r = ServicesAdminController::updateSchedule(['capacity_per_slot' => 2], 999, $pdo);
check('unknown schedule 404', ($r['status'] ?? 0) === 404);

// 5. Admin: closures CRUD.
$r = ServicesAdminController::listClosures($pdo);
check('closures start empty 200 []', ($r['status'] ?? 0) === 200 && (body($r)['data']['closures'] ?? null) === []);
$r = ServicesAdminController::addClosure(['closure_date' => '2026-12-25', 'reason' => 'Christmas Day'], $pdo);
$cid = (int) ((body($r)['data'] ?? [])['id'] ?? 0);
check('add closure 201', ($r['status'] ?? 0) === 201 && $cid > 0);
$r = ServicesAdminController::addClosure(['closure_date' => '2026-12-25'], $pdo);
check('duplicate closure 409', ($r['status'] ?? 0) === 409);
$r = ServicesAdminController::addClosure(['closure_date' => '25-12-2026'], $pdo);
check('bad closure date 422', ($r['status'] ?? 0) === 422);
$r = ServicesAdminController::deleteClosure(999999, $pdo);
check('delete missing closure 404', ($r['status'] ?? 0) === 404);
$r = ServicesAdminController::deleteClosure($cid, $pdo);
check('delete closure 200', ($r['status'] ?? 0) === 200);
$r = ServicesAdminController::listClosures($pdo);
check('closures empty again', ($r['status'] ?? 0) === 200 && (body($r)['data']['closures'] ?? null) === []);

// 6. Leak scan.
$leak = (string) ServicesAdminController::updateService(['name' => 'x'], 1, $pdo)['body'];
check('error bodies leak nothing', !str_contains($leak, 'SELECT') && !str_contains($leak, '.php'));
Session::destroy();
} finally {
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All services-admin checks passed.\n";
