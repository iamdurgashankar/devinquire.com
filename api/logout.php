<?php
require 'db.php';
session_start();

// Clear all session data
session_destroy();

echo json_encode(['success' => true, 'message' => 'Logout successful']);
?> 