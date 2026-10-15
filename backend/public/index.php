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
    // Dependency-free fallback: load the two classes this entry point needs.
    require_once __DIR__ . '/../src/Shared/Response.php';
    require_once __DIR__ . '/../src/Modules/Health/HealthController.php';
}

use App\Modules\Health\HealthController;
use App\Shared\Response;

/** @var array<string, array{0: class-string, 1: string}> $routes */
$routes = require __DIR__ . '/../src/Routes/api.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$path = strtolower((string) parse_url($uri, PHP_URL_PATH));

$key = $method . ' ' . $path;

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
    $result = $controller::$action();
    if (PHP_SAPI !== 'cli') {
        http_response_code($result['status']);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo $result['body'];
    return;
}

// Safe 404: no paths, no internals.
echo Response::json(false, 'Not found.', null, 404);
