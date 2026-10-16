<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Shared\ApiError;

/**
 * Default RBAC policy (TASK-014). Central module map from the approved Q-05
 * matrix (docs/DECISIONS.md 2026-10-16) — every staff endpoint gates through
 * requireModule() so roles are enforced identically everywhere.
 *
 * This is the DEFAULT matrix. Granular per-user permission management will
 * be implemented later and takes precedence over these defaults; until then
 * only the defaults below are enforced.
 */
final class AccessPolicy
{
    /**
     * Module => roles allowed. `appointments.review` covers approve/reject
     * (PATCH status); `appointments.view` covers the staff list + detail.
     *
     * @var array<string, string[]>
     */
    public const DEFAULT_MATRIX = [
        'appointments.view' => ['superadmin', 'admin', 'staff'],
        'appointments.review' => ['superadmin', 'admin'],
        'patients' => ['superadmin', 'admin', 'staff'],
        'consultations' => ['superadmin', 'admin', 'staff'],
        'services' => ['superadmin', 'admin'],
        'announcements' => ['superadmin', 'admin'],
        'users' => ['superadmin', 'admin'],
        'reports' => ['superadmin', 'admin', 'staff'],
    ];

    /**
     * @return string[]
     */
    public static function rolesFor(string $module): array
    {
        return self::DEFAULT_MATRIX[$module] ?? [];
    }

    public static function allows(string $role, string $module): bool
    {
        return in_array($role, self::rolesFor($module), true);
    }

    /**
     * Session + module gate for staff endpoints. Guests → 401, signed-in
     * users without the module role → 403 (both safe envelopes).
     *
     * @return array{user: array{id: int, username: string, display_name: string, role: string}}|array{status: int, body: string}
     */
    public static function requireModule(string $module): array
    {
        $auth = RequireAuth::check();
        if (!isset($auth['user'])) {
            return $auth;
        }

        if (!self::allows($auth['user']['role'], $module)) {
            return ApiError::forbidden();
        }

        return $auth;
    }
}
