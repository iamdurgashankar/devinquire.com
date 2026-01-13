<?php
/**
 * Blog Admin API Endpoints
 * 
 * Handles blog management operations for dashboard
 * Requires authentication for all operations
 */

require_once 'config/database.php';
require_once 'auth.php';

// Initialize authentication and CORS
$auth = new APIAuth();
$auth->handleCORS();

// Require API key authentication for admin operations
if (!$auth->validateAPIKey()) {
    exit();
}

// Check rate limiting
if (!$auth->checkRateLimit()) {
    exit();
}

header('Content-Type: application/json');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'error' => 'Database service temporarily unavailable',
            'code' => 503
        ]);
        exit();
    }
    $pdo = $db;
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Authentication already handled above

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        handleAdminGet($pdo, $action, $id);
        break;
    case 'POST':
        handleAdminPost($pdo, $action);
        break;
    case 'PUT':
        handleAdminPut($pdo, $action, $id);
        break;
    case 'DELETE':
        handleAdminDelete($pdo, $action, $id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleAdminGet($pdo, $action, $id) {
    switch ($action) {
        case 'posts':
            if ($id) {
                getAdminPostById($pdo, $id);
            } else {
                getAdminPosts($pdo);
            }
            break;
        case 'dashboard-stats':
            getDashboardStats($pdo);
            break;
        case 'categories':
            getAdminCategories($pdo);
            break;
        case 'tags':
            getAdminTags($pdo);
            break;
        default:
            getAdminPosts($pdo);
            break;
    }
}

function handleAdminPost($pdo, $action) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'posts':
            createAdminPost($pdo, $input);
            break;
        case 'categories':
            createAdminCategory($pdo, $input);
            break;
        case 'tags':
            createAdminTag($pdo, $input);
            break;
        case 'bulk-action':
            handleBulkAction($pdo, $input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handleAdminPut($pdo, $action, $id) {
    if (!$id && $action !== 'bulk-update') {
        http_response_code(400);
        echo json_encode(['error' => 'ID required for update']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'posts':
            updateAdminPost($pdo, $id, $input);
            break;
        case 'categories':
            updateAdminCategory($pdo, $id, $input);
            break;
        case 'tags':
            updateAdminTag($pdo, $id, $input);
            break;
        case 'bulk-update':
            handleBulkAction($pdo, $input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handleAdminDelete($pdo, $action, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required for deletion']);
        return;
    }
    
    switch ($action) {
        case 'posts':
            deleteAdminPost($pdo, $id);
            break;
        case 'categories':
            deleteAdminCategory($pdo, $id);
            break;
        case 'tags':
            deleteAdminTag($pdo, $id);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

// Admin-specific functions with enhanced features
function getAdminPosts($pdo) {
    try {
        $status = $_GET['status'] ?? 'all';
        $category = $_GET['category'] ?? '';
        $search = $_GET['search'] ?? '';
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = (int)($_GET['offset'] ?? 0);
        $orderBy = $_GET['order_by'] ?? 'created_at';
        $orderDir = $_GET['order_dir'] ?? 'DESC';
        
        $sql = "
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags,
                   COUNT(*) OVER() as total_count
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($status !== 'all') {
            $sql .= " AND p.status = :status";
            $params['status'] = $status;
        }
        
        if ($category) {
            $sql .= " AND c.slug = :category";
            $params['category'] = $category;
        }
        
        if ($search) {
            $sql .= " AND (p.title LIKE :search OR p.content LIKE :search OR p.excerpt LIKE :search)";
            $params['search'] = "%$search%";
        }
        
        $allowedOrderBy = ['title', 'created_at', 'updated_at', 'published_at', 'views', 'status'];
        $orderBy = in_array($orderBy, $allowedOrderBy) ? $orderBy : 'created_at';
        $orderDir = strtoupper($orderDir) === 'ASC' ? 'ASC' : 'DESC';
        
        $sql .= " GROUP BY p.id ORDER BY p.$orderBy $orderDir LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $totalCount = $posts[0]['total_count'] ?? 0;
        
        // Process tags for each post
        foreach ($posts as &$post) {
            $post['tags'] = $post['tags'] ? explode(',', $post['tags']) : [];
            unset($post['total_count']);
        }
        
        echo json_encode([
            'success' => true, 
            'data' => $posts,
            'pagination' => [
                'total' => (int)$totalCount,
                'limit' => $limit,
                'offset' => $offset,
                'pages' => ceil($totalCount / $limit)
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch posts']);
    }
}

function getAdminPostById($pdo, $id) {
    try {
        $sql = "
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(DISTINCT t.name) as tags,
                   GROUP_CONCAT(DISTINCT t.id) as tag_ids
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE p.id = :id
            GROUP BY p.id
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($post) {
            $post['tags'] = $post['tags'] ? explode(',', $post['tags']) : [];
            $post['tag_ids'] = $post['tag_ids'] ? array_map('intval', explode(',', $post['tag_ids'])) : [];
            
            echo json_encode(['success' => true, 'data' => $post]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Post not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch post']);
    }
}

function getDashboardStats($pdo) {
    try {
        // Get post counts by status
        $postStats = $pdo->query("
            SELECT status, COUNT(*) as count 
            FROM blog_posts 
            GROUP BY status
        ")->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Get total views
        $totalViews = $pdo->query("SELECT SUM(views) as total FROM blog_posts")->fetchColumn();
        
        // Get category count
        $categoryCount = $pdo->query("SELECT COUNT(*) FROM blog_categories")->fetchColumn();
        
        // Get tag count
        $tagCount = $pdo->query("SELECT COUNT(*) FROM blog_tags")->fetchColumn();
        
        // Get recent posts
        $recentPosts = $pdo->query("
            SELECT id, title, status, created_at, views 
            FROM blog_posts 
            ORDER BY created_at DESC 
            LIMIT 5
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        // Get popular posts
        $popularPosts = $pdo->query("
            SELECT id, title, views, published_at 
            FROM blog_posts 
            WHERE status = 'published' 
            ORDER BY views DESC 
            LIMIT 5
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'post_stats' => $postStats,
                'total_views' => (int)$totalViews,
                'category_count' => (int)$categoryCount,
                'tag_count' => (int)$tagCount,
                'recent_posts' => $recentPosts,
                'popular_posts' => $popularPosts
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch dashboard stats']);
    }
}

function createAdminPost($pdo, $data) {
    try {
        // Enhanced validation for admin interface
        $requiredFields = ['title', 'content'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => ucfirst($field) . ' is required']);
                return;
            }
        }
        
        // Generate slug from title if not provided
        $slug = $data['slug'] ?? generateSlug($data['title']);
        
        // Check if slug already exists
        $checkSlug = $pdo->prepare("SELECT id FROM blog_posts WHERE slug = :slug");
        $checkSlug->bindParam(':slug', $slug);
        $checkSlug->execute();
        
        if ($checkSlug->fetch()) {
            $slug .= '-' . time();
        }
        
        // Auto-publish if status is published
        $published_at = ($data['status'] === 'published') ? date('Y-m-d H:i:s') : null;
        
        $sql = "
            INSERT INTO blog_posts (title, slug, excerpt, content, featured_image, category_id, 
                                  author_name, author_email, author_avatar, status, is_featured, 
                                  read_time, meta_title, meta_description, published_at)
            VALUES (:title, :slug, :excerpt, :content, :featured_image, :category_id, 
                   :author_name, :author_email, :author_avatar, :status, :is_featured, 
                   :read_time, :meta_title, :meta_description, :published_at)
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':slug', $slug);
        $stmt->bindParam(':excerpt', $data['excerpt'] ?? null);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':featured_image', $data['featured_image'] ?? null);
        $stmt->bindParam(':category_id', $data['category_id'] ?? null, PDO::PARAM_INT);
        $stmt->bindParam(':author_name', $data['author_name'] ?? 'Admin User');
        $stmt->bindParam(':author_email', $data['author_email'] ?? null);
        $stmt->bindParam(':author_avatar', $data['author_avatar'] ?? null);
        $stmt->bindParam(':status', $data['status'] ?? 'draft');
        $stmt->bindParam(':is_featured', $data['is_featured'] ?? false, PDO::PARAM_BOOL);
        $stmt->bindParam(':read_time', $data['read_time'] ?? calculateReadTime($data['content']), PDO::PARAM_INT);
        $stmt->bindParam(':meta_title', $data['meta_title'] ?? $data['title']);
        $stmt->bindParam(':meta_description', $data['meta_description'] ?? null);
        $stmt->bindParam(':published_at', $published_at);
        
        $stmt->execute();
        
        $postId = $pdo->lastInsertId();
        
        // Handle tags
        if (!empty($data['tags']) && is_array($data['tags'])) {
            addTagsToPost($pdo, $postId, $data['tags']);
        }
        
        echo json_encode([
            'success' => true, 
            'data' => [
                'id' => $postId, 
                'slug' => $slug,
                'message' => 'Post created successfully'
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create post: ' . $e->getMessage()]);
    }
}

function updateAdminPost($pdo, $id, $data) {
    try {
        // Check if post exists
        $checkPost = $pdo->prepare("SELECT id FROM blog_posts WHERE id = :id");
        $checkPost->bindParam(':id', $id, PDO::PARAM_INT);
        $checkPost->execute();
        
        if (!$checkPost->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Post not found']);
            return;
        }
        
        // Auto-publish if status changes to published
        $published_at = ($data['status'] === 'published') ? date('Y-m-d H:i:s') : null;
        
        $sql = "
            UPDATE blog_posts SET 
                title = :title, excerpt = :excerpt, content = :content, 
                featured_image = :featured_image, category_id = :category_id,
                author_name = :author_name, author_email = :author_email, 
                author_avatar = :author_avatar, status = :status, 
                is_featured = :is_featured, read_time = :read_time,
                meta_title = :meta_title, meta_description = :meta_description,
                published_at = :published_at, updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':title', $data['title']);
        $stmt->bindParam(':excerpt', $data['excerpt'] ?? null);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':featured_image', $data['featured_image'] ?? null);
        $stmt->bindParam(':category_id', $data['category_id'] ?? null, PDO::PARAM_INT);
        $stmt->bindParam(':author_name', $data['author_name'] ?? 'Admin User');
        $stmt->bindParam(':author_email', $data['author_email'] ?? null);
        $stmt->bindParam(':author_avatar', $data['author_avatar'] ?? null);
        $stmt->bindParam(':status', $data['status'] ?? 'draft');
        $stmt->bindParam(':is_featured', $data['is_featured'] ?? false, PDO::PARAM_BOOL);
        $stmt->bindParam(':read_time', $data['read_time'] ?? calculateReadTime($data['content']), PDO::PARAM_INT);
        $stmt->bindParam(':meta_title', $data['meta_title'] ?? $data['title']);
        $stmt->bindParam(':meta_description', $data['meta_description'] ?? null);
        $stmt->bindParam(':published_at', $published_at);
        
        $stmt->execute();
        
        // Update tags
        if (isset($data['tags']) && is_array($data['tags'])) {
            // Remove existing tags
            $deleteTags = $pdo->prepare("DELETE FROM blog_post_tags WHERE post_id = :post_id");
            $deleteTags->bindParam(':post_id', $id, PDO::PARAM_INT);
            $deleteTags->execute();
            
            // Add new tags
            addTagsToPost($pdo, $id, $data['tags']);
        }
        
        echo json_encode(['success' => true, 'message' => 'Post updated successfully']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update post']);
    }
}

function deleteAdminPost($pdo, $id) {
    try {
        $stmt = $pdo->prepare("DELETE FROM blog_posts WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Post deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Post not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete post']);
    }
}

function handleBulkAction($pdo, $data) {
    try {
        $action = $data['action'] ?? '';
        $postIds = $data['post_ids'] ?? [];
        
        if (empty($postIds) || !is_array($postIds)) {
            http_response_code(400);
            echo json_encode(['error' => 'Post IDs are required']);
            return;
        }
        
        $placeholders = str_repeat('?,', count($postIds) - 1) . '?';
        
        switch ($action) {
            case 'publish':
                $sql = "UPDATE blog_posts SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id IN ($placeholders)";
                break;
            case 'draft':
                $sql = "UPDATE blog_posts SET status = 'draft', published_at = NULL WHERE id IN ($placeholders)";
                break;
            case 'archive':
                $sql = "UPDATE blog_posts SET status = 'archived' WHERE id IN ($placeholders)";
                break;
            case 'delete':
                $sql = "DELETE FROM blog_posts WHERE id IN ($placeholders)";
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid bulk action']);
                return;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($postIds);
        
        echo json_encode([
            'success' => true, 
            'message' => ucfirst($action) . ' action completed for ' . $stmt->rowCount() . ' posts'
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to perform bulk action']);
    }
}

// Admin category functions
function getAdminCategories($pdo) {
    try {
        $sql = "
            SELECT c.*, COUNT(p.id) as post_count 
            FROM blog_categories c 
            LEFT JOIN blog_posts p ON c.id = p.category_id 
            GROUP BY c.id 
            ORDER BY c.name
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $categories]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch categories']);
    }
}

function createAdminCategory($pdo, $data) {
    try {
        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Category name is required']);
            return;
        }
        
        $slug = $data['slug'] ?? generateSlug($data['name']);
        
        $sql = "INSERT INTO blog_categories (name, slug, description, color) VALUES (:name, :slug, :description, :color)";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':slug', $slug);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':color', $data['color'] ?? '#3B82F6');
        $stmt->execute();
        
        echo json_encode([
            'success' => true, 
            'data' => [
                'id' => $pdo->lastInsertId(), 
                'slug' => $slug,
                'message' => 'Category created successfully'
            ]
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Category name or slug already exists']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create category']);
        }
    }
}

function updateAdminCategory($pdo, $id, $data) {
    try {
        $sql = "UPDATE blog_categories SET name = :name, description = :description, color = :color WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':color', $data['color'] ?? '#3B82F6');
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Category updated successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update category']);
    }
}

function deleteAdminCategory($pdo, $id) {
    try {
        // Check if category has posts
        $checkPosts = $pdo->prepare("SELECT COUNT(*) FROM blog_posts WHERE category_id = :id");
        $checkPosts->bindParam(':id', $id, PDO::PARAM_INT);
        $checkPosts->execute();
        
        $postCount = $checkPosts->fetchColumn();
        
        if ($postCount > 0) {
            http_response_code(409);
            echo json_encode(['error' => "Cannot delete category with $postCount posts. Move posts to another category first."]);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM blog_categories WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Category deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete category']);
    }
}

// Admin tag functions
function getAdminTags($pdo) {
    try {
        $sql = "
            SELECT t.*, COUNT(pt.post_id) as post_count 
            FROM blog_tags t 
            LEFT JOIN blog_post_tags pt ON t.id = pt.tag_id 
            GROUP BY t.id 
            ORDER BY t.name
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $tags]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch tags']);
    }
}

function createAdminTag($pdo, $data) {
    try {
        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Tag name is required']);
            return;
        }
        
        $slug = $data['slug'] ?? generateSlug($data['name']);
        
        $sql = "INSERT INTO blog_tags (name, slug) VALUES (:name, :slug)";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':slug', $slug);
        $stmt->execute();
        
        echo json_encode([
            'success' => true, 
            'data' => [
                'id' => $pdo->lastInsertId(), 
                'slug' => $slug,
                'message' => 'Tag created successfully'
            ]
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Tag name or slug already exists']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create tag']);
        }
    }
}

function updateAdminTag($pdo, $id, $data) {
    try {
        $sql = "UPDATE blog_tags SET name = :name WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $data['name']);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Tag updated successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Tag not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update tag']);
    }
}

function deleteAdminTag($pdo, $id) {
    try {
        $stmt = $pdo->prepare("DELETE FROM blog_tags WHERE id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Tag deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Tag not found']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete tag']);
    }
}

// Helper Functions
function generateSlug($text) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text)));
    return trim($slug, '-');
}

function calculateReadTime($content) {
    $wordCount = str_word_count(strip_tags($content));
    $readTime = ceil($wordCount / 200); // Average reading speed: 200 words per minute
    return max(1, $readTime); // Minimum 1 minute
}

function addTagsToPost($pdo, $postId, $tags) {
    foreach ($tags as $tagName) {
        // Find or create tag
        $tagSlug = generateSlug($tagName);
        
        $findTag = $pdo->prepare("SELECT id FROM blog_tags WHERE slug = :slug");
        $findTag->bindParam(':slug', $tagSlug);
        $findTag->execute();
        
        $tag = $findTag->fetch(PDO::FETCH_ASSOC);
        
        if (!$tag) {
            // Create new tag
            $createTag = $pdo->prepare("INSERT INTO blog_tags (name, slug) VALUES (:name, :slug)");
            $createTag->bindParam(':name', $tagName);
            $createTag->bindParam(':slug', $tagSlug);
            $createTag->execute();
            $tagId = $pdo->lastInsertId();
        } else {
            $tagId = $tag['id'];
        }
        
        // Link tag to post
        $linkTag = $pdo->prepare("INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (:post_id, :tag_id)");
        $linkTag->bindParam(':post_id', $postId, PDO::PARAM_INT);
        $linkTag->bindParam(':tag_id', $tagId, PDO::PARAM_INT);
        $linkTag->execute();
    }
}
?>