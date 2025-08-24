<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

// Log the input for debugging
error_log('Contact form input: ' . print_r($input, true));

// Validate required fields
if (empty($input['name']) || empty($input['email']) || empty($input['message']) || empty($input['service']) || empty($input['subject'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Name, email, service, subject, and message are required']);
    exit;
}

// Test mail function
$test_result = mail('test@example.com', 'Test from contact form', 'This is a test message', 'From: noreply@devinquire.com');
error_log('Mail test result: ' . ($test_result ? 'SUCCESS' : 'FAILED'));

echo json_encode([
    'success' => true, 
    'message' => 'Test successful - mail function works: ' . ($test_result ? 'YES' : 'NO'),
    'received_data' => $input
]);
?>