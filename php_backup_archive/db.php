<?php
// Set the allowed origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    if ($origin === 'http://localhost:3000' || $origin === 'http://localhost:3001' || $origin === 'http://localhost:3002' || $origin === 'http://localhost:3003' || $origin === 'https://devinquire.com' || $origin === 'https://dashboard.devinquire.com') {
        header("Access-Control-Allow-Origin: $origin");
    }
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Database connection details
// Check if we're in production environment
$isProduction = !in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', 'localhost:8000']);

if ($isProduction) {
    // Production database settings - update these with your live database credentials
    $host = 'localhost'; // Your production database host
    $db = 'devinquire'; // Your production database name
    $user = 'your_db_username'; // Your production database username
    $pass = 'your_db_password'; // Your production database password
} else {
    // Development database settings
    $host = 'localhost';
    $db = 'devinquire';
    $user = 'root';
    $pass = '';
}
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // In a real application, you would log this error and show a generic message
    // For development, it's okay to show the error
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}