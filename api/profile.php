<?php
header('Content-Type: application/json');
require 'db.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['id'] ?? $_SESSION['user_id'];
    
    // Users can only get their own profile, admins can get any profile
    if ($_SESSION['role'] !== 'admin' && $userId != $_SESSION['user_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        exit;
    }
    
    // Activity log fetch
    if (isset($_GET['activity_log'])) {
        try {
            $stmt = $pdo->prepare("SELECT action, details, created_at FROM user_activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
            $stmt->execute([$userId]);
            $log = $stmt->fetchAll();
            echo json_encode(['success' => true, 'activity_log' => $log]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching activity log']);
        }
        exit;
    }
    // Preferences fetch
    if (isset($_GET['preferences'])) {
        try {
            $stmt = $pdo->prepare("SELECT preferences FROM user_preferences WHERE user_id = ?");
            $stmt->execute([$userId]);
            $prefs = $stmt->fetchColumn();
            echo json_encode(['success' => true, 'preferences' => $prefs ? json_decode($prefs, true) : (object)[]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error fetching preferences']);
        }
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, username, email, name, role, status, created_at, updated_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'Invalid data']);
        exit;
    }
    
    $userId = $data['id'] ?? $_SESSION['user_id'];
    
    // Users can only update their own profile, admins can update any profile
    if ($_SESSION['role'] !== 'admin' && $userId != $_SESSION['user_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Forbidden']);
        exit;
    }
    
    // Preferences update
    if (isset($data['preferences'])) {
        try {
            $prefsJson = json_encode($data['preferences']);
            $stmt = $pdo->prepare("INSERT INTO user_preferences (user_id, preferences) VALUES (?, ?) ON DUPLICATE KEY UPDATE preferences = VALUES(preferences), updated_at = NOW()");
            $stmt->execute([$userId, $prefsJson]);
            echo json_encode(['success' => true, 'message' => 'Preferences updated']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error updating preferences']);
        }
        exit;
    }

    // Log profile update as activity
    try {
        $stmt = $pdo->prepare("INSERT INTO user_activity_log (user_id, action, details) VALUES (?, 'profile_update', ?)");
        $stmt->execute([$userId, json_encode($data)]);
    } catch (Exception $e) {}
    
    try {
        $name = $data['name'] ?? '';
        $password = isset($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;

        if ($password) {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, password_hash = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $password, $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $userId]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?> 