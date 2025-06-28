<?php
// contact.php - Handles contact form submissions and sends email to contact@devinquire.com
header('Content-Type: application/json');
require_once 'db.php'; // For CORS headers

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || empty($data['name']) || empty($data['email']) || empty($data['subject']) || empty($data['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

$name = strip_tags($data['name']);
$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
$subject = strip_tags($data['subject']);
$message = strip_tags($data['message']);

if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

$to = 'contact@devinquire.com';
$headers = "From: $name <$email>\r\n" .
           "Reply-To: $email\r\n" .
           "Content-Type: text/plain; charset=UTF-8\r\n";

$body = "You have received a new message from the contact form on Devinquire.com:\n\n" .
        "Name: $name\n" .
        "Email: $email\n" .
        "Subject: $subject\n" .
        "Message:\n$message\n";

if (mail($to, "[Devinquire Contact] $subject", $body, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Message sent successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again later.']);
} 