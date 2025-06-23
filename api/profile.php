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
session_start(); // Or use token auth

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['id'];
    $stmt = $pdo->prepare("SELECT id, username, email, name, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    echo json_encode($user);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['id'];
    $name = $data['name'];
    $password = isset($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;

    if ($password) {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, password_hash = ? WHERE id = ?");
        $stmt->execute([$name, $password, $userId]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET name = ? WHERE id = ?");
        $stmt->execute([$name, $userId]);
    }
    echo json_encode(['success' => true]);
}
?> 