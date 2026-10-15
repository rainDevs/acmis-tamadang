<?php

declare(strict_types=1);

/**
 * Route map: "METHOD path" => [controller, method].
 * Keep this file routing-only; business logic lives in Modules/*.
 *
 * @return array<string, array{0: class-string, 1: string}>
 */
return [
    'GET /api/health' => [\App\Modules\Health\HealthController::class, 'check'],
    'GET /api/health/db' => [\App\Modules\Health\DbHealthController::class, 'check'],
    'GET /api/public/availability' => [\App\Modules\Availability\AvailabilityController::class, 'handle'],
    'GET /api/public/services' => [\App\Modules\Services\ServicesController::class, 'list'],
    'POST /api/public/appointments' => [\App\Modules\Appointments\AppointmentController::class, 'handle'],
];
