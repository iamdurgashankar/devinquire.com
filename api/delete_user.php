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
session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['id'];

// Prevent admin from deleting themselves (optional)
if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $userId) {
    echo json_encode(['success' => false, 'message' => 'Admin cannot delete themselves.']);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
$stmt->execute([$userId]);
echo json_encode(['success' => true]);
?> 