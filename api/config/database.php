<?php
/**
 * Secure Database Configuration
 * 
 * This file contains the database connection settings for MySQL.
 * Uses environment variables for secure credential management.
 */

// Load environment variables
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

class Database {
    // Database credentials from environment variables
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset;
    private $max_retries = 3;
    private $retry_delay = 1; // seconds
    
    public $conn;
    
    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->db_name = $_ENV['DB_NAME'] ?? '';
        $this->username = $_ENV['DB_USERNAME'] ?? '';
        $this->password = $_ENV['DB_PASSWORD'] ?? '';
        $this->charset = $_ENV['DB_CHARSET'] ?? 'utf8mb4';
        
        // Validate required credentials
        if (empty($this->db_name) || empty($this->username) || empty($this->password)) {
            throw new Exception('Database credentials not properly configured in environment variables');
        }
    }
    
    /**
     * Get database connection with retry logic
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;
        $attempt = 0;
        
        while ($attempt < $this->max_retries) {
            try {
                $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
                
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . $this->charset,
                    PDO::ATTR_TIMEOUT => 10,
                    PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                    PDO::ATTR_PERSISTENT => false
                ];
                
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                
                // Test the connection
                $this->conn->query('SELECT 1');
                
                return $this->conn;
                
            } catch(PDOException $exception) {
                $attempt++;
                $error_msg = "Database connection attempt {$attempt} failed: " . $exception->getMessage();
                error_log($error_msg);
                
                if ($attempt >= $this->max_retries) {
                    error_log("Database connection failed after {$this->max_retries} attempts");
                    return null;
                }
                
                // Wait before retry
                sleep($this->retry_delay);
            }
        }
        
        return null;
    }
    
    /**
     * Test database connection
     * @return bool
     */
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            if ($conn) {
                $stmt = $conn->query('SELECT 1');
                return $stmt !== false;
            }
            return false;
        } catch (Exception $e) {
            error_log("Database test failed: " . $e->getMessage());
            return false;
        }
    }
}
?>