<?php
/**
 * Blog API - Direct Firebase Firestore Connection
 * 
 * This PHP script connects directly to Firebase Firestore REST API
 * No Node.js or Firebase SDK required - pure PHP with cURL
 * 
 * Works on Hostinger shared hosting
 * 
 * Usage: /api/blog-firebase-direct.php?action=posts&category=Web%20Development
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

// Configuration - Set these in your .env file or here
$FIREBASE_PROJECT_ID = $_ENV['FIREBASE_PROJECT_ID'] ?? 'your-project-id';
$FIREBASE_API_KEY = $_ENV['FIREBASE_API_KEY'] ?? '';

// Validate API key (optional)
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['apiKey'] ?? '';
$validApiKey = '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271';

if ($apiKey && $apiKey !== $validApiKey) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid API key']);
    exit();
}

// Get request parameters
$action = $_GET['action'] ?? 'posts';
$category = $_GET['category'] ?? '';
$status = $_GET['status'] ?? 'published';
$limit = (int)($_GET['limit'] ?? 20);
$page = (int)($_GET['page'] ?? 1);
$offset = ($page - 1) * $limit;

/**
 * Get Firebase Access Token using Service Account
 * This uses OAuth2 to get a token for Firebase Admin API
 */
function getFirebaseAccessToken($serviceAccountJson) {
    $serviceAccount = json_decode($serviceAccountJson, true);
    
    if (!$serviceAccount) {
        return null;
    }
    
    // Create JWT for OAuth2
    $now = time();
    $exp = $now + 3600; // 1 hour
    
    $header = [
        'alg' => 'RS256',
        'typ' => 'JWT'
    ];
    
    $payload = [
        'iss' => $serviceAccount['client_email'],
        'scope' => 'https://www.googleapis.com/auth/datastore',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => $exp,
        'iat' => $now
    ];
    
    // Note: For production, use OpenSSL to sign JWT properly
    // This is a simplified version - you may need to install phpseclib
    // For now, we'll use a simpler approach with REST API
    
    return null; // Will use alternative method
}

/**
 * Fetch posts from Firebase Firestore using REST API
 * This method works without requiring Firebase Admin SDK
 */
function fetchPostsFromFirebase($projectId, $category = '', $status = 'published', $limit = 20) {
    // Firebase Firestore REST API endpoint
    $baseUrl = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/posts";
    
    // Build query - we'll fetch all and filter in PHP (simpler for shared hosting)
    $url = $baseUrl;
    
    // Use cURL to fetch
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'CURL Error: ' . $error];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => "HTTP {$httpCode}: " . substr($response, 0, 200)];
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['documents'])) {
        return ['success' => false, 'error' => 'Invalid response format', 'data' => $data];
    }
    
    // Process documents
    $posts = [];
    foreach ($data['documents'] as $doc) {
        $fields = $doc['fields'] ?? [];
        
        // Extract field values from Firestore format
        $post = extractFirestoreFields($fields);
        $post['id'] = basename($doc['name']);
        
        // Filter by status
        if (isset($post['status']) && $post['status'] !== $status) {
            continue;
        }
        
        // Filter by isPublic
        if (!isset($post['isPublic']) || !$post['isPublic']) {
            continue;
        }
        
        // Filter by category
        if ($category && isset($post['category']) && $post['category'] !== $category) {
            continue;
        }
        
        $posts[] = $post;
    }
    
    // Sort by publishedAt
    usort($posts, function($a, $b) {
        $dateA = $a['publishedAt'] ?? $a['createdAt'] ?? '';
        $dateB = $b['publishedAt'] ?? $b['createdAt'] ?? '';
        return strcmp($dateB, $dateA); // Descending
    });
    
    return ['success' => true, 'posts' => $posts];
}

/**
 * Extract field values from Firestore document format
 */
function extractFirestoreFields($fields) {
    $result = [];
    
    foreach ($fields as $key => $value) {
        if (isset($value['stringValue'])) {
            $result[$key] = $value['stringValue'];
        } elseif (isset($value['integerValue'])) {
            $result[$key] = (int)$value['integerValue'];
        } elseif (isset($value['doubleValue'])) {
            $result[$key] = (float)$value['doubleValue'];
        } elseif (isset($value['booleanValue'])) {
            $result[$key] = $value['booleanValue'];
        } elseif (isset($value['timestampValue'])) {
            // Convert Firestore timestamp to ISO string
            $timestamp = strtotime($value['timestampValue']);
            $result[$key] = date('c', $timestamp); // ISO 8601 format
        } elseif (isset($value['arrayValue']['values'])) {
            // Handle arrays
            $array = [];
            foreach ($value['arrayValue']['values'] as $item) {
                if (isset($item['stringValue'])) {
                    $array[] = $item['stringValue'];
                } elseif (isset($item['integerValue'])) {
                    $array[] = (int)$item['integerValue'];
                }
            }
            $result[$key] = $array;
        } elseif (isset($value['mapValue']['fields'])) {
            // Handle nested objects
            $result[$key] = extractFirestoreFields($value['mapValue']['fields']);
        } elseif (isset($value['nullValue'])) {
            $result[$key] = null;
        }
    }
    
    return $result;
}

