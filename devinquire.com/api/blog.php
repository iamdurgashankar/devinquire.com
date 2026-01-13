<?php
/**
 * Blog API Endpoints
 * 
 * Handles CRUD operations for blog posts, categories, and tags
 * Public API for frontend blog functionality
 */

require_once 'config/database.php';
require_once 'auth.php';

// Initialize authentication and CORS
$auth = new APIAuth();
$auth->handleCORS();

// Check rate limiting for public API
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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'code' => 500
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extract action and ID from URL
$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;
$slug = $_GET['slug'] ?? null;

switch ($method) {
    case 'GET':
        handleGet($pdo, $action, $id, $slug);
        break;
    case 'POST':
        handlePost($pdo, $action);
        break;
    case 'PUT':
        handlePut($pdo, $action, $id);
        break;
    case 'DELETE':
        handleDelete($pdo, $action, $id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet($pdo, $action, $id, $slug) {
    switch ($action) {
        case 'posts':
            if ($id) {
                getPostById($pdo, $id);
            } elseif ($slug) {
                getPostBySlug($pdo, $slug);
            } else {
                getAllPosts($pdo);
            }
            break;
        case 'categories':
            getCategories($pdo);
            break;
        case 'tags':
            getTags($pdo);
            break;
        case 'featured':
            getFeaturedPosts($pdo);
            break;
        default:
            getAllPosts($pdo);
            break;
    }
}

function handlePost($pdo, $action) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'posts':
            createPost($pdo, $input);
            break;
        case 'categories':
            createCategory($pdo, $input);
            break;
        case 'tags':
            createTag($pdo, $input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePut($pdo, $action, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required for update']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'posts':
            updatePost($pdo, $id, $input);
            break;
        case 'categories':
            updateCategory($pdo, $id, $input);
            break;
        case 'tags':
            updateTag($pdo, $id, $input);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handleDelete($pdo, $action, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required for deletion']);
        return;
    }
    
    switch ($action) {
        case 'posts':
            deletePost($pdo, $id);
            break;
        case 'categories':
            deleteCategory($pdo, $id);
            break;
        case 'tags':
            deleteTag($pdo, $id);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

// Blog Posts Functions
function getAllPosts($pdo) {
    try {
        $category = $_GET['category'] ?? '';
        $status = $_GET['status'] ?? 'published';
        $limit = (int)($_GET['limit'] ?? 10);
        $offset = (int)($_GET['offset'] ?? 0);
        
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
        
        // Process tags for each post
        foreach ($posts as &$post) {
            $post['tags'] = $post['tags'] ? explode(',', $post['tags']) : [];
        }
        
        echo json_encode(['success' => true, 'data' => $posts]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch posts']);
    }
}

function getPostById($pdo, $id) {
    try {
        $sql = "
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
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
            
            // Increment view count
            $updateViews = $pdo->prepare("UPDATE blog_posts SET views = views + 1 WHERE id = :id");
            $updateViews->bindParam(':id', $id, PDO::PARAM_INT);
            $updateViews->execute();
            
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

function getPostBySlug($pdo, $slug) {
    try {
        $sql = "
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE p.slug = :slug AND p.status = 'published'
            GROUP BY p.id
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':slug', $slug);
        $stmt->execute();
        
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($post) {
            $post['tags'] = $post['tags'] ? explode(',', $post['tags']) : [];
            
            // Increment view count
            $updateViews = $pdo->prepare("UPDATE blog_posts SET views = views + 1 WHERE slug = :slug");
            $updateViews->bindParam(':slug', $slug);
            $updateViews->execute();
            
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

function getFeaturedPosts($pdo) {
    try {
        $sql = "
            SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
                   GROUP_CONCAT(t.name) as tags
            FROM blog_posts p
            LEFT JOIN blog_categories c ON p.category_id = c.id
            LEFT JOIN blog_post_tags pt ON p.id = pt.post_id
            LEFT JOIN blog_tags t ON pt.tag_id = t.id
            WHERE p.is_featured = 1 AND p.status = 'published'
            GROUP BY p.id
            ORDER BY p.published_at DESC
            LIMIT 3
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($posts as &$post) {
            $post['tags'] = $post['tags'] ? explode(',', $post['tags']) : [];
        }
        
        echo json_encode(['success' => true, 'data' => $posts]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch featured posts']);
    }
}

function createPost($pdo, $data) {
    try {
        // Validate required fields
        if (empty($data['title']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and content are required']);
            return;
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
        $stmt->bindParam(':read_time', $data['read_time'] ?? 5, PDO::PARAM_INT);
        $stmt->bindParam(':meta_title', $data['meta_title'] ?? null);
        $stmt->bindParam(':meta_description', $data['meta_description'] ?? null);
        
        $published_at = ($data['status'] === 'published') ? date('Y-m-d H:i:s') : null;
        $stmt->bindParam(':published_at', $published_at);
        
        $stmt->execute();
        
        $postId = $pdo->lastInsertId();
        
        // Handle tags
        if (!empty($data['tags']) && is_array($data['tags'])) {
            addTagsToPost($pdo, $postId, $data['tags']);
        }
        
        echo json_encode(['success' => true, 'data' => ['id' => $postId, 'slug' => $slug]]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create post']);
    }
}

function updatePost($pdo, $id, $data) {
    try {
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
        $stmt->bindParam(':read_time', $data['read_time'] ?? 5, PDO::PARAM_INT);
        $stmt->bindParam(':meta_title', $data['meta_title'] ?? null);
        $stmt->bindParam(':meta_description', $data['meta_description'] ?? null);
        
        // Update published_at if status changes to published
        $published_at = ($data['status'] === 'published') ? date('Y-m-d H:i:s') : null;
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

function deletePost($pdo, $id) {
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

// Categories Functions
function getCategories($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM blog_categories ORDER BY name");
        $stmt->execute();
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $categories]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch categories']);
    }
}

function createCategory($pdo, $data) {
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
        
        echo json_encode(['success' => true, 'data' => ['id' => $pdo->lastInsertId(), 'slug' => $slug]]);
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

function updateCategory($pdo, $id, $data) {
    try {
        $sql = "UPDATE blog_categories SET name = :name, description = :description, color = :color WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $data['description'] ?? null);
        $stmt->bindParam(':color', $data['color'] ?? '#3B82F6');
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Category updated successfully']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update category']);
    }
}

function deleteCategory($pdo, $id) {
    try {
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

// Tags Functions
function getTags($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM blog_tags ORDER BY name");
        $stmt->execute();
        $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'data' => $tags]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch tags']);
    }
}

function createTag($pdo, $data) {
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
        
        echo json_encode(['success' => true, 'data' => ['id' => $pdo->lastInsertId(), 'slug' => $slug]]);
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

function updateTag($pdo, $id, $data) {
    try {
        $sql = "UPDATE blog_tags SET name = :name WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $data['name']);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Tag updated successfully']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update tag']);
    }
}

function deleteTag($pdo, $id) {
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