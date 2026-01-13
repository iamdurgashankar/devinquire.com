<?php
/**
 * Blog API - Firebase Firestore Integration
 * 
 * This endpoint connects to Firebase Firestore to fetch blog posts
 * and syncs them to MySQL for faster access on Hostinger shared hosting
 * 
 * Usage: /api/blog-firebase.php?action=posts&category=Web%20Development
 */

require_once 'config/database.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate API key (optional but recommended)
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['apiKey'] ?? '';
$validApiKey = '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271';

if ($apiKey && $apiKey !== $validApiKey) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid API key']);
    exit();
}

// Initialize database
try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        http_response_code(503);
        echo json_encode(['success' => false, 'error' => 'Database unavailable']);
        exit();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

// Get action
$action = $_GET['action'] ?? 'posts';
$category = $_GET['category'] ?? '';
$status = $_GET['status'] ?? 'published';
$limit = (int)($_GET['limit'] ?? 20);
$offset = (int)($_GET['offset'] ?? 0);

// Function to sync Firebase posts to MySQL
function syncFirebaseToMySQL($pdo) {
    // Check if we have Firebase PHP SDK installed
    // If not, we'll fetch via REST API
    
    $firebaseProjectId = $_ENV['FIREBASE_PROJECT_ID'] ?? '';
    $firebaseApiKey = $_ENV['FIREBASE_API_KEY'] ?? '';
    
    if (empty($firebaseProjectId)) {
        // Try to fetch from Firebase REST API
        return fetchFromFirebaseREST($pdo, $firebaseProjectId);
    }
    
    // If you have Firebase Admin SDK installed via Composer
    // Use: composer require kreait/firebase-php
    if (class_exists('Kreait\\Firebase\\Factory')) {
        return fetchFromFirebaseSDK($pdo);
    }
    
    // Fallback to REST API
    return fetchFromFirebaseREST($pdo, $firebaseProjectId);
}

// Fetch from Firebase using REST API (no SDK needed)
function fetchFromFirebaseREST($pdo, $projectId) {
    // Firebase REST API endpoint
    // Note: This requires your Firebase project to allow public access
    // Or use a service account with proper authentication
    
    $firebaseUrl = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/posts";
    
    // Build query
    $queryParams = [
        'where' => json_encode([
            'fieldFilter' => [
                'field' => ['fieldPath' => 'status'],
                'op' => 'EQUAL',
                'value' => ['stringValue' => 'published']
            ]
        ]),
        'where' => json_encode([
            'fieldFilter' => [
                'field' => ['fieldPath' => 'isPublic'],
                'op' => 'EQUAL',
                'value' => ['booleanValue' => true]
            ]
        ])
    ];
    
    // Use cURL to fetch
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $firebaseUrl . '?' . http_build_query($queryParams));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'Failed to fetch from Firebase'];
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['documents'])) {
        return ['success' => false, 'error' => 'Invalid Firebase response'];
    }
    
    // Sync to MySQL
    return syncPostsToMySQL($pdo, $data['documents']);
}

