<?php
// Test script to verify blog functionality
echo "=== Blog Functionality Test ===\n\n";

// Test database connection
echo "1. Testing database connection...\n";
require 'api/db.php';
echo "✓ Database connection successful\n\n";

// Test posts table
echo "2. Testing posts table...\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM posts");
    $row = $stmt->fetch();
    echo "✓ Posts table exists with {$row['count']} posts\n\n";
} catch (Exception $e) {
    echo "✗ Error checking posts table: " . $e->getMessage() . "\n\n";
}

// Test creating a post
echo "3. Testing post creation...\n";
try {
    $stmt = $pdo->prepare("
        INSERT INTO posts (
            title, excerpt, content, category, tags, featured_image,
            author_name, read_time, status, author_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $testPost = [
        'Test Blog Post',
        'This is a test excerpt for the blog post.',
        'This is the full content of the test blog post. It contains multiple sentences to test the functionality.',
        'Web Development',
        json_encode(['test', 'blog', 'php']),
        'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Test+Image',
        'Test Author',
        '3 min read',
        'published',
        1
    ];
    
    $stmt->execute($testPost);
    $postId = $pdo->lastInsertId();
    echo "✓ Test post created with ID: $postId\n\n";
    
    // Test retrieving the post
    echo "4. Testing post retrieval...\n";
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    
    if ($post) {
        echo "✓ Post retrieved successfully:\n";
        echo "  - Title: " . $post['title'] . "\n";
        echo "  - Category: " . $post['category'] . "\n";
        echo "  - Status: " . $post['status'] . "\n";
        echo "  - Author: " . $post['author_name'] . "\n";
    } else {
        echo "✗ Failed to retrieve post\n";
    }
    echo "\n";
    
    // Test updating the post
    echo "5. Testing post update...\n";
    $stmt = $pdo->prepare("UPDATE posts SET title = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute(['Updated Test Blog Post', $postId]);
    
    $stmt = $pdo->prepare("SELECT title FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $updatedPost = $stmt->fetch();
    
    if ($updatedPost && $updatedPost['title'] === 'Updated Test Blog Post') {
        echo "✓ Post updated successfully\n\n";
    } else {
        echo "✗ Failed to update post\n\n";
    }
    
    // Test deleting the post
    echo "6. Testing post deletion...\n";
    $stmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $deletedCheck = $stmt->fetch();
    
    if ($deletedCheck['count'] == 0) {
        echo "✓ Post deleted successfully\n\n";
    } else {
        echo "✗ Failed to delete post\n\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error during blog tests: " . $e->getMessage() . "\n\n";
}

// Test getting all posts
echo "7. Testing get all posts...\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM posts");
    $totalPosts = $stmt->fetch();
    
    $stmt = $pdo->query("SELECT id, title, status FROM posts ORDER BY created_at DESC LIMIT 5");
    $recentPosts = $stmt->fetchAll();
    
    echo "✓ Total posts in database: {$totalPosts['total']}\n";
    if (count($recentPosts) > 0) {
        echo "✓ Recent posts:\n";
        foreach ($recentPosts as $post) {
            echo "  - ID: {$post['id']}, Title: {$post['title']}, Status: {$post['status']}\n";
        }
    } else {
        echo "  No posts found in database\n";
    }
} catch (Exception $e) {
    echo "✗ Error getting posts: " . $e->getMessage() . "\n";
}

echo "\n=== Blog Test Complete ===\n";
echo "If all tests passed, the blog functionality should work correctly.\n";
echo "You can now create, update, and delete blog posts through the admin panel.\n";
?> 