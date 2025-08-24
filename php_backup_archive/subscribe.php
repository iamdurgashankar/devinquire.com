<?php
header('Content-Type: application/json');
// subscribe.php - Handles newsletter subscription and sends email to contact@devinquire.com
require_once 'db.php'; // For CORS headers

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email is required.']);
    exit;
}

$email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

$to = 'contact@devinquire.com';
$subject = '[Devinquire Newsletter] New Subscription';
$body = "A new user has subscribed to the newsletter.\n\nEmail: $email\n";
$headers = "From: noreply@devinquire.com\r\n" .
           "Reply-To: $email\r\n" .
           "Content-Type: text/plain; charset=UTF-8\r\n";

// Check if we're in development mode (localhost)
$isDevelopment = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
                  strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);

if ($isDevelopment) {
    // In development mode, simulate successful email sending
    error_log("[DEV MODE] Newsletter subscription email would be sent to: $to");
    error_log("[DEV MODE] Subject: $subject");
    error_log("[DEV MODE] Subscriber email: $email");
    echo json_encode(['success' => true, 'message' => 'Subscription successful.']);
} else {
    // In production mode, actually send the email
    if (mail($to, $subject, $body, $headers)) {
        echo json_encode(['success' => true, 'message' => 'Subscription successful.']);
    } else {
        error_log("Failed to send newsletter subscription email for: $email");
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to send subscription. Please try again later.']);
    }
}