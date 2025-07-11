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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 10;
    $category = isset($_GET['category']) ? trim($_GET['category']) : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    
    $offset = ($page - 1) * $limit;
    
    // Build WHERE clause
    $whereConditions = [];
    $params = [];
    
    if ($category && $category !== 'All') {
        $whereConditions[] = 'category = ?';
        $params[] = $category;
    }
    
    if ($status) {
        $whereConditions[] = 'status = ?';
        $params[] = $status;
    }
    
    $whereClause = '';
    if (!empty($whereConditions)) {
        $whereClause = 'WHERE ' . implode(' AND ', $whereConditions);
    }
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM posts $whereClause";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $totalResult = $stmt->fetch();
    $total = $totalResult['total'];
    
    // Get posts
    $sql = "
        SELECT 
            id, title, excerpt, content, category, tags, featured_image,
            author_name, read_time, status, views, likes, created_at, updated_at
        FROM posts 
        $whereClause 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    ";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll();
    
    // Process tags from JSON
    foreach ($posts as &$post) {
        if ($post['tags']) {
            $post['tags'] = json_decode($post['tags'], true) ?: [];
        } else {
            $post['tags'] = [];
        }
        // Add readTime alias for compatibility
        $post['readTime'] = $post['read_time'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'posts' => $posts,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?> 