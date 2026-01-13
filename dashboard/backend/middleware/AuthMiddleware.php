<?php
/**
 * Simplified Authentication Middleware
 * For Hostinger Shared Hosting
 */

class AuthMiddleware {
    private $firebaseConfig;
    
    public function __construct($firebaseConfig) {
        $this->firebaseConfig = $firebaseConfig;
    }
    
    /**
     * Require authentication for protected routes
     */
    public function requireAuth($callback) {
        try {
            // Get Authorization header
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
            
            if (!$authHeader) {
                $this->sendUnauthorized('Missing Authorization header');
                return;
            }
            
            // Extract token from Bearer header
            if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $this->sendUnauthorized('Invalid Authorization header format');
                return;
            }
            
            $idToken = $matches[1];
            
            // Verify token with Firebase
            $result = $this->firebaseConfig->verifyIdToken($idToken);
            
            if (!$result['success']) {
                $this->sendUnauthorized('Invalid token: ' . $result['error']);
                return;
            }
            
            // Build user object
            $user = [
                'uid' => $result['uid'],
                'email' => $result['email'] ?? null,
                'email_verified' => $result['email_verified'] ?? false,
                'name' => $result['name'] ?? null,
                'picture' => $result['picture'] ?? null
            ];
            
            // Execute callback with user data
            call_user_func($callback, $user, $idToken);
            
        } catch (Exception $e) {
            error_log("Auth middleware error: " . $e->getMessage());
            $this->sendUnauthorized('Authentication failed');
        }
    }
    
    /**
     * Send unauthorized response
     */
    private function sendUnauthorized($message = 'Unauthorized') {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'timestamp' => date('c')
        ]);
        exit;
    }
}
?>
