<?php
header('Content-Type: application/json');
require 'db.php';
session_start();

if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
    try {
        // Get user details from database
        $stmt = $pdo->prepare("SELECT id, username, email, name, role, status FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo json_encode([
                'loggedIn' => true,
                'user_id' => $user['id'],
                'role' => $user['role'],
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'status' => $user['status']
                ]
            ]);
        } else {
            // User not found in database, clear session
            session_destroy();
            echo json_encode(['loggedIn' => false]);
        }
    } catch (Exception $e) {
        echo json_encode(['loggedIn' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['loggedIn' => false]);
}
?> 