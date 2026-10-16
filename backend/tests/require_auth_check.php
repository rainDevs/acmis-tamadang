<?php

declare(strict_types=1);

/**
 * CLI test for TASK-023 RequireAuth gate (session only, no DB needed).
 * Run from repo root: php backend/tests/require_auth_check.php
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Modules/Auth/Session.php';
require_once __DIR__ . '/../src/Modules/Auth/RequireAuth.php';

use App\Modules\Auth\RequireAuth;
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

// Isolate from any developer session state.
Session::start();
Session::destroy();

// 1. Guest (no session) → 401 with the fixed safe message.
$r = RequireAuth::check();
check('guest denied with 401', ($r['status'] ?? 0) === 401);
check('guest message is safe', str_contains((string) ($r['body'] ?? ''), 'Authentication required.'));
check('guest body leaks nothing', !str_contains((string) ($r['body'] ?? ''), 'staff_users') && !str_contains((string) ($r['body'] ?? ''), 'SQL'));

// 2. Signed-in session passes through with the session user only.
Session::login(['id' => 7, 'username' => 'gatecheck', 'display_name' => 'Gate Check', 'role' => 'staff']);
$r = RequireAuth::check();
check('signed-in user passes', isset($r['user']) && $r['user']['username'] === 'gatecheck' && $r['user']['role'] === 'staff');
check('no hash in gated user', !array_key_exists('password_hash', $r['user'] ?? []));

// 3. After destroy the same session is denied again.
Session::destroy();
$r = RequireAuth::check();
check('destroyed session denied with 401', ($r['status'] ?? 0) === 401);

// 4. Request-review role rule (owner-approved 2026-10-16): superadmin + admin
// may approve/reject; staff views only.
Session::login(['id' => 9, 'username' => 'reviewer', 'display_name' => 'Review Admin', 'role' => 'admin']);
$r = RequireAuth::requireRoles(RequireAuth::APPOINTMENT_REVIEW_ROLES);
check('admin passes review gate', isset($r['user']) && $r['user']['role'] === 'admin');
Session::destroy();

Session::login(['id' => 10, 'username' => 'rooter', 'display_name' => 'Root Super', 'role' => 'superadmin']);
$r = RequireAuth::requireRoles(RequireAuth::APPOINTMENT_REVIEW_ROLES);
check('superadmin passes review gate', isset($r['user']) && $r['user']['role'] === 'superadmin');
Session::destroy();

Session::login(['id' => 11, 'username' => 'viewer', 'display_name' => 'View Staff', 'role' => 'staff']);
$r = RequireAuth::requireRoles(RequireAuth::APPOINTMENT_REVIEW_ROLES);
check('staff denied with 403', ($r['status'] ?? 0) === 403);
check('staff denial message is safe', str_contains((string) ($r['body'] ?? ''), 'You do not have permission to perform this action.'));
Session::destroy();

$r = RequireAuth::requireRoles(RequireAuth::APPOINTMENT_REVIEW_ROLES);
check('guest denied with 401 (not 403)', ($r['status'] ?? 0) === 401);

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All require-auth checks passed.\n";