/**
 * Format post for API response
 */
function formatPostForAPI($post) {
    // Handle nested author object
    $author = [
        'name' => $post['author']['name'] ?? $post['author_name'] ?? 'Anonymous',
        'avatar' => $post['author']['avatar'] ?? $post['author_avatar'] ?? null
    ];
    
    // Handle featured image
    $featuredImage = $post['featuredImage'] ?? $post['featured_image'] ?? null;
    
    // Handle read time
    $readTime = $post['readTime'] ?? $post['analytics']['readTime'] ?? 5;
    
    // Handle views
    $views = $post['views'] ?? $post['analytics']['views'] ?? 0;
    
    return [
        'id' => $post['id'],
        'title' => $post['title'] ?? '',
        'slug' => $post['slug'] ?? '',
        'excerpt' => $post['excerpt'] ?? '',
        'content' => $post['content'] ?? '',
        'category' => $post['category'] ?? 'Uncategorized',
        'tags' => $post['tags'] ?? [],
        'author' => $author,
        'publishedAt' => $post['publishedAt'] ?? $post['metadata']['publishedAt'] ?? null,
        'updatedAt' => $post['updatedAt'] ?? $post['metadata']['updatedAt'] ?? null,
        'featuredImage' => $featuredImage,
        'readTime' => $readTime,
        'views' => $views,
        'likes' => $post['likes'] ?? $post['analytics']['likes'] ?? 0
    ];
}

// Main handler
try {
    switch ($action) {
        case 'posts':
            $result = fetchPostsFromFirebase($FIREBASE_PROJECT_ID, $category, $status, $limit);
            
            if (!$result['success']) {
                http_response_code(500);
                echo json_encode($result);
                exit();
            }
            
            $allPosts = $result['posts'];
            
            // Apply pagination
            $total = count($allPosts);
            $paginatedPosts = array_slice($allPosts, $offset, $limit);
            
            // Format posts
            $formattedPosts = array_map('formatPostForAPI', $paginatedPosts);
            
            // Response
            echo json_encode([
                'success' => true,
                'data' => [
                    'posts' => $formattedPosts,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'totalPages' => ceil($total / $limit),
                        'hasNext' => ($offset + $limit) < $total,
                        'hasPrev' => $page > 1
                    ]
                ],
                'timestamp' => date('c')
            ]);
            break;
            
        case 'categories':
            $result = fetchPostsFromFirebase($FIREBASE_PROJECT_ID, '', 'published', 1000);
            
            if (!$result['success']) {
                http_response_code(500);
                echo json_encode($result);
                exit();
            }
            
            // Extract unique categories
            $categoryCount = [];
            foreach ($result['posts'] as $post) {
                $cat = $post['category'] ?? 'Uncategorized';
                if ($cat) {
                    $categoryCount[$cat] = ($categoryCount[$cat] ?? 0) + 1;
                }
            }
            
            $categories = [];
            foreach ($categoryCount as $name => $count) {
                $categories[] = [
                    'name' => $name,
                    'count' => $count,
                    'slug' => strtolower(str_replace(' ', '-', $name))
                ];
            }
            
            echo json_encode([
                'success' => true,
                'data' => $categories,
                'timestamp' => date('c')
            ]);
            break;
            
        case 'tags':
            $result = fetchPostsFromFirebase($FIREBASE_PROJECT_ID, '', 'published', 1000);
            
            if (!$result['success']) {
                http_response_code(500);
                echo json_encode($result);
                exit();
            }
            
            // Extract tags
            $tagCount = [];
            foreach ($result['posts'] as $post) {
                $tags = $post['tags'] ?? [];
                if (is_array($tags)) {
                    foreach ($tags as $tag) {
                        if ($tag) {
                            $tagCount[$tag] = ($tagCount[$tag] ?? 0) + 1;
                        }
                    }
                }
            }
            
            $tags = [];
            foreach ($tagCount as $name => $count) {
                $tags[] = [
                    'name' => $name,
                    'count' => $count,
                    'slug' => strtolower(str_replace(' ', '-', $name))
                ];
            }
            
            // Sort by count
            usort($tags, function($a, $b) {
                return $b['count'] - $a['count'];
            });
            
            echo json_encode([
                'success' => true,
                'data' => $tags,
                'timestamp' => date('c')
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}



