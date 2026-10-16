<?php

declare(strict_types=1);

/**
 * CLI test for TASK-014 default RBAC policy (no DB needed — matrix only).
 * Run from repo root: php backend/tests/access_policy_check.php
 * Asserts every approved Q-05 matrix cell plus the gate envelopes.
 */

require_once __DIR__ . '/../src/Shared/Response.php';
require_once __DIR__ . '/../src/Shared/ApiError.php';
require_once __DIR__ . '/../src/Config/Config.php';
require_once __DIR__ . '/../src/Modules/Auth/Session.php';
require_once __DIR__ . '/../src/Modules/Auth/RequireAuth.php';
require_once __DIR__ . '/../src/Modules/Auth/AccessPolicy.php';

use App\Modules\Auth\AccessPolicy;
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

// Approved default matrix (docs/DECISIONS.md Q-05 2026-10-16).
$expected = [
    'appointments.view' => ['superadmin', 'admin', 'staff'],
    'appointments.review' => ['superadmin', 'admin'],
    'patients' => ['superadmin', 'admin', 'staff'],
    'consultations' => ['superadmin', 'admin', 'staff'],
    'services' => ['superadmin', 'admin'],
    'announcements' => ['superadmin', 'admin'],
    'users' => ['superadmin', 'admin'],
    'reports' => ['superadmin', 'admin', 'staff'],
];

foreach ($expected as $module => $roles) {
    check("matrix {$module}", AccessPolicy::rolesFor($module) === $roles);
    foreach (['superadmin', 'admin', 'staff'] as $role) {
        check(
            "allows {$role} on {$module}",
            AccessPolicy::allows($role, $module) === in_array($role, $roles, true)
        );
    }
}
check('unknown module allows nobody', AccessPolicy::allows('superadmin', 'nope') === false);
check(
    'review const in sync with matrix',
    RequireAuth::APPOINTMENT_REVIEW_ROLES === AccessPolicy::rolesFor('appointments.review')
);

Session::start();
Session::destroy();

// Guest → 401 (not 403) on a gated module.
$r = AccessPolicy::requireModule('users');
check('guest users-module 401', ($r['status'] ?? 0) === 401);

// Staff → 403 on admin modules, pass on all-role modules.
Session::login(['id' => 21, 'username' => 'eyes', 'display_name' => 'Eyes Staff', 'role' => 'staff']);
foreach (['appointments.review', 'services', 'announcements', 'users'] as $module) {
    $r = AccessPolicy::requireModule($module);
    check("staff denied on {$module} with 403", ($r['status'] ?? 0) === 403);
}
check(
    'staff denial message is safe',
    str_contains((string) ($r['body'] ?? ''), 'You do not have permission to perform this action.')
);
foreach (['appointments.view', 'patients', 'consultations', 'reports'] as $module) {
    $r = AccessPolicy::requireModule($module);
    check("staff passes {$module}", isset($r['user']) && $r['user']['role'] === 'staff');
}
Session::destroy();

// Admin passes an admin module; unknown module denies even admins.
Session::login(['id' => 22, 'username' => 'boss', 'display_name' => 'Boss Admin', 'role' => 'admin']);
$r = AccessPolicy::requireModule('users');
check('admin passes users module', isset($r['user']) && $r['user']['role'] === 'admin');
$r = AccessPolicy::requireModule('nope');
check('unknown module 403 for admin', ($r['status'] ?? 0) === 403);
Session::destroy();

if ($failures > 0) {
    echo "{$failures} check(s) failed.\n";
    exit(1);
}

echo "All access-policy checks passed.\n";
