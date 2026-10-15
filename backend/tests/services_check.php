<?php

declare(strict_types=1);

/**
 * CLI test for the public services endpoint (TASK-011 scope amendment).
 * Run from repo root with transient dev-DB env (never commit credentials).
 * Builds a disposable database from the real migrations + seeders, asserts,
 * then drops it.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Services/ServicesController.php';

use App\Config\Config;
use App\Modules\Services\ServicesController;

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
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_svc';
$serverDsn = sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);
$dbDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $dbName, $db['charset']);
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];

try {
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

$res = ServicesController::list($pdo);
check('services returns 200', $res['status'] === 200);
$services = json_decode($res['body'], true)['data'];
check('6 approved services', count($services) === 6);
$names = array_column($services, 'name');
check('approved names exact', in_array('General Consultation', $names, true) && in_array('Health Certificate / Clearance', $names, true));
check('uniform 30-min duration', array_unique(array_column($services, 'duration_minutes')) === [30]);
check('shape has id/name/description/duration', $services !== [] && array_key_exists('id', $services[0]) && array_key_exists('name', $services[0]) && array_key_exists('description', $services[0]) && array_key_exists('duration_minutes', $services[0]));

$pdo->exec("UPDATE appointment_services SET is_active = 0 WHERE id = 1");
$count = count(json_decode(ServicesController::list($pdo)['body'], true)['data']);
check('inactive service hidden', $count === 5);
} finally {
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All services checks passed.\n";
