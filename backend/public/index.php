<?php

declare(strict_types=1);

/**
 * ACMIS API front controller.
 *
 * Serve locally: php -S localhost:8000 -t backend/public
 * Then: curl http://localhost:8000/api/health
 */

$autoload = __DIR__ . '/../../vendor/autoload.php';
if (is_file($autoload)) {
    require $autoload;
} else {
    // Dependency-free fallback: load the classes this entry point needs.
    require_once __DIR__ . '/../src/Shared/Response.php';
    require_once __DIR__ . '/../src/Shared/ApiError.php';
    require_once __DIR__ . '/../src/Config/Config.php';
    require_once __DIR__ . '/../src/Database/Connection.php';
    require_once __DIR__ . '/../src/Modules/Health/HealthController.php';
    require_once __DIR__ . '/../src/Modules/Health/DbHealthController.php';
    require_once __DIR__ . '/../src/Modules/Availability/AvailabilityService.php';
    require_once __DIR__ . '/../src/Modules/Availability/AvailabilityController.php';
    require_once __DIR__ . '/../src/Modules/Appointments/SlotTakenException.php';
    require_once __DIR__ . '/../src/Modules/Appointments/AppointmentService.php';
    require_once __DIR__ . '/../src/Modules/Appointments/AppointmentController.php';
    require_once __DIR__ . '/../src/Modules/Appointments/AppointmentAdminController.php';
    require_once __DIR__ . '/../src/Modules/Appointments/AppointmentAdminService.php';
    require_once __DIR__ . '/../src/Modules/Appointments/LookupController.php';
    require_once __DIR__ . '/../src/Modules/Services/ServicesController.php';
    require_once __DIR__ . '/../src/Modules/Services/ServicesAdminService.php';
    require_once __DIR__ . '/../src/Modules/Services/ServicesAdminController.php';
    require_once __DIR__ . '/../src/Modules/Announcements/AnnouncementsController.php';
    require_once __DIR__ . '/../src/Modules/Auth/AuthService.php';
    require_once __DIR__ . '/../src/Modules/Auth/Session.php';
    require_once __DIR__ . '/../src/Modules/Auth/RequireAuth.php';
    require_once __DIR__ . '/../src/Modules/Auth/AccessPolicy.php';
    require_once __DIR__ . '/../src/Modules/Auth/AuthController.php';
}

use App\Modules\Appointments\AppointmentAdminController;
use App\Modules\Appointments\AppointmentController;
use App\Modules\Availability\AvailabilityController;
use App\Modules\Services\ServicesController;
use App\Modules\Services\ServicesAdminController;
use App\Config\Config;
use App\Modules\Health\DbHealthController;
use App\Modules\Health\HealthController;
use App\Shared\ApiError;
use App\Shared\Response;

/** @var array<string, array{0: class-string, 1: string}> $routes */
$routes = require __DIR__ . '/../src/Routes/api.php';

// Local .env (gitignored) supplies dev-only settings; real env wins.
Config::loadEnvFile(__DIR__ . '/../.env');

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = strtolower((string) parse_url($uri, PHP_URL_PATH));

