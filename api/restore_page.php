<?php
require 'db.php';
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? '';
if (!$id) {
  echo json_encode(['success' => false, 'message' => 'Missing page ID.']);
  exit;
}
$stmt = $pdo->prepare('UPDATE pages SET deleted = 0 WHERE id = ?');
$success = $stmt->execute([$id]);
echo json_encode(['success' => $success]); 