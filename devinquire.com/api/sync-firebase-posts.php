<?php
/**
 * Sync Firebase Firestore Posts to MySQL
 * 
 * This script fetches posts from Firebase and syncs them to MySQL database
 * Run this via cron job every 5-10 minutes on Hostinger
 * 
 * Cron setup: */5 * * * * /usr/bin/php /path/to/sync-firebase-posts.php
 */

require_once 'config/database.php';

// Load Firebase configuration
$FIREBASE_PROJECT_ID = $_ENV['FIREBASE_PROJECT_ID'] ?? 'devinquirecom';
$FIREBASE_WEB_API_KEY = $_ENV['FIREBASE_WEB_API_KEY'] ?? '';

// Initialize database
try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        error_log("Failed to connect to database");
        exit(1);
    }
} catch (Exception $e) {
    error_log("Database error: " . $e->getMessage());
    exit(1);
}

/**
 * Fetch posts from Firebase using REST API
 * This uses the Firebase REST API which doesn't require Admin SDK
 */
function fetchFirebasePosts($projectId) {
    // Firebase Firestore REST API endpoint
    $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/posts";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log("CURL Error: " . $error);
        return null;
    }
    
    if ($httpCode !== 200) {
        error_log("HTTP {$httpCode}: " . substr($response, 0, 200));
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['documents'])) {
        error_log("Invalid response format");
        return null;
    }
    
    return $data['documents'];
}

/**
 * Extract field value from Firestore format
 */
function getFieldValue($field) {
    if (isset($field['stringValue'])) {
        return $field['stringValue'];
    } elseif (isset($field['integerValue'])) {
        return (int)$field['integerValue'];
    } elseif (isset($field['doubleValue'])) {
        return (float)$field['doubleValue'];
    } elseif (isset($field['booleanValue'])) {
        return $field['booleanValue'];
    } elseif (isset($field['timestampValue'])) {
        $timestamp = strtotime($field['timestampValue']);
        return date('Y-m-d H:i:s', $timestamp);
    } elseif (isset($field['arrayValue']['values'])) {
        $array = [];
        foreach ($field['arrayValue']['values'] as $item) {
            if (isset($item['stringValue'])) {
                $array[] = $item['stringValue'];
            }
        }
        return $array;
    } elseif (isset($field['mapValue']['fields'])) {
        $map = [];
        foreach ($field['mapValue']['fields'] as $key => $value) {
            $map[$key] = getFieldValue($value);
        }
        return $map;
    } elseif (isset($field['nullValue'])) {
        return null;
    }
    return null;
}

/**
 * Sync a single post to MySQL
 */
