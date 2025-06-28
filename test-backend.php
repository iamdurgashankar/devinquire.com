<?php
// Test script to verify backend API functionality
echo "=== Backend API Test ===\n\n";

// Test database connection
echo "1. Testing database connection...\n";
require 'api/db.php';
echo "✓ Database connection successful\n\n";

// Test user count
echo "2. Testing user count...\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $row = $stmt->fetch();
    echo "✓ Total users in database: " . $row['count'] . "\n\n";
} catch (Exception $e) {
    echo "✗ Error counting users: " . $e->getMessage() . "\n\n";
}

// Test admin user
echo "3. Testing admin user...\n";
try {
    $stmt = $pdo->prepare("SELECT id, username, email, name, role, status FROM users WHERE role = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch();
    if ($admin) {
        echo "✓ Admin user found: " . $admin['email'] . " (Status: " . $admin['status'] . ")\n\n";
    } else {
        echo "✗ No admin user found\n\n";
    }
} catch (Exception $e) {
    echo "✗ Error finding admin: " . $e->getMessage() . "\n\n";
}

// Test pending users
echo "4. Testing pending users...\n";
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
    $stmt->execute();
    $row = $stmt->fetch();
    echo "✓ Pending users: " . $row['count'] . "\n\n";
} catch (Exception $e) {
    echo "✗ Error counting pending users: " . $e->getMessage() . "\n\n";
}

// Test approved users
echo "5. Testing approved users...\n";
try {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE status = 'approved'");
    $stmt->execute();
    $row = $stmt->fetch();
    echo "✓ Approved users: " . $row['count'] . "\n\n";
} catch (Exception $e) {
    echo "✗ Error counting approved users: " . $e->getMessage() . "\n\n";
}

// Test user table structure
echo "6. Testing user table structure...\n";
try {
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll();
    echo "✓ User table columns:\n";
    foreach ($columns as $column) {
        echo "  - " . $column['Field'] . " (" . $column['Type'] . ")\n";
    }
    echo "\n";
} catch (Exception $e) {
    echo "✗ Error describing table: " . $e->getMessage() . "\n\n";
}

echo "=== Test Complete ===\n";
?> 