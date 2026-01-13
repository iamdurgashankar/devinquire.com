<?php
/**
 * Email Sender Utility Class
 * 
 * Handles email sending functionality using PHPMailer
 * Supports SMTP configuration and email templates
 */

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailSender {
    private $mailer;
    private $config;
    
    public function __construct() {
        $this->loadConfig();
        $this->setupMailer();
    }
    
    /**
     * Load email configuration from environment variables
     */
    private function loadConfig() {
        // Load environment variables if not already loaded
        if (file_exists(__DIR__ . '/../../.env')) {
            $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0 || strpos($line, '=') === false) continue;
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
        
        $this->config = [
            'host' => $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com',
            'port' => $_ENV['SMTP_PORT'] ?? 587,
            'username' => $_ENV['SMTP_USERNAME'] ?? '',
            'password' => $_ENV['SMTP_PASSWORD'] ?? '',
            'encryption' => $_ENV['SMTP_ENCRYPTION'] ?? 'tls',
            'from_email' => $_ENV['FROM_EMAIL'] ?? 'noreply@devinquire.com',
            'from_name' => $_ENV['FROM_NAME'] ?? 'DevInquire',
            'contact_email' => $_ENV['CONTACT_EMAIL'] ?? 'contact@devinquire.com'
        ];
    }
    
    /**
     * Setup PHPMailer instance
     */
    private function setupMailer() {
        $this->mailer = new PHPMailer(true);
        
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = $this->config['host'];
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $this->config['username'];
            $this->mailer->Password = $this->config['password'];
            $this->mailer->SMTPSecure = $this->config['encryption'];
            $this->mailer->Port = $this->config['port'];
            
            // Default sender
            $this->mailer->setFrom($this->config['from_email'], $this->config['from_name']);
            
        } catch (Exception $e) {
            error_log('Email setup error: ' . $e->getMessage());
            throw new Exception('Email configuration failed');
        }
    }
    
    /**
     * Send contact form notification email
     */
    public function sendContactNotification($formData) {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            
            // Recipients
            $this->mailer->addAddress($this->config['contact_email']);
            
            // Content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'New Contact Form Submission: ' . $formData['subject'];
            $this->mailer->Body = $this->getContactEmailTemplate($formData);
            $this->mailer->AltBody = $this->getContactEmailTextTemplate($formData);
            
            $result = $this->mailer->send();
            
            if ($result) {
                error_log('Contact notification sent successfully to: ' . $this->config['contact_email']);
                return ['success' => true, 'message' => 'Email sent successfully'];
            } else {
                throw new Exception('Failed to send email');
            }
            
        } catch (Exception $e) {
            error_log('Contact notification error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Send newsletter confirmation email
     */
    public function sendNewsletterConfirmation($email, $confirmationToken) {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            
            // Recipients
            $this->mailer->addAddress($email);
            
            // Content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = 'Confirm Your Newsletter Subscription - DevInquire';
            $this->mailer->Body = $this->getNewsletterConfirmationTemplate($email, $confirmationToken);
            $this->mailer->AltBody = $this->getNewsletterConfirmationTextTemplate($email, $confirmationToken);
            
            $result = $this->mailer->send();
            
            if ($result) {
                error_log('Newsletter confirmation sent successfully to: ' . $email);
                return ['success' => true, 'message' => 'Confirmation email sent'];
            } else {
                throw new Exception('Failed to send confirmation email');
            }
            
        } catch (Exception $e) {
            error_log('Newsletter confirmation error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Get contact form email HTML template
     */
    private function getContactEmailTemplate($formData) {
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New Contact Form Submission</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0077b6; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #0077b6; }
                .value { margin-top: 5px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Contact Form Submission</h1>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="label">Name:</div>
                        <div class="value">' . htmlspecialchars($formData['name']) . '</div>
                    </div>
                    <div class="field">
                        <div class="label">Email:</div>
                        <div class="value">' . htmlspecialchars($formData['email']) . '</div>
                    </div>';
                    
        if (!empty($formData['phone'])) {
            $html .= '
                    <div class="field">
                        <div class="label">Phone:</div>
                        <div class="value">' . htmlspecialchars($formData['phone']) . '</div>
                    </div>';
        }
        
        if (!empty($formData['company'])) {
            $html .= '
                    <div class="field">
                        <div class="label">Company:</div>
                        <div class="value">' . htmlspecialchars($formData['company']) . '</div>
                    </div>';
        }
        
        $html .= '
                    <div class="field">
                        <div class="label">Subject:</div>
                        <div class="value">' . htmlspecialchars($formData['subject']) . '</div>
                    </div>
                    <div class="field">
                        <div class="label">Message:</div>
                        <div class="value">' . nl2br(htmlspecialchars($formData['message'])) . '</div>
                    </div>
                    <div class="field">
                        <div class="label">Submitted:</div>
                        <div class="value">' . date('Y-m-d H:i:s') . '</div>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was sent from the DevInquire contact form.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Get contact form email text template
     */
    private function getContactEmailTextTemplate($formData) {
        $text = "New Contact Form Submission\n\n";
        $text .= "Name: " . $formData['name'] . "\n";
        $text .= "Email: " . $formData['email'] . "\n";
        
        if (!empty($formData['phone'])) {
            $text .= "Phone: " . $formData['phone'] . "\n";
        }
        
        if (!empty($formData['company'])) {
            $text .= "Company: " . $formData['company'] . "\n";
        }
        
        $text .= "Subject: " . $formData['subject'] . "\n";
        $text .= "Message: " . $formData['message'] . "\n";
        $text .= "Submitted: " . date('Y-m-d H:i:s') . "\n";
        
        return $text;
    }
    
    /**
     * Get newsletter confirmation HTML template
     */
    private function getNewsletterConfirmationTemplate($email, $confirmationToken) {
        $confirmationUrl = "https://devinquire.com/api/newsletter-confirm.php?token=" . $confirmationToken;
        
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Confirm Your Newsletter Subscription</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0077b6; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .button { display: inline-block; background: #0077b6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to DevInquire!</h1>
                </div>
                <div class="content">
                    <p>Thank you for subscribing to our newsletter!</p>
                    <p>To complete your subscription, please click the button below to confirm your email address:</p>
                    <p style="text-align: center;">
                        <a href="' . $confirmationUrl . '" class="button">Confirm Subscription</a>
                    </p>
                    <p>If the button doesn\'t work, you can copy and paste this link into your browser:</p>
                    <p><a href="' . $confirmationUrl . '">' . $confirmationUrl . '</a></p>
                    <p>Once confirmed, you\'ll receive our latest insights, tutorials, and updates directly in your inbox.</p>
                </div>
                <div class="footer">
                    <p>If you didn\'t subscribe to this newsletter, you can safely ignore this email.</p>
                    <p>&copy; 2024 DevInquire. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>';
        
        return $html;
    }
    
    /**
     * Get newsletter confirmation text template
     */
    private function getNewsletterConfirmationTextTemplate($email, $confirmationToken) {
        $confirmationUrl = "https://devinquire.com/api/newsletter-confirm.php?token=" . $confirmationToken;
        
        $text = "Welcome to DevInquire!\n\n";
        $text .= "Thank you for subscribing to our newsletter!\n\n";
        $text .= "To complete your subscription, please visit this link to confirm your email address:\n";
        $text .= $confirmationUrl . "\n\n";
        $text .= "Once confirmed, you'll receive our latest insights, tutorials, and updates directly in your inbox.\n\n";
        $text .= "If you didn't subscribe to this newsletter, you can safely ignore this email.\n\n";
        $text .= "© 2024 DevInquire. All rights reserved.";
        
        return $text;
    }
}
?>