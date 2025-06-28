<?php
// Test script to verify session persistence
echo "=== Session Persistence Test ===\n\n";

// Start session
session_start();

echo "1. Current session data:\n";
echo "Session ID: " . session_id() . "\n";
echo "Session data: " . print_r($_SESSION, true) . "\n\n";

// Test database connection
echo "2. Testing database connection...\n";
require 'api/db.php';
echo "✓ Database connection successful\n\n";

// Test session configuration
echo "3. Session configuration:\n";
echo "session.cookie_httponly: " . ini_get('session.cookie_httponly') . "\n";
echo "session.cookie_secure: " . ini_get('session.cookie_secure') . "\n";
echo "session.cookie_samesite: " . ini_get('session.cookie_samesite') . "\n";
echo "session.gc_maxlifetime: " . ini_get('session.gc_maxlifetime') . "\n";
echo "session.cookie_lifetime: " . ini_get('session.cookie_lifetime') . "\n\n";

// Test if user is logged in
echo "4. Testing user authentication...\n";
if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
    try {
        $stmt = $pdo->prepare("SELECT id, username, email, name, role, status FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo "✓ User is logged in:\n";
            echo "  - ID: " . $user['id'] . "\n";
            echo "  - Name: " . $user['name'] . "\n";
            echo "  - Email: " . $user['email'] . "\n";
            echo "  - Role: " . $user['role'] . "\n";
            echo "  - Status: " . $user['status'] . "\n";
        } else {
            echo "✗ User not found in database\n";
        }
    } catch (Exception $e) {
        echo "✗ Error checking user: " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ No user session found\n";
}

echo "\n=== Test Complete ===\n";
echo "To test session persistence:\n";
echo "1. Login to the application\n";
echo "2. Reload this page\n";
echo "3. Check if session data persists\n";
?> 