<?php

declare(strict_types=1);

namespace App\Modules\Auth;

use App\Shared\ApiError;

/**
 * Server-side authentication gate for staff-only endpoints (TASK-023).
 *
 * Authenticated-staff-only: any signed-in, non-expired session passes.
 * Role distinctions are NOT enforced here — the per-role permission matrix
 * is deferred to TASK-014 (Q-05). Every future staff endpoint must call
 * check() first and return its error verbatim when present:
 *
 *   $auth = RequireAuth::check();
 *   if (!isset($auth['user'])) {
 *       return $auth; // 401 Authentication required.
 *   }
 *
 * Known limitation: deactivation (is_active = 0) takes effect on next login;
 * an existing session stays valid until the 120-min idle timeout (see
 * Session::IDLE_SECONDS). Closing that gap belongs to TASK-014 (DB
 * revalidation + permission matrix).
 */
final class RequireAuth
{
    /**
     * Roles allowed to approve/reject appointment requests (owner-approved
     * Request Review rule, docs/DECISIONS.md 2026-10-16): superadmin + admin.
     * Staff accounts view only. TASK-015's PATCH status endpoint must enforce
     * this via requireRoles(self::APPOINTMENT_REVIEW_ROLES).
     */
    public const APPOINTMENT_REVIEW_ROLES = ['superadmin', 'admin'];

    /**
     * @return array{user: array{id: int, username: string, display_name: string, role: string}}|array{status: int, body: string}
     */
    public static function check(): array
    {
        Session::start();
        $user = Session::currentUser();

        if ($user === null) {
            return ApiError::unauthenticated();
        }

        return ['user' => $user];
    }

    /**
     * Role gate on top of check(). Guests → 401; signed-in users whose role
     * is not in $allowed → 403 with the fixed safe message (no role names,
     * no policy detail leaked).
     *
     * @param string[] $allowed
     * @return array{user: array{id: int, username: string, display_name: string, role: string}}|array{status: int, body: string}
     */
    public static function requireRoles(array $allowed): array
    {
        $auth = self::check();
        if (!isset($auth['user'])) {
            return $auth;
        }

        if (!in_array($auth['user']['role'], $allowed, true)) {
            return ApiError::forbidden();
        }

        return $auth;
    }
}
