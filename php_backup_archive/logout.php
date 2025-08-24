<?php
header('Content-Type: application/json');
require_once 'db.php'; // Consistent CORS/session handling

// Clear all session data
session_destroy();

echo json_encode(['success' => true, 'message' => 'Logout successful']);
?> 