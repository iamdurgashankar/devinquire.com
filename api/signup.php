<?php
header('Content-Type: application/json');
require_once 'db.php'; // Consistent CORS/session handling

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Input validation
if (!is_array($data) || empty($data['username']) || empty($data['email']) || empty($data['password']) || empty($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}

$username = $data['username'];
$email = $data['email'];
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$name = $data['name'];
$role = $data['role'] ?? 'user'; // Default to 'user' if not specified
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
    
    echo json_encode([
        'success' => true, 
        'message' => 'Registration successful! Your account is pending admin approval.'
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
}
?> 