<?php
header('Content-Type: application/json');
require 'db.php';
session_start();

// Only admins can update user roles
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admins only.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = isset($data['id']) ? intval($data['id']) : 0;
$newRole = isset($data['role']) ? trim($data['role']) : '';

$allowedRoles = ['user', 'admin', 'author'];
if (!$userId || !in_array($newRole, $allowedRoles)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid user ID or role.']);
    exit;
}

try {
    // Prevent admin from demoting themselves
    if ($userId == $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'You cannot change your own role.']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
    $stmt->execute([$newRole, $userId]);

    echo json_encode(['success' => true, 'message' => 'User role updated successfully.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} 