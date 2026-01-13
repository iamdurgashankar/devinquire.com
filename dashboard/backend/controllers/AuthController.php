<?php
/**
 * Simplified Authentication Controller
 * Handles Firebase token verification only
 */

class AuthController {
    private $firebaseAuth;
    
    public function __construct($firebaseAuth) {
        $this->firebaseAuth = $firebaseAuth;
    }
    
    /**
     * Verify Firebase ID token
     */
    public function verifyToken() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['idToken']) || empty($input['idToken'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing or empty idToken parameter'
                ]);
                return;
            }
            
            $result = $this->firebaseAuth->verifyIdToken($input['idToken']);
            
            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'uid' => $result['uid'],
                        'email' => $result['email'] ?? null,
                        'email_verified' => $result['email_verified'] ?? false,
                        'name' => $result['name'] ?? null,
                        'picture' => $result['picture'] ?? null
                    ],
                    'timestamp' => date('c')
                ]);
            } else {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => $result['error'] ?? 'Token verification failed',
                    'timestamp' => date('c')
                ]);
            }
            
        } catch (Exception $e) {
            error_log("Token verification error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Server error during token verification',
                'timestamp' => date('c')
            ]);
        }
    }
    
    /**
     * Get authentication status
     */
    public function getAuthStatus() {
        echo json_encode([
            'firebase_configured' => $this->firebaseAuth->isConfigured(),
            'server_time' => date('c'),
            'auth_methods' => [
                'firebase_id_token' => true
            ]
        ]);
    }
}
?>
