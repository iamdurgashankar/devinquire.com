<?php
// SMTP Configuration for production email delivery
// This file provides a more reliable email solution using SMTP

class SMTPMailer {
    private $smtp_host;
    private $smtp_port;
    private $smtp_username;
    private $smtp_password;
    private $from_email;
    private $from_name;
    
    public function __construct($config = []) {
        // Default configuration - update these for production
        $this->smtp_host = $config['smtp_host'] ?? 'smtp.gmail.com';
        $this->smtp_port = $config['smtp_port'] ?? 587;
        $this->smtp_username = $config['smtp_username'] ?? '';
        $this->smtp_password = $config['smtp_password'] ?? '';
        $this->from_email = $config['from_email'] ?? 'contact@devinquire.com';
        $this->from_name = $config['from_name'] ?? 'DevInquire';
    }
    
    public function sendEmail($to, $subject, $body, $isHTML = true) {
        // For development, simulate email sending
        if (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) {
            error_log("SMTP Simulation: Sending email to $to with subject: $subject");
            return true;
        }
        
        // Production SMTP implementation would go here
        // You can integrate with PHPMailer or similar library
        
        $headers = "From: {$this->from_name} <{$this->from_email}>\r\n";
        $headers .= "Reply-To: {$this->from_email}\r\n";
        $headers .= "Content-Type: " . ($isHTML ? "text/html" : "text/plain") . "; charset=UTF-8\r\n";
        
        return mail($to, $subject, $body, $headers);
    }
    
    public function sendContactNotification($formData) {
        $subject = "[DevInquire Contact] New Inquiry: " . $formData['subject'];
        
        $body = "New contact form submission received:\n\n";
        $body .= "=== CUSTOMER INFORMATION ===\n";
        $body .= "Name: " . $formData['name'] . "\n";
        $body .= "Email: " . $formData['email'] . "\n";
        if (!empty($formData['phone'])) {
            $body .= "Phone: " . $formData['phone'] . "\n";
        }
        if (!empty($formData['company'])) {
            $body .= "Company: " . $formData['company'] . "\n";
        }
        $body .= "\n=== PROJECT DETAILS ===\n";
        $body .= "Service Interest: " . $formData['service'] . "\n";
        if (!empty($formData['budget'])) {
            $body .= "Budget Range: " . $formData['budget'] . "\n";
        }
        if (!empty($formData['timeline'])) {
            $body .= "Timeline: " . $formData['timeline'] . "\n";
        }
        $body .= "Subject: " . $formData['subject'] . "\n";
        $body .= "\n=== MESSAGE ===\n";
        $body .= $formData['message'] . "\n\n";
        $body .= "---\n";
        $body .= "This message was sent from the DevInquire contact form.\n";
        $body .= "Timestamp: " . date('Y-m-d H:i:s T') . "\n";
        
        // Send to both internal addresses
        $contact_sent = $this->sendEmail('contact@devinquire.com', $subject, $body, false);
        $admin_sent = $this->sendEmail('admin@devinquire.com', $subject, $body, false);
        
        return $contact_sent && $admin_sent;
    }
    
    public function sendThankYouEmail($customerEmail, $customerName) {
        $subject = 'Thank You for Contacting DevInquire - We\'ve Received Your Message!';
        
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
        
        return $this->sendEmail($customerEmail, $subject, $body, true);
    }
}

// Usage example:
// $mailer = new SMTPMailer();
// $result = $mailer->sendContactNotification($formData);
// $thankYouResult = $mailer->sendThankYouEmail($email, $name);
?>