// Narrow CORS (RULES.md §8): reflect only whitelisted origins, never '*'
// with credentials. The Vite dev server is a different origin (:5173) from
// the API (:8000); without this the browser blocks responses even on HTTP 200.
// Override via CORS_ALLOWED_ORIGINS="https://a.example,https://b.example".
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$allowedOrigins = array_filter(array_map(
    'trim',
    explode(',', Config::env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
));
if ($origin !== '' && in_array($origin, $allowedOrigins, true) && PHP_SAPI !== 'cli') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
if ($method === 'OPTIONS') {
    if (PHP_SAPI !== 'cli') {
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Max-Age: 86400');
        http_response_code(204);
    }
    return;
}

$key = $method . ' ' . $path;

// Staff appointment detail + status routes carry a reference segment, so
// they dispatch by prefix before the exact-match map below:
//   GET   /api/appointments/{reference}          → detail
//   PATCH /api/appointments/{reference}/status   → updateStatus
if (($method === 'GET' || $method === 'PATCH') && str_starts_with($path . '/', '/api/appointments/')) {
    $rest = substr($path, strlen('/api/appointments/'));
    $segments = explode('/', $rest);
    if (count($segments) === 1 && $segments[0] !== '') {
        if ($method === 'GET') {
            try {
                $result = AppointmentAdminController::detail(urldecode($segments[0]));
            } catch (Throwable $e) {
                ApiError::log('request', $e);
                $result = ApiError::serverError();
            }
            if (PHP_SAPI !== 'cli') {
                http_response_code($result['status']);
                header('Content-Type: application/json; charset=utf-8');
            }
            echo $result['body'];
            return;
        }
    } elseif (count($segments) === 2 && $segments[0] !== '' && strtolower($segments[1]) === 'status' && $method === 'PATCH') {
        try {
            $result = AppointmentAdminController::updateStatus(null, urldecode($segments[0]));
        } catch (Throwable $e) {
            ApiError::log('request', $e);
            $result = ApiError::serverError();
        }
        if (PHP_SAPI !== 'cli') {
            http_response_code($result['status']);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo $result['body'];
        return;
    }
}

// Staff services-admin routes with an id segment (all admin+ via controller):
//   PATCH  /api/services/{id}   → updateService
//   PATCH  /api/schedules/{id}  → updateSchedule
//   DELETE /api/closures/{id}   → deleteClosure
if ($method === 'PATCH' && str_starts_with($path . '/', '/api/services/')) {
    $id = urldecode(substr($path, strlen('/api/services/')));
    if ($id !== '' && !str_contains($id, '/') && ctype_digit($id)) {
        try {
            $result = ServicesAdminController::updateService(null, (int) $id);
        } catch (Throwable $e) {
            ApiError::log('request', $e);
            $result = ApiError::serverError();
        }
        if (PHP_SAPI !== 'cli') {
            http_response_code($result['status']);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo $result['body'];
        return;
    }
}

if ($method === 'PATCH' && str_starts_with($path . '/', '/api/schedules/')) {
    $id = urldecode(substr($path, strlen('/api/schedules/')));
    if ($id !== '' && !str_contains($id, '/') && ctype_digit($id)) {
        try {
            $result = ServicesAdminController::updateSchedule(null, (int) $id);
        } catch (Throwable $e) {
            ApiError::log('request', $e);
            $result = ApiError::serverError();
        }
        if (PHP_SAPI !== 'cli') {
            http_response_code($result['status']);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo $result['body'];
        return;
    }
}

if ($method === 'DELETE' && str_starts_with($path . '/', '/api/closures/')) {
    $id = urldecode(substr($path, strlen('/api/closures/')));
    if ($id !== '' && !str_contains($id, '/') && ctype_digit($id)) {
        try {
            $result = ServicesAdminController::deleteClosure((int) $id);
        } catch (Throwable $e) {
            ApiError::log('request', $e);
            $result = ApiError::serverError();
        }
        if (PHP_SAPI !== 'cli') {
            http_response_code($result['status']);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo $result['body'];
        return;
    }
}

if ($method === 'GET' && $path === '/api/health') {
    $result = HealthController::check();
    if (PHP_SAPI !== 'cli') {
        http_response_code($result['status']);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo $result['body'];
    return;
}

if (isset($routes[$key])) {
    [$controller, $action] = $routes[$key];
    try {
        $result = $controller::$action();
    } catch (Throwable $e) {
        ApiError::log('request', $e);
        $result = ApiError::serverError();
    }
    if (PHP_SAPI !== 'cli') {
        http_response_code($result['status']);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo $result['body'];
    return;
}

// Safe 404: no paths, no internals.
echo Response::json(false, 'Not found.', null, 404);
