<?php
/**
 * Simplified Firebase Configuration
 * For Hostinger Shared Hosting
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use GuzzleHttp\Client;

class FirebaseConfig {
    private $projectId;
    private $webApiKey;
    private $httpClient;
    private $publicKeys = [];
    private $publicKeysExpiry = 0;
    
    public function __construct() {
        // Get from environment variables or use defaults
        $this->projectId = $_ENV['FIREBASE_PROJECT_ID'] ?? getenv('FIREBASE_PROJECT_ID') ?? 'devinquirecom';
        $this->webApiKey = $_ENV['FIREBASE_WEB_API_KEY'] ?? getenv('FIREBASE_WEB_API_KEY') ?? '';
        
        // Initialize HTTP client
        $this->httpClient = new Client([
            'timeout' => 10,
            'verify' => true,
            'http_errors' => false
        ]);
        
        $this->validateConfig();
    }
    
    /**
     * Verify Firebase ID token
     */
    public function verifyIdToken($idToken) {
        try {
            if (empty($idToken)) {
                throw new Exception('ID token is required');
            }
            
            // Get Firebase public keys
            $publicKeys = $this->getFirebasePublicKeys();
            
            // Decode token header to get key ID
            $tokenParts = explode('.', $idToken);
            if (count($tokenParts) !== 3) {
                throw new Exception('Invalid token format');
            }
            
            $header = json_decode(base64_decode(str_replace(['_', '-'], ['/', '+'], $tokenParts[0])), true);
            
            if (!isset($header['kid']) || !isset($publicKeys[$header['kid']])) {
                throw new Exception('Invalid token key ID');
            }
            
            // Verify token
            $decoded = JWT::decode($idToken, new Key($publicKeys[$header['kid']], 'RS256'));
            
            // Validate token claims
            if (isset($decoded->aud) && $decoded->aud !== $this->projectId) {
                throw new Exception('Invalid audience');
            }
            
            $expectedIssuer = "https://securetoken.google.com/{$this->projectId}";
            if (isset($decoded->iss) && $decoded->iss !== $expectedIssuer) {
                throw new Exception('Invalid issuer');
            }
            
            if (isset($decoded->exp) && $decoded->exp < time()) {
                throw new Exception('Token expired');
            }
            
            if (isset($decoded->iat) && $decoded->iat > time() + 60) {
                throw new Exception('Token used before issued');
            }
            
            return [
                'success' => true,
                'uid' => $decoded->sub ?? null,
                'email' => $decoded->email ?? null,
                'email_verified' => $decoded->email_verified ?? false,
                'name' => $decoded->name ?? null,
                'picture' => $decoded->picture ?? null
            ];
            
        } catch (Exception $e) {
            error_log("Firebase token verification failed: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Get Firebase public keys for token verification
     */
    private function getFirebasePublicKeys() {
        // Check if cached keys are still valid
        if (!empty($this->publicKeys) && time() < $this->publicKeysExpiry) {
            return $this->publicKeys;
        }
        
        try {
            $response = $this->httpClient->get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
            
            if ($response->getStatusCode() !== 200) {
                throw new Exception('Failed to fetch Firebase public keys');
            }
            
            $keys = json_decode($response->getBody(), true);
            
            if (!$keys) {
                throw new Exception('Invalid response from Firebase');
            }
            
            // Cache keys for 1 hour
            $this->publicKeys = $keys;
            $this->publicKeysExpiry = time() + 3600;
            
            // Check cache-control header for more accurate expiry
            $cacheControl = $response->getHeader('Cache-Control');
            if (!empty($cacheControl)) {
                preg_match('/max-age=(\d+)/', $cacheControl[0], $matches);
                if (!empty($matches[1])) {
                    $this->publicKeysExpiry = time() + intval($matches[1]);
                }
            }
            
            return $this->publicKeys;
            
        } catch (Exception $e) {
            error_log("Failed to fetch Firebase public keys: " . $e->getMessage());
            throw new Exception('Failed to fetch Firebase public keys: ' . $e->getMessage());
        }
    }
    
    /**
     * Validate Firebase configuration
     */
    private function validateConfig() {
        if (empty($this->projectId)) {
            throw new Exception('Firebase Project ID is required');
        }
    }
    
    /**
     * Check if Firebase is properly configured
     */
    public function isConfigured() {
        return !empty($this->projectId);
    }
}
?>
