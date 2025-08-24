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

// Validate required fields
if (empty($input['name']) || empty($input['email']) || empty($input['message']) || empty($input['service']) || empty($input['subject'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Name, email, service, subject, and message are required']);
    exit;
}

// Sanitize input
$name = htmlspecialchars(trim($input['name']));
$email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$subject_input = htmlspecialchars(trim($input['subject']));
$message = htmlspecialchars(trim($input['message']));
$phone = isset($input['phone']) ? htmlspecialchars(trim($input['phone'])) : '';
$company = isset($input['company']) ? htmlspecialchars(trim($input['company'])) : '';
$service = htmlspecialchars(trim($input['service']));
$budget = isset($input['budget']) ? htmlspecialchars(trim($input['budget'])) : '';
$timeline = isset($input['timeline']) ? htmlspecialchars(trim($input['timeline'])) : '';

if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

// Function to send emails with better error handling
function sendEmail($to, $subject, $body, $headers) {
    // Log email attempt for debugging
    error_log("Attempting to send email to: $to with subject: $subject");
    
    $result = mail($to, $subject, $body, $headers);
    
    if (!$result) {
        error_log("Failed to send email to: $to");
        // Check if we're in development environment
        if (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) {
            // In development, simulate successful email sending
            error_log("Development mode: Simulating email send to $to");
            return true;
        }
    } else {
        error_log("Successfully sent email to: $to");
    }
    
    return $result;
}

// Function to send thank you email to customer
function sendThankYouEmail($customerEmail, $customerName) {
    $subject = 'Thank You for Contacting DevInquire - We\'ve Received Your Message!';
    $headers = "From: DevInquire <contact@devinquire.com>\r\n";
    $headers .= "Reply-To: contact@devinquire.com\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    $body = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You - DevInquire</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0077b6 0%, #005a8a 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">DevInquire</h1>
                <p style="color: #e0f4ff; margin: 10px 0 0 0; font-size: 16px;">Digital Solutions & Innovation</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ' . $customerName . ',</h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                    Thank you for reaching out to DevInquire! We\'ve successfully received your message and are excited about the opportunity to work with you.
                </p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #0077b6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="color: #0077b6; margin: 0 0 10px 0; font-size: 18px;">✅ What happens next?</h3>
                    <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
                        <li>Our team will review your project details within 24 hours</li>
                        <li>We\'ll prepare a customized proposal based on your requirements</li>
                        <li>You\'ll receive a follow-up email with next steps and timeline</li>
                        <li>We\'ll schedule a consultation call to discuss your project in detail</li>
                    </ul>
                </div>
                
                <p style="color: #4b5563; line-height: 1.6; margin: 20px 0; font-size: 16px;">
                    In the meantime, feel free to explore our <a href="https://devinquire.com/services" style="color: #0077b6; text-decoration: none;">services</a> or check out our latest <a href="https://devinquire.com/portfolio" style="color: #0077b6; text-decoration: none;">portfolio projects</a>.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://devinquire.com/dashboard" style="display: inline-block; background-color: #0077b6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Visit Your Dashboard</a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">
                    Have questions? Simply reply to this email or contact us at <a href="mailto:contact@devinquire.com" style="color: #0077b6;">contact@devinquire.com</a>
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #374151;">The DevInquire Team</strong>
                </p>
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    © 2024 DevInquire. All rights reserved.<br>
                    This email was sent because you contacted us through our website.
                </p>
            </div>
        </div>
    </body>
    </html>';
    
    return sendEmail($customerEmail, $subject, $body, $headers);
}

// Email configuration for internal notifications
$internal_subject = "[DevInquire Contact] New Inquiry: $subject_input";
$headers = "From: DevInquire Contact Form <noreply@devinquire.com>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Construct detailed email body for internal team
$body = "New contact form submission received:\n\n";
$body .= "=== CUSTOMER INFORMATION ===\n";
$body .= "Name: $name\n";
$body .= "Email: $email\n";
if (!empty($phone)) {
    $body .= "Phone: $phone\n";
}
if (!empty($company)) {
    $body .= "Company: $company\n";
}
$body .= "\n=== PROJECT DETAILS ===\n";
$body .= "Service Interest: $service\n";
if (!empty($budget)) {
    $body .= "Budget Range: $budget\n";
}
if (!empty($timeline)) {
    $body .= "Timeline: $timeline\n";
}
$body .= "Subject: $subject_input\n";
$body .= "\n=== MESSAGE ===\n";
$body .= "$message\n\n";
$body .= "---\n";
$body .= "This message was sent from the DevInquire contact form.\n";
$body .= "Timestamp: " . date('Y-m-d H:i:s T') . "\n";

// Send emails to both internal addresses
$contact_sent = sendEmail('contact@devinquire.com', $internal_subject, $body, $headers);
$admin_sent = sendEmail('admin@devinquire.com', $internal_subject, $body, $headers);

// Send thank you email to customer
$thankyou_sent = sendThankYouEmail($email, $name);

// Check if all emails were sent successfully
if ($contact_sent && $admin_sent) {
    if ($thankyou_sent) {
        echo json_encode([
            'success' => true, 
            'message' => 'Thank you! Your message has been sent successfully. Please check your email for confirmation.'
        ]);
    } else {
        echo json_encode([
            'success' => true, 
            'message' => 'Your message has been sent successfully to our team.'
        ]);
    }
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'There was an issue sending your message. Please try again or contact us directly.'
    ]);
}

?>