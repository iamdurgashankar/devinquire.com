<?php
require_once 'db.php';
session_start();

header('Content-Type: application/json');

// Check if user is admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['order']) || !is_array($input['order'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$order = $input['order'];

try {
    $stmt = $pdo->prepare("UPDATE pages SET position = ? WHERE id = ?");
    foreach ($order as $pos => $pageId) {
        $stmt->execute([$pos, $pageId]);
    }
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error', 'details' => $e->getMessage()]);
} 