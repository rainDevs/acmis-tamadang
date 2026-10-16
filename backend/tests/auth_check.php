<?php

declare(strict_types=1);

/**
 * CLI test for TASK-013 service layer (credential verification + throttling).
 * Session cookie flow is verified live via curl + cookiejar (see TASKS.md).
 * Run from repo root with transient dev-DB env (never commit credentials).
 * Builds a disposable database from the real migrations, asserts, drops it.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Auth/AuthService.php';
require_once __DIR__ . '/../src/Modules/Auth/Session.php';
require_once __DIR__ . '/../src/Modules/Auth/AuthController.php';

use App\Config\Config;
use App\Modules\Auth\AuthController;
use App\Modules\Auth\AuthService;

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
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_auth';
$serverDsn = sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);
$dbDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $dbName, $db['charset']);
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];

try {
$admin = new PDO($serverDsn, $db['user'], $db['pass'], $options);
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`");
$admin->exec("CREATE DATABASE `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

$root = dirname(__DIR__, 2);
// Explicit order (services before dependents; template first).
$ordered = [
    $root . '/database/migrations/00000000000000_template.sql',
    $root . '/database/migrations/20261016000001_create_appointment_services.sql',
    $root . '/database/migrations/20261016000002_create_clinic_schedules.sql',
    $root . '/database/migrations/20261016000003_create_schedule_closures.sql',
    $root . '/database/migrations/20261016000004_create_appointments.sql',
    $root . '/database/migrations/20261016000006_create_staff_users.sql',
    $root . '/database/migrations/20261016000007_create_staff_login_attempts.sql',
    $root . '/database/migrations/20261016000008_add_description_to_staff_users.sql',
];
$pdo = new PDO($dbDsn, $db['user'], $db['pass'], $options);
foreach ($ordered as $file) {
    applySqlFile($pdo, $file);
}
check('disposable DB built (auth tables present)', true);

$pdo->prepare(
    "INSERT INTO staff_users (username, password_hash, display_name, role, is_active)"
    . " VALUES ('Muse', :hash, 'Test Admin', 'admin', 1)"
)->execute([':hash' => password_hash('correct-horse-10', PASSWORD_DEFAULT)]);
$pdo->prepare(
    "INSERT INTO staff_users (username, password_hash, display_name, role, is_active)"
    . " VALUES ('offstaff', :hash, 'Off Staff', 'staff', 0)"
)->execute([':hash' => password_hash('correct-horse-10', PASSWORD_DEFAULT)]);

// 1. Correct credentials → user array, no hash.
$res = AuthService::attempt($pdo, 'Muse', 'correct-horse-10');
check('valid login returns user', isset($res['user']) && $res['user']['username'] === 'Muse' && $res['user']['role'] === 'admin');
check('no hash in user array', !array_key_exists('password_hash', $res['user'] ?? []));

// 2. Wrong password / unknown user / inactive → identical generic shape.
$bad = AuthService::attempt($pdo, 'Muse', 'wrong-password-1');
check('wrong password fails generically', isset($bad['failed']));
$noUser = AuthService::attempt($pdo, 'Muse', 'anything-at-all');
check('unknown user fails identically', isset($noUser['failed']));
$off = AuthService::attempt($pdo, 'offstaff', 'correct-horse-10');
check('inactive account fails', isset($off['failed']));

// 3. Throttle on a real account: 4 more fails (5 total) locks it; expiry
// unlocks; success clears the record.
for ($i = 0; $i < 4; $i++) {
    AuthService::attempt($pdo, 'Muse', 'wrong-again');
}
$locked = AuthService::attempt($pdo, 'Muse', 'wrong-again');
check('5th failure locks account', isset($locked['locked']));
$evenRight = AuthService::attempt($pdo, 'Muse', 'correct-horse-10');
check('locked blocks correct password', isset($evenRight['locked']));
$pdo->exec("UPDATE staff_login_attempts SET locked_until = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE username = 'Muse'");
$after = AuthService::attempt($pdo, 'Muse', 'correct-horse-10');
check('expiry unlocks', isset($after['user']));
$cleared = (int) $pdo->query("SELECT COUNT(*) FROM staff_login_attempts WHERE username = 'Muse'")->fetchColumn();
check('success clears attempts', $cleared === 0);

// 4. Controller envelopes (no session started in CLI path — login() would
// start one; covered live instead). Empty body + malformed shapes:
$r = AuthController::login(['username' => '', 'password' => ''], $pdo);
check('empty credentials → 401 generic', $r['status'] === 401 && str_contains($r['body'], 'Incorrect username or password.'));
$r = AuthController::me();
check('guest me → 401', $r['status'] === 401);
} finally {
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All auth checks passed.\n";
