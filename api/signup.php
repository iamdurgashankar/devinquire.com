<?php
header('Access-Control-Allow-Origin: https://devinquire.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require 'db.php';
$data = json_decode(file_get_contents('php://input'), true);

// Input validation
if (!is_array($data) || empty($data['username']) || empty($data['email']) || empty($data['password']) || empty($data['name']) || empty($data['role'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}

$username = $data['username'];
$email = $data['email'];
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$name = $data['name'];
$role = $data['role']; // 'user' or 'admin'
$status = 'pending';

try {
    // Check for duplicate username or email
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    $row = $stmt->fetch();
    if ($row['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Username or email already exists.']);
        exit();
    }

    // Insert new user with status 'pending'
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$username, $email, $password, $name, $role, $status]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
}
?> 