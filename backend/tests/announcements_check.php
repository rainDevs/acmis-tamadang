<?php

declare(strict_types=1);

/**
 * CLI test for TASK-025 announcements board (disposable DB, no live data).
 * Run from repo root with transient dev-DB env (never commit credentials):
 *   php backend/tests/announcements_check.php
 * Builds a disposable database from the real migration + seeder, asserts,
 * drops it.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Modules/Announcements/AnnouncementsController.php';

use App\Config\Config;
use App\Modules\Announcements\AnnouncementsController;

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
$dbName = $db['name'] !== '' ? $db['name'] : 'acmis_ann';
$serverDsn = sprintf('mysql:host=%s;port=%s;charset=%s', $db['host'], $db['port'], $db['charset']);
$dbDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $db['host'], $db['port'], $dbName, $db['charset']);
$options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];

try {
$admin = new PDO($serverDsn, $db['user'], $db['pass'], $options);
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`");
$admin->exec("CREATE DATABASE `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

$root = dirname(__DIR__, 2);
$pdo = new PDO($dbDsn, $db['user'], $db['pass'], $options);
applySqlFile($pdo, $root . '/database/migrations/00000000000000_template.sql');
applySqlFile($pdo, $root . '/database/migrations/20261016000009_create_announcements.sql');
applySqlFile($pdo, $root . '/database/seeders/20261016000003_announcements.sql');
check('disposable DB built (announcements seeded)', true);

// 1. Seeded list: 4 rows, pinned first, UI-compatible keys.
$r = AnnouncementsController::list($pdo);
check('list returns 200', $r['status'] === 200);
$payload = json_decode((string) $r['body'], true);
$items = $payload['data'] ?? null;
check('4 seeded rows', is_array($items) && count($items) === 4);
check('pinned row first', is_array($items) && ($items[0]['pinned'] ?? false) === true);
check(
    'UI keys present',
    is_array($items) && isset($items[0]['id'], $items[0]['type'], $items[0]['title'], $items[0]['body'], $items[0]['date'])
);
check('seeded copy intact', is_array($items) && $items[0]['title'] === 'Immunization day every Wednesday morning');

// 2. Empty table → 200 with an empty array (board shows its empty state).
$pdo->exec("DELETE FROM announcements");
$r = AnnouncementsController::list($pdo);
$payload = json_decode((string) $r['body'], true);
check('empty table returns 200 []', $r['status'] === 200 && ($payload['data'] ?? null) === []);

// 3. Leak scan on a 200 body.
check(
    'body leaks nothing',
    !str_contains((string) $r['body'], 'staff_users')
    && !str_contains((string) $r['body'], 'SELECT')
    && !str_contains((string) $r['body'], '.php')
);
} finally {
$admin->exec("DROP DATABASE IF EXISTS `{$dbName}`;");
}
check('disposable DB dropped', true);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All announcements checks passed.\n";
