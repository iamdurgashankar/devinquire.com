<?php
require 'db.php';
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? '';
$permanent = !empty($data['permanent']);
if (!$id) {
  echo json_encode(['success' => false, 'message' => 'Missing page ID.']);
  exit;
}
if ($permanent) {
  $stmt = $pdo->prepare('DELETE FROM pages WHERE id = ?');
  $success = $stmt->execute([$id]);
} else {
  $stmt = $pdo->prepare('UPDATE pages SET deleted = 1 WHERE id = ?');
  $success = $stmt->execute([$id]);
}
echo json_encode(['success' => $success]); 