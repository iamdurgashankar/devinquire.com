<?php
/**
 * Firebase to MySQL Sync Script
 * Pre-configured for devinquire.com
 * 
 * This script syncs blog posts from Firebase Firestore to MySQL database
 * Run via cron job every 5 minutes
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Log file location
$logFile = __DIR__ . '/sync.log';

// Logging function
function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    echo $logEntry;
}

// Start logging
logMessage("Starting Firebase sync...");

// Load database configuration
require_once __DIR__ . '/config/database.php';

// Firebase configuration
$firebaseProjectId = 'devinquirecom';
$firebaseCollection = 'posts';

// Firebase REST API endpoint
$firebaseUrl = "https://firestore.googleapis.com/v1/projects/{$firebaseProjectId}/databases/(default)/documents/{$firebaseCollection}";

try {
    // Fetch posts from Firebase
    logMessage("Fetching posts from Firebase...");
    
    $ch = curl_init($firebaseUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        throw new Exception("cURL error: " . curl_error($ch));
    }
    
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Firebase API returned HTTP $httpCode: $response");
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['documents'])) {
        throw new Exception("Invalid response from Firebase: " . $response);
    }
    
    $documents = $data['documents'];
    logMessage("Fetched " . count($documents) . " documents from Firebase");
    
    // Connect to database
    $pdo = getDatabaseConnection();
    
    // Prepare SQL statements
    $insertStmt = $pdo->prepare("
        INSERT INTO blog_posts (
            firestore_id, title, content, excerpt, author, 
            category, status, published_at, created_at, updated_at
        ) VALUES (
            :firestore_id, :title, :content, :excerpt, :author,
            :category, :status, :published_at, :created_at, :updated_at
        ) ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            content = VALUES(content),
            excerpt = VALUES(excerpt),
            author = VALUES(author),
            category = VALUES(category),
            status = VALUES(status),
            published_at = VALUES(published_at),
            updated_at = VALUES(updated_at)
    ");
    
    $updateStmt = $pdo->prepare("
        UPDATE blog_posts 
        SET title = :title,
            content = :content,
            excerpt = :excerpt,
            author = :author,
            category = :category,
            status = :status,
            published_at = :published_at,
            updated_at = :updated_at
        WHERE firestore_id = :firestore_id
    ");
    
    $synced = 0;
    $skipped = 0;
    $errors = 0;
    
    // Process each document
    foreach ($documents as $doc) {
        try {
            // Extract Firestore document ID
            $firestoreId = basename($doc['name']);
            
            // Extract fields from Firestore document
            $fields = [];
            if (isset($doc['fields'])) {
                foreach ($doc['fields'] as $key => $value) {
                    // Handle Firestore value types
                    if (isset($value['stringValue'])) {
                        $fields[$key] = $value['stringValue'];
                    } elseif (isset($value['integerValue'])) {
                        $fields[$key] = (int)$value['integerValue'];
                    } elseif (isset($value['booleanValue'])) {
                        $fields[$key] = (bool)$value['booleanValue'];
                    } elseif (isset($value['timestampValue'])) {
                        $fields[$key] = $value['timestampValue'];
                    }
                }
            }
            
            // Only sync published posts
            $status = $fields['status'] ?? 'draft';
            $isPublic = $fields['isPublic'] ?? false;
            
            if ($status !== 'published' || !$isPublic) {
                $skipped++;
                continue;
            }
            
            // Extract post data
            $title = $fields['title'] ?? 'Untitled';
            $content = $fields['content'] ?? '';
            $excerpt = $fields['excerpt'] ?? substr(strip_tags($content), 0, 200);
            $author = $fields['author'] ?? 'Admin';
            $category = $fields['category'] ?? 'General';
            
            // Handle timestamps
            $publishedAt = isset($fields['publishedAt']) 
                ? date('Y-m-d H:i:s', strtotime($fields['publishedAt'])) 
                : date('Y-m-d H:i:s');
            
            $createdAt = isset($fields['createdAt']) 
                ? date('Y-m-d H:i:s', strtotime($fields['createdAt'])) 
                : date('Y-m-d H:i:s');
            
            $updatedAt = isset($fields['updatedAt']) 
                ? date('Y-m-d H:i:s', strtotime($fields['updatedAt'])) 
                : date('Y-m-d H:i:s');
            
            // Check if post already exists
            $checkStmt = $pdo->prepare("SELECT id FROM blog_posts WHERE firestore_id = :firestore_id");
            $checkStmt->execute(['firestore_id' => $firestoreId]);
            $exists = $checkStmt->fetch();
            
            // Insert or update
            $insertStmt->execute([
                'firestore_id' => $firestoreId,
                'title' => $title,
                'content' => $content,
                'excerpt' => $excerpt,
                'author' => $author,
                'category' => $category,
                'status' => $status,
                'published_at' => $publishedAt,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);
            
            $synced++;
            logMessage("Synced post: $title (ID: $firestoreId)");
            
        } catch (Exception $e) {
            $errors++;
            logMessage("Error syncing document: " . $e->getMessage());
        }
    }
    
    logMessage("✅ Sync completed: $synced posts synced, $skipped skipped, $errors errors");
    
    // Return JSON response if called via HTTP
    if (isset($_SERVER['REQUEST_METHOD'])) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'synced' => $synced,
            'skipped' => $skipped,
            'errors' => $errors,
            'total' => count($documents)
        ]);
    }
    
} catch (Exception $e) {
    $errorMsg = "❌ Sync failed: " . $e->getMessage();
    logMessage($errorMsg);
    
    // Return error response if called via HTTP
    if (isset($_SERVER['REQUEST_METHOD'])) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    
    exit(1);
}