// Sync posts to MySQL
function syncPostsToMySQL($pdo, $firebasePosts) {
    foreach ($firebasePosts as $doc) {
        $firestoreId = basename($doc['name']);
        $fields = $doc['fields'] ?? [];
        
        // Extract data from Firestore format
        $title = $fields['title']['stringValue'] ?? '';
        $slug = $fields['slug']['stringValue'] ?? '';
        $content = $fields['content']['stringValue'] ?? '';
        $excerpt = $fields['excerpt']['stringValue'] ?? '';
        $category = $fields['category']['stringValue'] ?? 'Uncategorized';
        $status = $fields['status']['stringValue'] ?? 'published';
        
        // Get or create category
        $categorySlug = strtolower(str_replace(' ', '-', $category));
        $catStmt = $pdo->prepare("SELECT id FROM blog_categories WHERE slug = ?");
        $catStmt->execute([$categorySlug]);
        $cat = $catStmt->fetch();
        
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
        $existing = $checkStmt->fetch();
        
        // Extract published date
        $publishedAt = null;
        if (isset($fields['publishedAt'])) {
            if (isset($fields['publishedAt']['timestampValue'])) {
                $timestamp = strtotime($fields['publishedAt']['timestampValue']);
                $publishedAt = date('Y-m-d H:i:s', $timestamp);
            }
        }
        
        if (!$publishedAt) {
            $publishedAt = date('Y-m-d H:i:s');
        }
        
        if ($existing) {
            // Update
            $update = $pdo->prepare("
                UPDATE blog_posts SET 
                    title = ?, slug = ?, content = ?, excerpt = ?, 
                    category_id = ?, status = ?, published_at = ?, updated_at = NOW()
                WHERE firestore_id = ?
            ");
            $update->execute([$title, $slug, $content, $excerpt, $categoryId, $status, $publishedAt, $firestoreId]);
            $postId = $existing['id'];
        } else {
            // Insert
            $insert = $pdo->prepare("
                INSERT INTO blog_posts 
                (firestore_id, title, slug, content, excerpt, category_id, status, published_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $insert->execute([$firestoreId, $title, $slug, $content, $excerpt, $categoryId, $status, $publishedAt]);
            $postId = $pdo->lastInsertId();
        }
        
        // Sync tags
        if (isset($fields['tags']['arrayValue']['values'])) {
            $pdo->prepare("DELETE FROM blog_post_tags WHERE post_id = ?")->execute([$postId]);
            
            foreach ($fields['tags']['arrayValue']['values'] as $tagValue) {
                $tagName = $tagValue['stringValue'] ?? '';
                if (empty($tagName)) continue;
                
                $tagStmt = $pdo->prepare("SELECT id FROM blog_tags WHERE name = ?");
                $tagStmt->execute([$tagName]);
                $tag = $tagStmt->fetch();
                
                if (!$tag) {
                    $insertTag = $pdo->prepare("INSERT INTO blog_tags (name, slug) VALUES (?, ?)");
                    $tagSlug = strtolower(str_replace(' ', '-', $tagName));
                    $insertTag->execute([$tagName, $tagSlug]);
                    $tagId = $pdo->lastInsertId();
                } else {
                    $tagId = $tag['id'];
                }
                
                $linkTag = $pdo->prepare("INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)");
                $linkTag->execute([$postId, $tagId]);
            }
        }
    }
    
    return ['success' => true, 'synced' => count($firebasePosts)];
}

// Main handler
switch ($action) {
    case 'posts':
        // First, try to sync from Firebase
        $syncResult = syncFirebaseToMySQL($pdo);
        
        // Then fetch from MySQL (which is faster)
        getAllPosts($pdo, $category, $status, $limit, $offset);
        break;
        
    case 'categories':
        getCategories($pdo);
        break;
        
    case 'tags':
        getTags($pdo);
        break;
        
    default:
        getAllPosts($pdo, $category, $status, $limit, $offset);
        break;
}

function getAllPosts($pdo, $category, $status, $limit, $offset) {
    try {
        $sql = "
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE p.status = :status
        ";
        
        $params = ['status' => $status];
        
        if ($category) {
            $sql .= " AND c.slug = :category";
            $params['category'] = $category;
        }
        
        $sql .= " GROUP BY p.id ORDER BY p.published_at DESC, p.created_at DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process tags
        foreach ($posts as &$post) {
            $post['tags'] = $post['tags'] ? explode(',', $post['tags']) : [];
        }
        
        echo json_encode(['success' => true, 'data' => $posts]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch posts']);
    }
}

function getCategories($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT c.*, COUNT(p.id) as count
            FROM blog_categories c
            LEFT JOIN blog_posts p ON c.id = p.category_id AND p.status = 'published'
            GROUP BY c.id
            ORDER BY c.name
        ");
        
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $categories]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch categories']);
    }
}

function getTags($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT t.*, COUNT(pt.post_id) as count
            FROM blog_tags t
            LEFT JOIN blog_post_tags pt ON t.id = pt.tag_id
            LEFT JOIN blog_posts p ON pt.post_id = p.id AND p.status = 'published'
            GROUP BY t.id
            ORDER BY count DESC
        ");
        
        $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $tags]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch tags']);
    }
}



