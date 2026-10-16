<?php

declare(strict_types=1);

/**
 * CLI test for TASK-010: public appointment creation endpoint.
 * Run from repo root with transient dev-DB env (never commit credentials):
 *   $env:DB_HOST='localhost'; $env:DB_PORT='3306'; $env:DB_NAME='acmis_book';
 *   $env:DB_USER='root'; $env:DB_PASS='<dev-pw>'; php backend/tests/appointment_create_check.php
 * Builds a disposable database from the real migrations + seeders, asserts,
 * then drops it. No residue on success or failure.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Availability/AvailabilityService.php';
require_once __DIR__ . '/../src/Modules/Availability/AvailabilityController.php';
require_once __DIR__ . '/../src/Modules/Appointments/SlotTakenException.php';
require_once __DIR__ . '/../src/Modules/Appointments/AppointmentService.php';
require_once __DIR__ . '/../src/Modules/Appointments/AppointmentController.php';

use App\Config\Config;
use App\Modules\Appointments\AppointmentController;

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

$db = Config::db();
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_book';
$serverDsn = sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);
$dbDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $dbName, $db['charset']);
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];

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
$now = new DateTimeImmutable('now', $manila);
// Next Monday strictly after today (future templated day).
$monday = new DateTimeImmutable('today', $manila);
do {
    $monday = $monday->add(new DateInterval('P1D'));
} while ((int) $monday->format('N') !== 1);
$mon = $monday->format('Y-m-d');
$sat = $monday->add(new DateInterval('P5D'))->format('Y-m-d');
$tue = $monday->add(new DateInterval('P1D'))->format('Y-m-d');
$yesterday = (new DateTimeImmutable('yesterday', $manila))->format('Y-m-d');

$valid = static fn (string $date, string $time): array => [
    'full_name' => 'Test Resident 1',
    'contact_number' => '0917 000 0001',
    'address' => 'Purok 1, Tamadang',
    'service_id' => '1',
    'appointment_date' => $date,
    'start_time' => $time,
];
$book = static fn (array $b): array => AppointmentController::handle($b, $GLOBALS['pdo'], $GLOBALS['now']);

try {
// --- 1. Valid booking → 201 + persisted row. ---
$res = $book($valid($mon, '08:00'));
check('valid booking returns 201', $res['status'] === 201);
$data = json_decode($res['body'], true)['data'];
check('reference format + pending', (bool) preg_match('/^ACMIS-\d{4}-\d{6}$/', (string) ($data['reference_no'] ?? '')) && ($data['status'] ?? '') === 'pending');
check('echoes slot fields', ($data['service_id'] ?? 0) === 1 && ($data['appointment_date'] ?? '') === $mon && ($data['start_time'] ?? '') === '08:00');
$row = $pdo->query("SELECT * FROM appointments WHERE reference_no = " . $pdo->quote((string) $data['reference_no']))->fetch();
check('row persisted with normalized contact', $row !== false && ($row['contact_number'] ?? '') === '09170000001' && ($row['requester_name'] ?? '') === 'Test Resident 1' && ($row['address'] ?? '') === 'Purok 1, Tamadang');

// --- 2. Same slot twice → 409, single row. ---
$second = $book($valid($mon, '08:00'));
$secondBody = json_decode($second['body'], true);
check('double booking returns 409', $second['status'] === 409 && ($secondBody['success'] ?? null) === false);
check('409 message safe', str_contains($second['body'], 'no longer available') && !str_contains($second['body'], 'SQL') && !str_contains($second['body'], 'SELECT'));
$count = (int) $pdo->query("SELECT COUNT(*) FROM appointments WHERE service_id = 1 AND appointment_date = '{$mon}' AND start_time = '08:00:00' AND status IN ('pending','approved')")->fetchColumn();
check('only one occupying row', $count === 1);

// --- 3. Cancelled slot re-bookable → 201, distinct reference. ---
$pdo->exec("UPDATE appointments SET status = 'cancelled' WHERE appointment_date = '{$mon}' AND start_time = '08:00:00'");
$third = $book($valid($mon, '08:00'));
$thirdData = json_decode($third['body'], true)['data'];
check('cancelled slot re-books', $third['status'] === 201);
check('references differ', ($thirdData['reference_no'] ?? '') !== ($data['reference_no'] ?? ''));

// --- 4. Validation → safe 422. ---
$base = $valid($tue, '09:00');
$cases = [
    'missing name' => array_merge($base, ['full_name' => '  ']),
    'missing contact' => array_merge($base, ['contact_number' => '']),
    'missing address' => array_merge($base, ['address' => '  ']),
    'bad mobile short' => array_merge($base, ['contact_number' => '09170001']),
    'bad mobile landline' => array_merge($base, ['contact_number' => '028931234']),
    'unknown service' => array_merge($base, ['service_id' => '999']),
    'non-numeric service' => array_merge($base, ['service_id' => 'x']),
    'past date' => array_merge($base, ['appointment_date' => $yesterday]),
    'bad date' => array_merge($base, ['appointment_date' => '2026-13-40']),
    'weekend date' => array_merge($base, ['appointment_date' => $sat]),
    'off-grid time' => array_merge($base, ['start_time' => '08:15']),
    'bad time' => array_merge($base, ['start_time' => '25:00']),
    'missing time' => array_merge($base, ['start_time' => '']),
];
foreach ($cases as $label => $payload) {
    $r = $book($payload);
    $b = json_decode($r['body'], true);
    check("422 for {$label}", $r['status'] === 422 && ($b['success'] ?? null) === false && !str_contains($r['body'], 'SQL'));
}

// --- 5. Closure date → 422. ---
$pdo->prepare("INSERT INTO schedule_closures (closure_date, reason) VALUES (:d, 'Test holiday')")->execute([':d' => $tue]);
$r = $book($valid($tue, '09:00'));
check('422 for closure date', $r['status'] === 422);

// --- 6. Same-day past slot → 422; future slot → 201 (fixed clock). ---
$todayStr = (new DateTimeImmutable('today', $manila))->format('Y-m-d');
$dowToday = (int) (new DateTimeImmutable('today', $manila))->format('N');
if ($dowToday <= 5) {
    $late = new DateTimeImmutable($todayStr . ' 16:00:00', $manila);
    $early = new DateTimeImmutable($todayStr . ' 07:00:00', $manila);
    $rPast = AppointmentController::handle($valid($todayStr, '08:00'), $pdo, $late);
    check('422 for past slot today', $rPast['status'] === 422);
    $rFuture = AppointmentController::handle([
        'full_name' => 'Test Resident 9',
        'contact_number' => '09170000009',
        'address' => 'Purok 9, Tamadang',
        'service_id' => '2',
        'appointment_date' => $todayStr,
        'start_time' => '08:00',
    ], $pdo, $early);
    check('201 for future slot today', $rFuture['status'] === 201);
} else {
    echo "SKIP: same-day cases (today is weekend, no template)\n";
}

// --- 7. Malformed JSON body → 422 (simulated: non-array decode path is live-only; assert envelope helper shape instead). ---
$r = AppointmentController::handle([], $pdo, $now);
check('422 for empty body', $r['status'] === 422);
} finally {
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All appointment creation checks passed.\n";
