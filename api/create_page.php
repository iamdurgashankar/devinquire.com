<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require 'db.php';
header('Content-Type: application/json');
try {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = trim($data['id'] ?? '');
    $html = $data['html'] ?? '';
    $css = $data['css'] ?? '';
    $title = trim($data['title'] ?? $id);
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Page ID is required.']);
        exit;
    }
    // Check if page already exists
    $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM pages WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if ($row['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Page ID already exists.']);
        exit;
    }
    $stmt = $pdo->prepare('INSERT INTO pages (id, title, html, css, deleted) VALUES (?, ?, ?, ?, 0)');
    $stmt->execute([$id, $title, $html, $css]);
    echo json_encode(['success' => true, 'message' => 'Page created successfully.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
    exit;
} 