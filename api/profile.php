<?php
require 'db.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['id'] ?? $_SESSION['user_id'];
    
    // Users can only get their own profile, admins can get any profile
    if ($_SESSION['role'] !== 'admin' && $userId != $_SESSION['user_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, username, email, name, role, status FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        exit;
    }
    
    $userId = $data['id'] ?? $_SESSION['user_id'];
    
    // Users can only update their own profile, admins can update any profile
    if ($_SESSION['role'] !== 'admin' && $userId != $_SESSION['user_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        exit;
    }
    
    try {
        $name = $data['name'] ?? '';
        $password = isset($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;

        if ($password) {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, password_hash = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $password, $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $userId]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?> 