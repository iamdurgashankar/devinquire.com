<?php
require 'db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['username']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Missing username or password']);
    exit();
}

$username = $data['username'];
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
        // Check if user is approved
        if ($user['status'] !== 'approved') {
            echo json_encode(['success' => false, 'message' => 'Account is pending approval']);
            exit();
        }
        
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
        $_SESSION['username'] = $user['username'];
        
        echo json_encode([
            'success' => true, 
            'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'name' => $user['name'],
                'role' => $user['role'],
                'status' => $user['status']
            ]
        ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 