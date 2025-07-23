<?php
require 'db.php';
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? '';
$newId = $data['newId'] ?? '';
if (!$id || !$newId) {
  echo json_encode(['success' => false, 'message' => 'Missing page ID(s).']);
  exit;
}
// Check if newId already exists
$stmt = $pdo->prepare('SELECT COUNT(*) FROM pages WHERE id = ?');
$stmt->execute([$newId]);
if ($stmt->fetchColumn() > 0) {
  echo json_encode(['success' => false, 'message' => 'A page with that ID already exists.']);
  exit;
}
$stmt = $pdo->prepare('SELECT html, css FROM pages WHERE id = ?');
$stmt->execute([$id]);
$page = $stmt->fetch();
if (!$page) {
  echo json_encode(['success' => false, 'message' => 'Source page not found.']);
  exit;
}
$stmt = $pdo->prepare('INSERT INTO pages (id, html, css, deleted) VALUES (?, ?, ?, 0)');
$success = $stmt->execute([$newId, $page['html'], $page['css']]);
echo json_encode(['success' => $success]); 