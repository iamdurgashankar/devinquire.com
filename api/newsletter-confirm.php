<?php
/**
 * Newsletter Subscription Confirmation Handler
 * 
 * This script handles newsletter subscription confirmations via email tokens
 */

header('Content-Type: text/html; charset=UTF-8');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo '<h1>Method Not Allowed</h1>';
    exit();
}

require_once 'config/database.php';

class NewsletterConfirmationHandler {
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
     * Process confirmation token
     */
    public function processConfirmation($token) {
        try {
            if (empty($token)) {
                return [
                    'success' => false,
                    'message' => 'Invalid confirmation link. Token is missing.'
                ];
            }
            
            // Find subscription by token
            $subscription = $this->findSubscriptionByToken($token);
            
            if (!$subscription) {
                return [
                    'success' => false,
                    'message' => 'Invalid or expired confirmation link.'
                ];
            }
            
            // Check if already confirmed
            if ($subscription['status'] === 'confirmed') {
                return [
                    'success' => true,
                    'message' => 'Your subscription is already confirmed. Thank you!',
                    'email' => $subscription['email']
                ];
            }
            
            // Confirm subscription
            $confirmResult = $this->confirmSubscription($subscription['id']);
            
            if ($confirmResult) {
                return [
                    'success' => true,
                    'message' => 'Thank you! Your newsletter subscription has been confirmed.',
                    'email' => $subscription['email']
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to confirm subscription. Please try again or contact support.'
                ];
            }
            
        } catch (Exception $e) {
            error_log('Newsletter confirmation error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'An error occurred while confirming your subscription. Please try again later.'
            ];
        }
    }
    
    /**
     * Find subscription by confirmation token
     */
    private function findSubscriptionByToken($token) {
        try {
            $sql = "SELECT id, email, status, subscribed_at FROM newsletter_subscriptions 
                    WHERE confirmation_token = :token 
                    AND subscribed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
            
            return $stmt->fetch();
            
        } catch (PDOException $e) {
            error_log('Find subscription by token error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Confirm subscription
     */
    private function confirmSubscription($subscriptionId) {
        try {
            $sql = "UPDATE newsletter_subscriptions 
                    SET status = 'confirmed', confirmed_at = NOW() 
                    WHERE id = :id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $subscriptionId);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log('Confirm subscription error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Generate HTML response
     */
    public function generateResponse($result) {
        $title = $result['success'] ? 'Subscription Confirmed' : 'Confirmation Failed';
        $statusClass = $result['success'] ? 'success' : 'error';
        $email = isset($result['email']) ? htmlspecialchars($result['email']) : '';
        
        $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . $title . ' - DevInquire</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        
        .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
        }
        
        .icon.success {
            background: #10b981;
        }
        
        .icon.error {
            background: #ef4444;
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 16px;
            color: #1f2937;
        }
        
        .message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .email {
            background: #f3f4f6;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
            margin-bottom: 30px;
            word-break: break-all;
        }
        
        .actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }
        
        .btn-primary {
            background: #0077b6;
            color: white;
        }
        
        .btn-primary:hover {
            background: #005f8a;
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }
        
        .btn-secondary:hover {
            background: #e5e7eb;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .actions {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon ' . $statusClass . '">
            ' . ($result['success'] ? '✓' : '✗') . '
        </div>
        
        <h1>' . $title . '</h1>
        
        <div class="message">
            ' . htmlspecialchars($result['message']) . '
        </div>';
        
        if ($email) {
            $html .= '
        <div class="email">
            ' . $email . '
        </div>';
        }
        
        $html .= '
        <div class="actions">
            <a href="https://devinquire.com" class="btn btn-primary">Visit DevInquire</a>
            <a href="https://devinquire.com/blog" class="btn btn-secondary">Read Our Blog</a>
        </div>
        
        <div class="footer">
            <p>&copy; 2024 DevInquire. All rights reserved.</p>
        </div>
    </div>
</body>
</html>';
        
        return $html;
    }
}

// Process the request
try {
    $token = $_GET['token'] ?? '';
    $handler = new NewsletterConfirmationHandler();
    $result = $handler->processConfirmation($token);
    echo $handler->generateResponse($result);
    
} catch (Exception $e) {
    error_log('Newsletter confirmation handler error: ' . $e->getMessage());
    
    $errorResult = [
        'success' => false,
        'message' => 'A technical error occurred. Please try again later or contact our support team.'
    ];
    
    $handler = new NewsletterConfirmationHandler();
    echo $handler->generateResponse($errorResult);
}
?>