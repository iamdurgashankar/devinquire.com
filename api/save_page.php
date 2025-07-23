<?php
require 'db.php';
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? '';
$html = $data['html'] ?? '';
$css = $data['css'] ?? '';
if (!$id) {
  echo json_encode(['success' => false]);
  exit;
}
// Check if page exists
$stmt = $pdo->prepare("SELECT COUNT(*) FROM pages WHERE id = ?");
$stmt->execute([$id]);
$exists = $stmt->fetchColumn() > 0;
if ($exists) {
  $stmt = $pdo->prepare("UPDATE pages SET html = ?, css = ? WHERE id = ?");
  $success = $stmt->execute([$html, $css, $id]);
} else {
  $stmt = $pdo->prepare("INSERT INTO pages (id, html, css) VALUES (?, ?, ?)");
  $success = $stmt->execute([$id, $html, $css]);
}
echo json_encode(['success' => $success]); 