<?php
require 'db.php';
session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden - Admin access required']);
    exit;
}

try {
    // Fetch all users
    $stmt = $pdo->query("SELECT id, username, email, name, role, status, created_at, updated_at FROM users ORDER BY created_at DESC");
    $allUsers = $stmt->fetchAll();

    // Fetch only pending users
    $stmt2 = $pdo->query("SELECT id, username, email, name, role, status, created_at, updated_at FROM users WHERE status = 'pending' ORDER BY created_at DESC");
    $pendingUsers = $stmt2->fetchAll();

    echo json_encode([
        'success' => true,
        'allUsers' => $allUsers,
        'pendingUsers' => $pendingUsers
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?> 