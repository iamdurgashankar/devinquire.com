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

$stmt = $pdo->prepare("SELECT id, username, email, name, role, created_at FROM users WHERE status = 'pending'");
$stmt->execute();
$pendingUsers = $stmt->fetchAll();
echo json_encode(['success' => true, 'data' => $pendingUsers]);
?> 