<?php
header('Content-Type: application/json');
require 'db.php';
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden - Admin access required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, username, email, name, role, status, created_at, updated_at FROM users WHERE status = 'pending' ORDER BY created_at DESC");
    $stmt->execute();
    $pendingUsers = $stmt->fetchAll();
    
    // Transform the data to match frontend expectations
    $formattedUsers = array_map(function($user) {
        return [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'status' => $user['status'],
            'created_at' => $user['created_at'],
            'updated_at' => $user['updated_at'] ?? $user['created_at']
        ];
    }, $pendingUsers);
    
    echo json_encode([
        'success' => true,
        'data' => $formattedUsers
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 