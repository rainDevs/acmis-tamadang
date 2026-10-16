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
    'GET /api/appointments' => [\App\Modules\Appointments\AppointmentAdminController::class, 'list'],
    'GET /api/services' => [\App\Modules\Services\ServicesAdminController::class, 'listServices'],
    'GET /api/schedules' => [\App\Modules\Services\ServicesAdminController::class, 'listSchedules'],
    'GET /api/closures' => [\App\Modules\Services\ServicesAdminController::class, 'listClosures'],
    'POST /api/closures' => [\App\Modules\Services\ServicesAdminController::class, 'addClosure'],
    'GET /api/public/announcements' => [\App\Modules\Announcements\AnnouncementsController::class, 'list'],
    'POST /api/public/appointments' => [\App\Modules\Appointments\AppointmentController::class, 'handle'],
    'POST /api/public/appointments/lookup' => [\App\Modules\Appointments\LookupController::class, 'handle'],
    'POST /api/auth/login' => [\App\Modules\Auth\AuthController::class, 'login'],
    'POST /api/auth/logout' => [\App\Modules\Auth\AuthController::class, 'logout'],
    'GET /api/auth/me' => [\App\Modules\Auth\AuthController::class, 'me'],
];
