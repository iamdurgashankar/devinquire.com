<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$host = 'localhost';
$db   = 'u180145459_Deviq_dashbrd';
$user = 'u180145459_devinquire';
$pass = 'dsdm05091995@Sipu';
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

header('Access-Control-Allow-Origin: https://devinquire.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?> 