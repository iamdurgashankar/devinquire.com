<?php
require 'db.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing post ID']);
    exit;
}

try {
    $postId = intval($_GET['id']);
    
    // Get post
    $stmt = $pdo->prepare("
        SELECT 
            id, title, excerpt, content, category, tags, featured_image,
            author_name, read_time, status, views, likes, created_at, updated_at
        FROM posts 
        WHERE id = ?
    ");
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    
    if (!$post) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Post not found']);
        exit;
    }
    
    // Process tags from JSON
    if ($post['tags']) {
        $post['tags'] = json_decode($post['tags'], true) ?: [];
    } else {
        $post['tags'] = [];
    }
    
    // Add readTime alias for compatibility
    $post['readTime'] = $post['read_time'];
    
    // Increment view count
    $stmt = $pdo->prepare("UPDATE posts SET views = views + 1 WHERE id = ?");
    $stmt->execute([$postId]);
    
    echo json_encode([
        'success' => true,
        'data' => $post
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 