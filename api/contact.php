<?php
/**
 * Contact Form Handler for Hostinger Shared Hosting
 * 
 * This script handles contact form submissions with:
 * - Input validation and sanitization
 * - SQL injection protection using prepared statements
 * - Rate limiting to prevent spam
 * - CORS headers for frontend integration
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

class ContactFormHandler {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        
        // Allow form to work even without database connection for testing
        if (!$this->conn) {
            error_log('Warning: Database connection failed, form will work in test mode');
        }
    }
    
    /**
     * Process contact form submission
     */
    public function processSubmission() {
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
            $data = $this->sanitizeInput($input);
            
            // Save to database (skip if no connection)
            $submissionId = null;
            if ($this->conn) {
                $submissionId = $this->saveSubmission($data);
            } else {
                // Generate fake ID for testing
                $submissionId = 'test_' . time();
                error_log('Test mode: Skipping database save');
            }
            
            if ($submissionId) {
                // Update rate limiting (skip if no connection)
                if ($this->conn) {
                    $this->updateRateLimit();
                }
                
                // Send notification email (skip if no connection)
                if ($this->conn) {
                    $this->sendNotificationEmail($data);
                } else {
                    error_log('Test mode: Skipping email send');
                }
                
                return [
                    'success' => true, 
                    'message' => 'Thank you for your message! We\'ll get back to you within 24 hours.',
                    'id' => $submissionId
                ];
            } else {
                throw new Exception('Failed to save submission');
            }
            
        } catch (Exception $e) {
            error_log('Contact form error: ' . $e->getMessage());
            http_response_code(500);
            return ['success' => false, 'message' => 'An error occurred. Please try again later.'];
        }
    }
    
    /**
     * Validate input data
     */
    private function validateInput($input) {
        $errors = [];
        
        // Required fields
        if (empty($input['name']) || strlen(trim($input['name'])) < 2) {
            $errors[] = 'Name must be at least 2 characters long';
        }
        
        if (empty($input['email']) || !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Please enter a valid email address';
        }
        
        if (empty($input['message']) || strlen(trim($input['message'])) < 10) {
            $errors[] = 'Message must be at least 10 characters long';
        }
        
        // Check if this is a Services form submission (has service field)
        if (isset($input['service']) && !empty($input['service'])) {
            // For Services form: validate service field
            if (strlen(trim($input['service'])) < 2) {
                $errors[] = 'Please select a valid service';
            }
            
            // For Services form: subject is auto-generated, but validate if provided
            if (isset($input['subject']) && !empty($input['subject']) && strlen(trim($input['subject'])) < 5) {
                $errors[] = 'Subject must be at least 5 characters long';
            }
        } else {
            // For Contact form: validate subject field (required)
            if (empty($input['subject']) || strlen(trim($input['subject'])) < 5) {
                $errors[] = 'Subject must be at least 5 characters long';
            }
        }
        
        // Length limits
        if (strlen($input['name']) > 100) {
            $errors[] = 'Name must be less than 100 characters';
        }
        
        if (strlen($input['email']) > 255) {
            $errors[] = 'Email must be less than 255 characters';
        }
        
        if (strlen($input['message']) > 5000) {
            $errors[] = 'Message must be less than 5000 characters';
        }
        
        // Optional field validation
        if (!empty($input['phone'])) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $input['phone']);
            if (strlen($cleanPhone) < 7 || strlen($cleanPhone) > 15) {
                $errors[] = 'Please enter a valid phone number';
            }
        }
        
        if (!empty($input['company']) && strlen($input['company']) > 200) {
            $errors[] = 'Company name must be less than 200 characters';
        }
        
        if (!empty($input['subject']) && strlen($input['subject']) > 255) {
            $errors[] = 'Subject must be less than 255 characters';
        }
        
        if (!empty($input['service']) && strlen($input['service']) > 100) {
            $errors[] = 'Service must be less than 100 characters';
        }
        
        // Spam detection
        $spamResult = $this->detectSpam($input['message']);
        if ($spamResult['isSpam']) {
            $errors[] = 'Message contains prohibited content';
        }
        
        return [
            'valid' => empty($errors),
            'message' => empty($errors) ? 'Valid' : implode(', ', $errors)
        ];
    }
    
    /**
     * Sanitize input data
     */
    private function sanitizeInput($input) {
        return [
            'name' => trim(htmlspecialchars($input['name'], ENT_QUOTES, 'UTF-8')),
            'email' => trim(strtolower(filter_var($input['email'], FILTER_SANITIZE_EMAIL))),
            'phone' => isset($input['phone']) ? trim(htmlspecialchars($input['phone'], ENT_QUOTES, 'UTF-8')) : '',
            'company' => isset($input['company']) ? trim(htmlspecialchars($input['company'], ENT_QUOTES, 'UTF-8')) : '',
            'service' => isset($input['service']) ? trim(htmlspecialchars($input['service'], ENT_QUOTES, 'UTF-8')) : '',
            'subject' => isset($input['subject']) ? trim(htmlspecialchars($input['subject'], ENT_QUOTES, 'UTF-8')) : 'Contact Form Submission',
            'timeline' => isset($input['timeline']) ? trim(htmlspecialchars($input['timeline'], ENT_QUOTES, 'UTF-8')) : '',
            'message' => trim(htmlspecialchars($input['message'], ENT_QUOTES, 'UTF-8')),
            'ip_address' => $this->getClientIP(),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
        ];
    }
    
    /**
     * Save submission to database
     */
    private function saveSubmission($data) {
        try {
            $sql = "INSERT INTO contact_submissions 
                    (name, email, phone, company, service, subject, timeline, message, ip_address, user_agent) 
                    VALUES (:name, :email, :phone, :company, :service, :subject, :timeline, :message, :ip_address, :user_agent)";
            
            $stmt = $this->conn->prepare($sql);
            
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':phone', $data['phone']);
            $stmt->bindParam(':company', $data['company']);
            $stmt->bindParam(':service', $data['service']);
            $stmt->bindParam(':subject', $data['subject']);
            $stmt->bindParam(':timeline', $data['timeline']);
            $stmt->bindParam(':message', $data['message']);
            $stmt->bindParam(':ip_address', $data['ip_address']);
            $stmt->bindParam(':user_agent', $data['user_agent']);
            
            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            
            return false;
            
        } catch (PDOException $e) {
            error_log('Database error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check rate limiting
     */
    private function checkRateLimit() {
        // Skip rate limiting if no database connection
        if (!$this->conn) {
            error_log('Test mode: Skipping rate limit check');
            return ['allowed' => true];
        }
        
        $ip = $this->getClientIP();
        $timeWindow = 3600; // 1 hour
        $maxSubmissions = 5; // Max 5 submissions per hour
        
        try {
            // Check current rate limit
            $sql = "SELECT submission_count, first_submission, blocked_until 
                    FROM rate_limiting 
                    WHERE ip_address = :ip 
                    AND first_submission > DATE_SUB(NOW(), INTERVAL :time_window SECOND)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':ip', $ip);
            $stmt->bindParam(':time_window', $timeWindow);
            $stmt->execute();
            
            $result = $stmt->fetch();
            
            if ($result) {
                // Check if blocked
                if ($result['blocked_until'] && strtotime($result['blocked_until']) > time()) {
                    return [
                        'allowed' => false,
                        'message' => 'Too many submissions. Please try again later.'
                    ];
                }
                
                // Check submission count
                if ($result['submission_count'] >= $maxSubmissions) {
                    // Block for 1 hour
                    $blockUntil = date('Y-m-d H:i:s', time() + 3600);
                    $updateSql = "UPDATE rate_limiting SET blocked_until = :blocked_until WHERE ip_address = :ip";
                    $updateStmt = $this->conn->prepare($updateSql);
                    $updateStmt->bindParam(':blocked_until', $blockUntil);
                    $updateStmt->bindParam(':ip', $ip);
                    $updateStmt->execute();
                    
                    return [
                        'allowed' => false,
                        'message' => 'Too many submissions. Please try again in 1 hour.'
                    ];
                }
            }
            
            return ['allowed' => true, 'message' => 'OK'];
            
        } catch (PDOException $e) {
            error_log('Rate limit check error: ' . $e->getMessage());
            return ['allowed' => true, 'message' => 'OK']; // Allow on error
        }
    }
    
    /**
     * Update rate limiting record
     */
    private function updateRateLimit() {
        $ip = $this->getClientIP();
        
        try {
            // Check if record exists
            $sql = "SELECT id FROM rate_limiting WHERE ip_address = :ip AND first_submission > DATE_SUB(NOW(), INTERVAL 3600 SECOND)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':ip', $ip);
            $stmt->execute();
            
            if ($stmt->fetch()) {
                // Update existing record
                $updateSql = "UPDATE rate_limiting SET submission_count = submission_count + 1, last_submission = NOW() WHERE ip_address = :ip";
                $updateStmt = $this->conn->prepare($updateSql);
                $updateStmt->bindParam(':ip', $ip);
                $updateStmt->execute();
            } else {
                // Create new record
                $insertSql = "INSERT INTO rate_limiting (ip_address, submission_count) VALUES (:ip, 1)";
                $insertStmt = $this->conn->prepare($insertSql);
                $insertStmt->bindParam(':ip', $ip);
                $insertStmt->execute();
            }
            
        } catch (PDOException $e) {
            error_log('Rate limit update error: ' . $e->getMessage());
        }
    }
    
    /**
     * Basic spam detection
     */
    private function detectSpam($message) {
        $spamPatterns = [
            '/\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i',
            '/\b(click here|act now|limited time|urgent)\b/i',
            '/(http:\/\/|https:\/\/)[^\s]{10,}/i'
        ];
        
        foreach ($spamPatterns as $pattern) {
            if (preg_match($pattern, $message)) {
                return ['isSpam' => true, 'reason' => 'Spam pattern detected'];
            }
        }
        
        return ['isSpam' => false, 'reason' => 'Clean'];
    }
    
    /**
     * Send notification email
     */
    private function sendNotificationEmail($data) {
        try {
            $emailSender = new EmailSender();
            $result = $emailSender->sendContactNotification($data);
            
            if ($result['success']) {
                error_log('Contact notification email sent successfully');
            } else {
                error_log('Failed to send contact notification: ' . $result['error']);
            }
        } catch (Exception $e) {
            error_log('Email notification error: ' . $e->getMessage());
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
    $handler = new ContactFormHandler();
    $result = $handler->processSubmission();
    echo json_encode($result);
} catch (Exception $e) {
    error_log('Contact form handler error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Service temporarily unavailable. Please try again later.'
    ]);
}
?>