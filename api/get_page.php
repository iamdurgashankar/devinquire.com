<?php
require 'db.php';
header('Content-Type: application/json');
try {
  $id = $_GET['id'] ?? '';
  $deleted = isset($_GET['deleted']) ? (int)$_GET['deleted'] : 0;
  if (!$id) {
    // List all pages
    if ($deleted) {
      $stmt = $pdo->query("SELECT id, title, updated_at, position FROM pages WHERE deleted = 1 ORDER BY position ASC, updated_at DESC");
    } else {
      $stmt = $pdo->query("SELECT id, title, updated_at, position FROM pages WHERE deleted = 0 ORDER BY position ASC, updated_at DESC");
    }
    $pages = $stmt->fetchAll();
    echo json_encode(['success' => true, 'pages' => $pages]);
    exit;
  }
  $stmt = $pdo->prepare("SELECT html, css FROM pages WHERE id = ?");
  $stmt->execute([$id]);
  $page = $stmt->fetch();
  echo json_encode([
    'success' => !!$page,
    'html' => $page['html'] ?? '',
    'css' => $page['css'] ?? ''
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Server error: ' . $e->getMessage()
  ]);
  exit;
} 