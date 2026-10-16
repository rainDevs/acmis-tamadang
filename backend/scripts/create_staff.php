<?php

declare(strict_types=1);

/**
 * Create (or rotate) a local staff account. Run from repo root:
 *   php backend/scripts/create_staff.php <username> <password> [role] [display-name] [description]
 * Role is one of: superadmin, admin, staff (default staff).
 * Passwords need 10+ characters and are stored ONLY as hashes.
 * Never commit credentials — this script takes them as arguments each run.
 */

use App\Config\Config;
use App\Database\Connection;

require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Database/Connection.php';

// Local .env (gitignored) supplies dev-only settings; real env wins.
Config::loadEnvFile(__DIR__ . '/../.env');

$username = trim((string) ($argv[1] ?? ''));
$password = (string) ($argv[2] ?? '');
$role = strtolower(trim((string) ($argv[3] ?? 'staff')));
$displayName = trim((string) ($argv[4] ?? $username));
$description = trim((string) ($argv[5] ?? ''));
if ($description !== '' && strlen($description) > 255) {
    fwrite(STDERR, "Description must be 255 characters or fewer.\n");
    exit(2);
}

if ($username === '' || $password === '') {
    fwrite(STDERR, "Usage: php backend/scripts/create_staff.php <username> <password> [role] [display-name] [description]\n");
    exit(2);
}
if (!in_array($role, ['superadmin', 'admin', 'staff'], true)) {
    fwrite(STDERR, "Role must be one of: superadmin, admin, staff\n");
    exit(2);
}
if (strlen($password) < 10) {
    fwrite(STDERR, "Password must be at least 10 characters.\n");
    exit(2);
}

try {
    $pdo = Connection::make(Config::db());
} catch (Throwable $e) {
    fwrite(STDERR, "Database connection failed.\n");
    exit(1);
}

$stmt = $pdo->prepare(
    'INSERT INTO staff_users (username, password_hash, display_name, role, description, is_active)'
    . ' VALUES (:username, :hash, :display, :role, :description, 1)'
    . ' ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), display_name = VALUES(display_name), role = VALUES(role), description = VALUES(description), is_active = 1'
);
$stmt->execute([
    ':username' => $username,
    ':hash' => password_hash($password, PASSWORD_DEFAULT),
    ':display' => $displayName !== '' ? $displayName : $username,
    ':role' => $role,
    ':description' => $description !== '' ? $description : null,
]);

echo "Staff account '{$username}' ready (role: {$role}).\n";