function syncPostToMySQL($pdo, $firestoreDoc) {
    $fields = $firestoreDoc['fields'] ?? [];
    $firestoreId = basename($firestoreDoc['name']);
    
    // Extract post data
    $title = getFieldValue($fields['title'] ?? null) ?? '';
    $slug = getFieldValue($fields['slug'] ?? null) ?? '';
    $content = getFieldValue($fields['content'] ?? null) ?? '';
    $excerpt = getFieldValue($fields['excerpt'] ?? null) ?? '';
    $status = getFieldValue($fields['status'] ?? null) ?? 'draft';
    $isPublic = getFieldValue($fields['isPublic'] ?? null) ?? false;
    $category = getFieldValue($fields['category'] ?? null) ?? 'Uncategorized';
    $tags = getFieldValue($fields['tags'] ?? null) ?? [];
    
    // Only sync published and public posts
    if ($status !== 'published' || !$isPublic) {
        return false;
    }
    
    // Get author info
    $authorData = getFieldValue($fields['author'] ?? null);
    $authorName = is_array($authorData) ? ($authorData['name'] ?? 'Admin') : ($fields['author_name']['stringValue'] ?? 'Admin');
    
    // Get featured image
    $featuredImage = getFieldValue($fields['featuredImage'] ?? null) ?? getFieldValue($fields['featured_image'] ?? null);
    
    // Get dates
    $publishedAt = getFieldValue($fields['publishedAt'] ?? null) ?? getFieldValue($fields['metadata']['mapValue']['fields']['publishedAt'] ?? null);
    if (!$publishedAt) {
        $publishedAt = date('Y-m-d H:i:s');
    }
    
    $updatedAt = getFieldValue($fields['updatedAt'] ?? null) ?? getFieldValue($fields['metadata']['mapValue']['fields']['updatedAt'] ?? null);
    if (!$updatedAt) {
        $updatedAt = date('Y-m-d H:i:s');
    }
    
    // Get or create category
    $categorySlug = strtolower(str_replace(' ', '-', $category));
    $catStmt = $pdo->prepare("SELECT id FROM blog_categories WHERE slug = ?");
    $catStmt->execute([$categorySlug]);
    $cat = $catStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$cat) {
        $insertCat = $pdo->prepare("INSERT INTO blog_categories (name, slug) VALUES (?, ?)");
        $insertCat->execute([$category, $categorySlug]);
        $categoryId = $pdo->lastInsertId();
    } else {
        $categoryId = $cat['id'];
    }
    
    // Check if post exists
    $checkStmt = $pdo->prepare("SELECT id FROM blog_posts WHERE firestore_id = ?");
    $checkStmt->execute([$firestoreId]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        // Update existing post
        $update = $pdo->prepare("
            UPDATE blog_posts SET 
                title = ?, slug = ?, content = ?, excerpt = ?, 
                category_id = ?, status = ?, author_name = ?, 
                featured_image = ?, published_at = ?, updated_at = NOW()
            WHERE firestore_id = ?
        ");
        $update->execute([
            $title, $slug, $content, $excerpt, 
            $categoryId, $status, $authorName, 
            $featuredImage, $publishedAt, $firestoreId
        ]);
        $postId = $existing['id'];
    } else {
        // Insert new post
        $insert = $pdo->prepare("
            INSERT INTO blog_posts 
            (firestore_id, title, slug, content, excerpt, category_id, 
             status, author_name, featured_image, published_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $insert->execute([
            $firestoreId, $title, $slug, $content, $excerpt, 
            $categoryId, $status, $authorName, $featuredImage, $publishedAt
        ]);
        $postId = $pdo->lastInsertId();
    }
    
    // Sync tags
    if (is_array($tags) && !empty($tags)) {
        // Delete existing tags
        $pdo->prepare("DELETE FROM blog_post_tags WHERE post_id = ?")->execute([$postId]);
        
        foreach ($tags as $tagName) {
            if (empty($tagName)) continue;
            
            // Get or create tag
            $tagStmt = $pdo->prepare("SELECT id FROM blog_tags WHERE name = ?");
            $tagStmt->execute([$tagName]);
            $tag = $tagStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$tag) {
                $insertTag = $pdo->prepare("INSERT INTO blog_tags (name, slug) VALUES (?, ?)");
                $tagSlug = strtolower(str_replace(' ', '-', $tagName));
                $insertTag->execute([$tagName, $tagSlug]);
                $tagId = $pdo->lastInsertId();
            } else {
                $tagId = $tag['id'];
            }
            
            // Link tag to post
            $linkTag = $pdo->prepare("INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)");
            $linkTag->execute([$postId, $tagId]);
        }
    }
    
    return true;
}

// Main sync process
try {
    echo "Starting Firebase sync...\n";
    
    // Fetch posts from Firebase
    $documents = fetchFirebasePosts($FIREBASE_PROJECT_ID);
    
    if (!$documents) {
        echo "Failed to fetch posts from Firebase\n";
        exit(1);
    }
    
    echo "Fetched " . count($documents) . " documents from Firebase\n";
    
    // Sync each post
    $synced = 0;
    $skipped = 0;
    
    foreach ($documents as $doc) {
        if (syncPostToMySQL($pdo, $doc)) {
            $synced++;
        } else {
            $skipped++;
        }
    }
    
    echo "✅ Sync completed: {$synced} posts synced, {$skipped} skipped\n";
    
} catch (Exception $e) {
    error_log("Sync error: " . $e->getMessage());
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}



