<?php
/**
 * Newsletter Subscription Handler for Hostinger Shared Hosting
 * 
 * This script handles newsletter subscriptions with:
 * - Email validation and sanitization
 * - Duplicate prevention
 * - Confirmation token generation
 * - Rate limiting
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once 'config/database.php';
require_once 'utils/EmailSender.php';

class NewsletterHandler {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        
        if (!$this->conn) {
            throw new Exception('Database connection failed');
        }
    }
    
    /**
     * Process newsletter subscription
     */
    public function processSubscription() {
        try {
            // Get and decode JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Invalid JSON data');
            }
            
            // Validate input
            $validationResult = $this->validateInput($input);
            if (!$validationResult['valid']) {
                http_response_code(400);
                return ['success' => false, 'message' => $validationResult['message']];
            }
            
            // Check rate limiting
            $rateLimitResult = $this->checkRateLimit();
            if (!$rateLimitResult['allowed']) {
                http_response_code(429);
                return ['success' => false, 'message' => $rateLimitResult['message']];
            }
            
            // Sanitize input data
            $email = trim(strtolower(filter_var($input['email'], FILTER_SANITIZE_EMAIL)));
            $categories = isset($input['categories']) ? $input['categories'] : ['general'];
            
            // Check if already subscribed
            $existingSubscription = $this->checkExistingSubscription($email);
            if ($existingSubscription) {
                if ($existingSubscription['status'] === 'confirmed') {
                    return [
                        'success' => true,
                        'message' => 'You are already subscribed to our newsletter.'
                    ];
                } else if ($existingSubscription['status'] === 'pending') {
                    return [
                        'success' => true,
                        'message' => 'Please check your email to confirm your subscription.'
                    ];
                }
            }
            
            // Generate tokens
            $confirmationToken = $this->generateToken();
            $unsubscribeToken = $this->generateToken();
            
            // Save subscription
            $subscriptionId = $this->saveSubscription($email, $categories, $confirmationToken, $unsubscribeToken);
            
            if ($subscriptionId) {
                // Send confirmation email
                $this->sendConfirmationEmail($email, $confirmationToken);
                
                return [
                    'success' => true,
                    'message' => 'Thank you for subscribing! Please check your email to confirm your subscription.',
                    'id' => $subscriptionId
                ];
            } else {
                throw new Exception('Failed to save subscription');
            }
            
        } catch (Exception $e) {
            error_log('Newsletter subscription error: ' . $e->getMessage());
            http_response_code(500);
            return ['success' => false, 'message' => 'An error occurred. Please try again later.'];
        }
    }
    
    /**
     * Validate input data
     */
    private function validateInput($input) {
        $errors = [];
        
        // Email validation
        if (empty($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Please enter a valid email address';
        }
        
        if (strlen($input['email']) > 255) {
            $errors[] = 'Email must be less than 255 characters';
        }
        
        // Categories validation
        if (isset($input['categories'])) {
            if (!is_array($input['categories'])) {
                $errors[] = 'Categories must be an array';
            } else {
                $validCategories = ['general', 'tech', 'business', 'updates'];
                foreach ($input['categories'] as $category) {
                    if (!in_array($category, $validCategories)) {
                        $errors[] = 'Invalid category: ' . $category;
                    }
                }
            }
        }
        
        return [
            'valid' => empty($errors),
            'message' => empty($errors) ? 'Valid' : implode(', ', $errors)
        ];
    }
    
    /**
     * Check if email is already subscribed
     */
    private function checkExistingSubscription($email) {
        try {
            $sql = "SELECT status, confirmed_at FROM newsletter_subscriptions WHERE email = :email";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            
            return $stmt->fetch();
            
        } catch (PDOException $e) {
            error_log('Check subscription error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Save subscription to database
     */
    private function saveSubscription($email, $categories, $confirmationToken, $unsubscribeToken) {
        try {
            $categoriesJson = json_encode($categories);
            $ip = $this->getClientIP();
            
            // Check if subscription exists (for reactivation)
            $existingSql = "SELECT id FROM newsletter_subscriptions WHERE email = :email";
            $existingStmt = $this->conn->prepare($existingSql);
            $existingStmt->bindParam(':email', $email);
            $existingStmt->execute();
            $existing = $existingStmt->fetch();
            
            if ($existing) {
                // Update existing subscription
                $sql = "UPDATE newsletter_subscriptions 
                        SET categories = :categories, status = 'pending', 
                            confirmation_token = :confirmation_token, 
                            unsubscribe_token = :unsubscribe_token,
                            ip_address = :ip_address,
                            subscribed_at = NOW(),
                            confirmed_at = NULL,
                            unsubscribed_at = NULL
                        WHERE email = :email";
                
                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':categories', $categoriesJson);
                $stmt->bindParam(':confirmation_token', $confirmationToken);
                $stmt->bindParam(':unsubscribe_token', $unsubscribeToken);
                $stmt->bindParam(':ip_address', $ip);
                $stmt->bindParam(':email', $email);
                
                if ($stmt->execute()) {
                    return $existing['id'];
                }
            } else {
                // Create new subscription
                $sql = "INSERT INTO newsletter_subscriptions 
                        (email, categories, confirmation_token, unsubscribe_token, ip_address) 
                        VALUES (:email, :categories, :confirmation_token, :unsubscribe_token, :ip_address)";
                
                $stmt = $this->conn->prepare($sql);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':categories', $categoriesJson);
                $stmt->bindParam(':confirmation_token', $confirmationToken);
                $stmt->bindParam(':unsubscribe_token', $unsubscribeToken);
                $stmt->bindParam(':ip_address', $ip);
                
                if ($stmt->execute()) {
                    return $this->conn->lastInsertId();
                }
            }
            
            return false;
            
        } catch (PDOException $e) {
            error_log('Save subscription error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check rate limiting
     */
    private function checkRateLimit() {
        $ip = $this->getClientIP();
        $timeWindow = 3600; // 1 hour
        $maxSubscriptions = 3; // Max 3 subscriptions per hour
        
        try {
            // Check current rate limit for newsletter subscriptions
            $sql = "SELECT COUNT(*) as count FROM newsletter_subscriptions 
                    WHERE ip_address = :ip 
                    AND subscribed_at > DATE_SUB(NOW(), INTERVAL :time_window SECOND)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':ip', $ip);
            $stmt->bindParam(':time_window', $timeWindow);
            $stmt->execute();
            
            $result = $stmt->fetch();
            
            if ($result && $result['count'] >= $maxSubscriptions) {
                return [
                    'allowed' => false,
                    'message' => 'Too many subscription attempts. Please try again in 1 hour.'
                ];
            }
            
            return ['allowed' => true, 'message' => 'OK'];
            
        } catch (PDOException $e) {
            error_log('Newsletter rate limit check error: ' . $e->getMessage());
            return ['allowed' => true, 'message' => 'OK']; // Allow on error
        }
    }
    
    /**
     * Generate secure token
     */
    private function generateToken() {
        return bin2hex(random_bytes(32));
    }
    
    /**
     * Send confirmation email
     */
    private function sendConfirmationEmail($email, $confirmationToken) {
        try {
            $emailSender = new EmailSender();
            $result = $emailSender->sendNewsletterConfirmation($email, $confirmationToken);
            
            if ($result['success']) {
                error_log('Newsletter confirmation email sent successfully to: ' . $email);
            } else {
                error_log('Failed to send newsletter confirmation: ' . $result['error']);
            }
        } catch (Exception $e) {
            error_log('Newsletter confirmation email error: ' . $e->getMessage());
        }
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}

// Process the request
try {
    $handler = new NewsletterHandler();
    $result = $handler->processSubscription();
    echo json_encode($result);
} catch (Exception $e) {
    error_log('Newsletter handler error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Service temporarily unavailable. Please try again later.'
    ]);
}
?>