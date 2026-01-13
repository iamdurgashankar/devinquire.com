<?php
/**
 * API Authentication System
 * 
 * Handles authentication for blog management API endpoints
 * Provides secure token-based authentication for dashboard integration
 */

require_once __DIR__ . '/config/database.php';

class APIAuth {
    private $secret_key;
    private $jwt_secret;
    private $allowed_origins;
    private $db;
    
    public function __construct() {
        // Load environment variables if not already loaded
        if (!isset($_ENV['API_SECRET_KEY'])) {
            $this->loadEnvVariables();
        }
        
        $this->secret_key = $_ENV['API_SECRET_KEY'] ?? '';
        $this->jwt_secret = $_ENV['JWT_SECRET'] ?? '';
        $this->allowed_origins = explode(',', $_ENV['ALLOWED_ORIGINS'] ?? '');
        
        try {
            $database = new Database();
            $this->db = $database->getConnection();
        } catch (Exception $e) {
            error_log('Database connection failed in APIAuth: ' . $e->getMessage());
            $this->db = null;
        }
    }
    
    private function loadEnvVariables() {
        if (file_exists(__DIR__ . '/../.env')) {
            $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }
    
    /**
     * Validate API key from request headers
     */
    public function validateAPIKey() {
        $headers = $this->getRequestHeaders();
        $api_key = $headers['X-API-Key'] ?? $headers['Authorization'] ?? '';
        
        // Remove 'Bearer ' prefix if present
        if (strpos($api_key, 'Bearer ') === 0) {
            $api_key = substr($api_key, 7);
        }
        
        if (empty($api_key)) {
            return $this->sendError('API key is required', 401);
        }
        
        // For blog management API, check against configured key
        $blog_api_key = $_ENV['BLOG_API_KEY'] ?? '';
        if ($api_key === $blog_api_key && !empty($blog_api_key)) {
            return true;
        }
        
        // Log failed authentication attempt
        $this->logAuthAttempt($api_key, false);
        
        return $this->sendError('Invalid API key', 403);
    }
    
    /**
     * Generate JWT token for authenticated sessions
     */
    public function generateJWT($payload, $expiry = 3600) {
        if (empty($this->jwt_secret)) {
            return false;
        }
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['exp'] = time() + $expiry;
        $payload['iat'] = time();
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $this->jwt_secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Validate JWT token
     */
    public function validateJWT($token) {
        if (empty($this->jwt_secret) || empty($token)) {
            return false;
        }
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($header, $payload, $signature) = $parts;
        
        $valid_signature = str_replace(['+', '/', '='], ['-', '_', ''], 
            base64_encode(hash_hmac('sha256', $header . "." . $payload, $this->jwt_secret, true)));
        
        if ($signature !== $valid_signature) {
            return false;
        }
        
        $payload_data = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        
        if ($payload_data['exp'] < time()) {
            return false; // Token expired
        }
        
        return $payload_data;
    }
    
    /**
     * Check CORS and set appropriate headers
     */
    public function handleCORS() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, $this->allowed_origins)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
        header('Access-Control-Allow-Credentials: true');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    /**
     * Rate limiting check
     */
    public function checkRateLimit($identifier = null) {
        if (!$this->db) {
            return true; // Skip rate limiting if DB unavailable
        }
        
        $identifier = $identifier ?: $this->getClientIP();
        $window = $_ENV['RATE_LIMIT_WINDOW'] ?? 3600;
        $max_requests = $_ENV['RATE_LIMIT_REQUESTS'] ?? 100;
        
        try {
            // Clean old entries
            $stmt = $this->db->prepare("DELETE FROM rate_limiting WHERE created_at < ?");
            $stmt->execute([date('Y-m-d H:i:s', time() - $window)]);
            
            // Count current requests
            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM rate_limiting WHERE identifier = ? AND created_at > ?");
            $stmt->execute([$identifier, date('Y-m-d H:i:s', time() - $window)]);
            $result = $stmt->fetch();
            
            if ($result['count'] >= $max_requests) {
                return $this->sendError('Rate limit exceeded', 429);
            }
            
            // Log this request
            $stmt = $this->db->prepare("INSERT INTO rate_limiting (identifier, created_at) VALUES (?, ?)");
            $stmt->execute([$identifier, date('Y-m-d H:i:s')]);
            
            return true;
            
        } catch (Exception $e) {
            error_log('Rate limiting error: ' . $e->getMessage());
            return true; // Allow request if rate limiting fails
        }
    }
    
    /**
     * Log authentication attempts
     */
    private function logAuthAttempt($api_key, $success) {
        if (!$this->db) return;
        
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO auth_logs (ip_address, api_key_hash, success, created_at) VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([
                $this->getClientIP(),
                hash('sha256', $api_key),
                $success ? 1 : 0,
                date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            error_log('Auth logging error: ' . $e->getMessage());
        }
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ip_keys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Get request headers
     */
    private function getRequestHeaders() {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }
        
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $header = str_replace('_', '-', substr($key, 5));
                $headers[$header] = $value;
            }
        }
        
        return $headers;
    }
    
    /**
     * Send error response
     */
    private function sendError($message, $code = 400) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => $message,
            'code' => $code,
            'timestamp' => date('c')
        ]);
        exit();
    }
}