<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// --- CORS HEADERS: Always send for all API endpoints ---
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8000',
    'https://devinquire.com',
    'https://www.devinquire.com'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Detect if running on localhost or not using HTTPS for session cookie settings
$isLocalhost = (
    isset($_SERVER['HTTP_ORIGIN']) &&
    (strpos($_SERVER['HTTP_ORIGIN'], 'localhost') !== false || strpos($_SERVER['HTTP_ORIGIN'], '127.0.0.1') !== false)
);
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

// DEBUG: Log session/cookie setup
file_put_contents(__DIR__ . '/session_debug.log', date('c') . " | ORIGIN: " . ($_SERVER['HTTP_ORIGIN'] ?? '-') . " | HTTPS: $isHttps | Localhost: $isLocalhost\n", FILE_APPEND);

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => ($isLocalhost || !$isHttps) ? '' : '.devinquire.com',
    'secure' => ($isLocalhost || !$isHttps) ? false : true,
    'httponly' => true,
    'samesite' => 'Lax'
]);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', ($isLocalhost || !$isHttps) ? 0 : 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.gc_maxlifetime', 3600); // 1 hour
ini_set('session.cookie_lifetime', 0); // Session cookie

// Only start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load DB credentials from .env if present
if (file_exists(__DIR__ . '/.env')) {
    $env = parse_ini_file(__DIR__ . '/.env');
    $host = $env['DB_HOST'] ?? 'localhost';
    $db   = $env['DB_NAME'] ?? 'u180145459_devinquire';
    $user = $env['DB_USER'] ?? 'u180145459_devinquire_db';
    $pass = $env['DB_PASS'] ?? 'dsdm05091995Sipu@';
} else {
    $host = 'localhost';
    $db   = 'u180145459_devinquire';
    $user = 'u180145459_devinquire_db';
    $pass = 'dsdm05091995Sipu@';
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
     throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

// Ensure default admin exists
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $defaultAdminPass = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, name, role, status, created_at) VALUES (?, ?, ?, ?, 'admin', 'approved', NOW())");
        $stmt->execute(['admin@devinquire.com', 'admin@devinquire.com', $defaultAdminPass, 'Admin User']);
    }
} catch (Exception $e) {
    // Ignore errors here to avoid breaking the app
}

// Ensure posts table exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            excerpt TEXT NOT NULL,
            content LONGTEXT NOT NULL,
            category VARCHAR(100) NOT NULL,
            tags JSON,
            featured_image VARCHAR(500),
            author_name VARCHAR(255) NOT NULL,
            read_time VARCHAR(50) DEFAULT '5 min read',
            status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
            author_id INT,
            views INT DEFAULT 0,
            likes INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_category (category),
            INDEX idx_author_id (author_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    // Ensure author_id column exists (for legacy tables)
    $result = $pdo->query("SHOW COLUMNS FROM posts LIKE 'author_id'");
    if ($result->rowCount() == 0) {
        $pdo->exec("ALTER TABLE posts ADD COLUMN author_id INT AFTER status");
    }
} catch (Exception $e) {
    // Ignore errors here to avoid breaking the app
}

// Ensure user_activity_log table exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_action (action)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
} catch (Exception $e) {
    // Ignore errors here to avoid breaking the app
}
// Ensure user_preferences table exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            preferences JSON,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
} catch (Exception $e) {
    // Ignore errors here to avoid breaking the app
}

// Ensure pages table exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS pages (
            id VARCHAR(100) PRIMARY KEY,
            html LONGTEXT,
            css LONGTEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted TINYINT(1) DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    // Ensure deleted column exists (for legacy tables)
    $result = $pdo->query("SHOW COLUMNS FROM pages LIKE 'deleted'");
    if ($result->rowCount() == 0) {
        $pdo->exec("ALTER TABLE pages ADD COLUMN deleted TINYINT(1) DEFAULT 0");
    }
    // Add this migration logic to ensure 'position' column exists in 'pages' table
    $checkPositionColumn = $pdo->query("SHOW COLUMNS FROM pages LIKE 'position'");
    if ($checkPositionColumn && $checkPositionColumn->rowCount() == 0) {
        $pdo->exec("ALTER TABLE pages ADD COLUMN position INT DEFAULT 0");
    }
    // Add migration to ensure 'title' column exists
    $checkTitleColumn = $pdo->query("SHOW COLUMNS FROM pages LIKE 'title'");
    if ($checkTitleColumn && $checkTitleColumn->rowCount() == 0) {
        $pdo->exec("ALTER TABLE pages ADD COLUMN title VARCHAR(255) DEFAULT ''");
    }
    // Insert a default page if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM pages");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $defaultHtml = '<section class="py-16 px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl flex flex-col items-center justify-center"><h1 class="text-4xl font-bold mb-4">Welcome to Devinquire</h1><p class="text-lg mb-6">Build beautiful pages with ease.</p><a href="#" class="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl shadow hover:bg-blue-50 transition">Get Started</a></section>';
        $defaultCss = '';
        $stmt = $pdo->prepare("INSERT INTO pages (id, title, html, css, deleted) VALUES (?, ?, ?, ?, 0)");
        $stmt->execute(['home', 'Home', $defaultHtml, $defaultCss]);
    }
} catch (Exception $e) {
    // Ignore errors here to avoid breaking the app
}

// --- USERS TABLE SCHEMA REFERENCE ---
/*
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/
// --- END USERS TABLE SCHEMA REFERENCE ---
// No closing PHP tag to prevent accidental output 