<?php

/**
 * Simplified PHP Backend for DevInquire Dashboard
 * Hostinger Shared Hosting Compatible
 * 
 * This backend provides minimal API endpoints for Firebase token verification
 * Most functionality is handled directly by Firebase in the frontend
 */

// Set error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 3600');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load dependencies
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/firebase.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/TaskController.php';
require_once __DIR__ . '/controllers/TeamController.php';

// Load environment variables from .env file (if exists)
if (file_exists(__DIR__ . '/.env')) {
    $envFile = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envFile as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Initialize Firebase
try {
    $firebase = new FirebaseConfig();
    $authMiddleware = new AuthMiddleware($firebase);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Firebase configuration error: ' . $e->getMessage()
    ]);
    exit();
}

// Get request path
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query parameters and base path
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path); // Remove /api prefix if present
$path = rtrim($path, '/');

// Route requests
try {
    // Health check endpoint
    if ($path === '' || $path === '/health') {
        if ($request_method === 'GET') {
            echo json_encode([
                'status' => 'healthy',
                'service' => 'DevInquire Dashboard API',
                'version' => '1.0.0',
                'timestamp' => date('c'),
                'firebase_configured' => $firebase->isConfigured()
            ]);
            exit;
        }
    }

    // Auth endpoints
    if ($path === '/auth/verify') {
        if ($request_method === 'POST') {
            $controller = new AuthController($firebase);
            $controller->verifyToken();
            exit;
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
    }

    if ($path === '/auth/status') {
        if ($request_method === 'GET') {
            $controller = new AuthController($firebase);
            $controller->getAuthStatus();
            exit;
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
    }

    // Tasks endpoints
    if (preg_match('#^/tasks(/([^/]+))?$#', $path, $matches)) {
        $id = $matches[2] ?? null;
        $controller = new TaskController();

        $authMiddleware->requireAuth(function ($user, $token) use ($controller, $request_method, $id) {
            switch ($request_method) {
                case 'GET':
                    if ($id) $controller->show($id, $user, $token);
                    else $controller->index($user, $token);
                    break;
                case 'POST':
                    if ($id) {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    } else {
                        $controller->store($user, $token);
                    }
                    break;
                case 'PUT':
                case 'PATCH':
                    if ($id) $controller->update($id, $user, $token);
                    else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'DELETE':
                    if ($id) $controller->destroy($id, $user, $token);
                    else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'OPTIONS':
                    http_response_code(200);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
        });
        exit;
    }

    // Team endpoints
    if (preg_match('#^/team(/([^/]+))?$#', $path, $matches)) {
        $id = $matches[2] ?? null;
        $controller = new TeamController();

        $authMiddleware->requireAuth(function ($user, $token) use ($controller, $request_method, $id) {
            switch ($request_method) {
                case 'GET':
                    if ($id) $controller->show($id, $user, $token);
                    else $controller->index($user, $token);
                    break;
                case 'POST':
                    if ($id) {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    } else {
                        $controller->store($user, $token);
                    }
                    break;
                case 'PUT':
                case 'PATCH':
                    if ($id) $controller->update($id, $user, $token);
                    else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'DELETE':
                    if ($id) $controller->destroy($id, $user, $token);
                    else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'OPTIONS':
                    http_response_code(200);
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
        });
        exit;
    }

    // 404
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found: ' . $path]);
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
