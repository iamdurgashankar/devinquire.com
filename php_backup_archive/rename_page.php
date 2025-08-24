<?php
require 'db.php';
header('Content-Type: application/json');
try {
  $data = json_decode(file_get_contents('php://input'), true);
  $oldId = trim($data['oldId'] ?? '');
  $newId = trim($data['newId'] ?? '');
  $newTitle = isset($data['newTitle']) ? trim($data['newTitle']) : null;
  if (!$oldId || !$newId) {
    echo json_encode(['success' => false, 'message' => 'Both old and new page IDs are required.']);
    exit;
  }
  // Check if newId already exists (and is not the same as oldId)
  if ($oldId !== $newId) {
    $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM pages WHERE id = ?');
    $stmt->execute([$newId]);
    $row = $stmt->fetch();
    if ($row['count'] > 0) {
      echo json_encode(['success' => false, 'message' => 'New page ID already exists.']);
      exit;
    }
  }
  if ($newTitle !== null) {
    $stmt = $pdo->prepare('UPDATE pages SET id = ?, title = ? WHERE id = ?');
    $stmt->execute([$newId, $newTitle, $oldId]);
  } else {
    $stmt = $pdo->prepare('UPDATE pages SET id = ? WHERE id = ?');
    $stmt->execute([$newId, $oldId]);
  }
  echo json_encode(['success' => true, 'message' => 'Page renamed successfully.']);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
  exit;
} 