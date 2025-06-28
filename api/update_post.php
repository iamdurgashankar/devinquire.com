<?php
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

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing post ID']);
    exit;
}

try {
    $postId = intval($data['id']);
    
    // Check if post exists
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $existingPost = $stmt->fetch();
    
    if (!$existingPost) {
        echo json_encode(['success' => false, 'message' => 'Post not found']);
        exit;
    }

    // Validate required fields if provided
    if (isset($data['title']) && empty(trim($data['title']))) {
        echo json_encode(['success' => false, 'message' => 'Title cannot be empty']);
        exit;
    }

    if (isset($data['excerpt']) && empty(trim($data['excerpt']))) {
        echo json_encode(['success' => false, 'message' => 'Excerpt cannot be empty']);
        exit;
    }

    if (isset($data['content']) && empty(trim($data['content']))) {
        echo json_encode(['success' => false, 'message' => 'Content cannot be empty']);
        exit;
    }

    // Prepare update data
    $updateFields = [];
    $updateValues = [];

    if (isset($data['title'])) {
        $updateFields[] = 'title = ?';
        $updateValues[] = trim($data['title']);
    }

    if (isset($data['excerpt'])) {
        $updateFields[] = 'excerpt = ?';
        $updateValues[] = trim($data['excerpt']);
    }

    if (isset($data['content'])) {
        $updateFields[] = 'content = ?';
        $updateValues[] = trim($data['content']);
    }

    if (isset($data['category'])) {
        $updateFields[] = 'category = ?';
        $updateValues[] = trim($data['category']);
    }

    if (isset($data['tags'])) {
        $updateFields[] = 'tags = ?';
        $updateValues[] = json_encode($data['tags']);
    }

    if (isset($data['featured_image'])) {
        $updateFields[] = 'featured_image = ?';
        $updateValues[] = trim($data['featured_image']);
    }

    if (isset($data['author_name'])) {
        $updateFields[] = 'author_name = ?';
        $updateValues[] = trim($data['author_name']);
    }

    if (isset($data['readTime'])) {
        $updateFields[] = 'read_time = ?';
        $updateValues[] = trim($data['readTime']);
    }

    if (isset($data['status'])) {
        $allowedStatuses = ['draft', 'published', 'archived'];
        if (!in_array($data['status'], $allowedStatuses)) {
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            exit;
        }
        $updateFields[] = 'status = ?';
        $updateValues[] = $data['status'];
    }

    // Add updated_at timestamp
    $updateFields[] = 'updated_at = NOW()';
    
    // Add post ID to values
    $updateValues[] = $postId;

    // Update post
    $sql = "UPDATE posts SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($updateValues);

    // Get updated post
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $updatedPost = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'message' => 'Post updated successfully',
        'data' => $updatedPost
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 