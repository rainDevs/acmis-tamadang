<?php

declare(strict_types=1);

namespace App\Modules\Appointments;

use App\Config\Config;
use App\Database\Connection;
use App\Shared\ApiError;
use App\Shared\Response;
use PDO;
use Throwable;

/**
 * POST /api/public/appointments/lookup — public, no auth. Residents check
 * their request with the reference number plus the last 4 digits of the
 * contact number given at booking (TASK-026).
 *
 * Privacy (RULES.md §9): POST body only, so the reference and suffix never
 * land in URLs or access logs. Success discloses schedule + status only —
 * never names, contacts, or addresses. Wrong suffix, unknown reference, and
 * malformed reference all yield the identical 404 (no enumeration of which
 * part failed); the suffix comparison is timing-safe.
 */
final class LookupController
{
    /**
     * @param array<string, mixed>|null $body decoded JSON; null reads php://input (live HTTP)
     */
    public static function handle(?array $body = null, ?PDO $pdo = null): array
    {
        if ($body === null) {
            $decoded = json_decode((string) file_get_contents('php://input'), true);
            if (!is_array($decoded)) {
                return ApiError::validation('Invalid request body.');
            }
            $body = $decoded;
        }

        $referenceNo = strtoupper(trim((string) ($body['reference_no'] ?? '')));
        $suffix = trim((string) ($body['contact_suffix'] ?? ''));
        if ($referenceNo === '' || $suffix === '') {
            return ApiError::validation('Reference number and contact verification are required.');
        }
        if (!AppointmentAdminService::isReference($referenceNo) || !preg_match('/^\d{4}$/', $suffix)) {
            // Same envelope as no-match: format failures disclose nothing.
            return ApiError::lookupMiss();
        }

        try {
            $pdo ??= Connection::make(Config::db());
        } catch (Throwable $e) {
            ApiError::log('lookup-connect', $e);

            return ApiError::unavailable();
        }

        try {
            $stmt = $pdo->prepare(
                'SELECT a.reference_no, s.name AS service_name, a.appointment_date,'
                . ' a.start_time, a.status, a.contact_number'
                . ' FROM appointments a LEFT JOIN appointment_services s ON s.id = a.service_id'
                . ' WHERE a.reference_no = :ref'
            );
            $stmt->execute([':ref' => $referenceNo]);
            $row = $stmt->fetch();
        } catch (Throwable $e) {
            ApiError::log('lookup', $e);

            return ApiError::serverError();
        }

        if ($row === false || !hash_equals(substr((string) $row['contact_number'], -4), $suffix)) {
            return ApiError::lookupMiss();
        }

        return [
            'status' => 200,
            'body' => Response::json(true, 'Appointment status retrieved.', [
                'reference_no' => $row['reference_no'],
                'service_name' => $row['service_name'],
                'schedule_date' => $row['appointment_date'],
                'start_time' => substr((string) $row['start_time'], 0, 5),
                'status' => $row['status'],
            ], 200),
        ];
    }
}
