<?php
header('Content-Type: application/json');
require 'db.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Check if user is admin
if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Validate required fields
$requiredFields = ['title', 'excerpt', 'content', 'category', 'status'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

try {
    $title = trim($data['title']);
    $excerpt = trim($data['excerpt']);
    $content = trim($data['content']);
    $category = trim($data['category']);
    $status = trim($data['status']);
    $tags = isset($data['tags']) ? json_encode($data['tags']) : '[]';
    $featured_image = isset($data['featured_image']) ? trim($data['featured_image']) : '';
    $author_name = isset($data['author_name']) ? trim($data['author_name']) : $_SESSION['name'];
    $readTime = isset($data['readTime']) ? trim($data['readTime']) : '5 min read';

    // Validate status
    $allowedStatuses = ['draft', 'published', 'archived'];
    if (!in_array($status, $allowedStatuses)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit;
    }

    // Insert post into database
    $stmt = $pdo->prepare("
        INSERT INTO posts (
            title, excerpt, content, category, tags, featured_image, 
            author_name, read_time, status, author_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $stmt->execute([
        $title,
        $excerpt,
        $content,
        $category,
        $tags,
        $featured_image,
        $author_name,
        $readTime,
        $status,
        $_SESSION['user_id']
    ]);

    $postId = $pdo->lastInsertId();

    // Get the created post
    $stmt = $pdo->prepare("
        SELECT * FROM posts WHERE id = ?
    ");
    $stmt->execute([$postId]);
    $post = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'message' => 'Post created successfully',
        'data' => $post
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 