-- Comprehensive Database Schema for Contact Forms, Blog Subscriptions, and System Features
-- Run this SQL in your MySQL database to create all required tables
-- Includes validation constraints, proper indexing, and foreign key relationships

-- Create contact_submissions table with enhanced validation
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(TRIM(name)) >= 2),
    email VARCHAR(255) NOT NULL CHECK (email REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) DEFAULT NULL CHECK (phone IS NULL OR phone REGEXP '^[+]?[0-9\\s\\-\\(\\)]{7,20}$'),
    company VARCHAR(200) DEFAULT NULL,
    subject VARCHAR(255) DEFAULT NULL CHECK (subject IS NULL OR CHAR_LENGTH(TRIM(subject)) >= 3),
    timeline VARCHAR(100) DEFAULT NULL,
    message TEXT NOT NULL CHECK (CHAR_LENGTH(TRIM(message)) >= 10),
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to VARCHAR(100) DEFAULT NULL,
    response_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_response_sent (response_sent)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rate_limiting table for API rate limiting
CREATE TABLE IF NOT EXISTS rate_limiting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_identifier (identifier),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create auth_logs table for API authentication logging
CREATE TABLE IF NOT EXISTS auth_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    api_key_hash VARCHAR(64) NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_ip_address (ip_address),
    INDEX idx_success (success),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create blog_subscribers table for blog subscription functionality
CREATE TABLE IF NOT EXISTS blog_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    name VARCHAR(100) DEFAULT NULL CHECK (name IS NULL OR CHAR_LENGTH(TRIM(name)) >= 2),
    status ENUM('pending', 'active', 'unsubscribed', 'bounced') DEFAULT 'pending',
    subscription_source VARCHAR(50) DEFAULT 'website',
    preferences JSON DEFAULT NULL COMMENT 'Subscription preferences like frequency, categories',
    confirmation_token VARCHAR(64) DEFAULT NULL,
    unsubscribe_token VARCHAR(64) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    subscription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL DEFAULT NULL,
    unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
    last_email_sent TIMESTAMP NULL DEFAULT NULL,
    bounce_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_subscription_date (subscription_date),
    INDEX idx_confirmation_token (confirmation_token),
    INDEX idx_unsubscribe_token (unsubscribe_token),
    INDEX idx_subscription_source (subscription_source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create newsletter_subscriptions table for general newsletter functionality
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    name VARCHAR(100) DEFAULT NULL CHECK (name IS NULL OR CHAR_LENGTH(TRIM(name)) >= 2),
    categories JSON DEFAULT NULL COMMENT 'Newsletter categories of interest',
    status ENUM('pending', 'confirmed', 'unsubscribed', 'bounced') DEFAULT 'pending',
    frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
    confirmation_token VARCHAR(64) DEFAULT NULL,
    unsubscribe_token VARCHAR(64) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL DEFAULT NULL,
    unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
    last_newsletter_sent TIMESTAMP NULL DEFAULT NULL,
    bounce_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_frequency (frequency),
    INDEX idx_subscribed_at (subscribed_at),
    INDEX idx_confirmation_token (confirmation_token),
    INDEX idx_unsubscribe_token (unsubscribe_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firestore_id VARCHAR(255) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    category_id INT,
    author_name VARCHAR(100) DEFAULT 'Admin User',
    author_email VARCHAR(255),
    author_avatar VARCHAR(500),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    read_time INT DEFAULT 5,
    views INT DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_published_at (published_at),
    INDEX idx_category_id (category_id),
    INDEX idx_is_featured (is_featured),
    INDEX idx_firestore_id (firestore_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blog post tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES blog_tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_tag (post_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default blog categories
INSERT IGNORE INTO blog_categories (name, slug, description, color) VALUES
('Technology', 'technology', 'Latest trends and insights in technology', '#3B82F6'),
('Web Development', 'web-development', 'Web development tutorials and best practices', '#10B981'),
('AI & Machine Learning', 'ai-machine-learning', 'Artificial Intelligence and ML insights', '#8B5CF6'),
('Business', 'business', 'Business strategies and entrepreneurship', '#F59E0B'),
('Design', 'design', 'UI/UX design and creative insights', '#EF4444');

-- Insert default blog tags
INSERT IGNORE INTO blog_tags (name, slug) VALUES
('React', 'react'),
('JavaScript', 'javascript'),
('PHP', 'php'),
('MySQL', 'mysql'),
('API', 'api'),
('Frontend', 'frontend'),
('Backend', 'backend'),
('Tutorial', 'tutorial'),
('Tips', 'tips'),
('Best Practices', 'best-practices');

-- Create users table for system user management
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE CHECK (CHAR_LENGTH(TRIM(username)) >= 3),
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL CHECK (CHAR_LENGTH(TRIM(first_name)) >= 1),
    last_name VARCHAR(50) NOT NULL CHECK (CHAR_LENGTH(TRIM(last_name)) >= 1),
    role ENUM('admin', 'editor', 'author', 'subscriber') DEFAULT 'subscriber',
    status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'pending',
    avatar VARCHAR(500) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL CHECK (phone IS NULL OR phone REGEXP '^[+]?[0-9\\s\\-\\(\\)]{7,20}$'),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(64) DEFAULT NULL,
    password_reset_token VARCHAR(64) DEFAULT NULL,
    password_reset_expires TIMESTAMP NULL DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_email_verified (email_verified),
    INDEX idx_last_login (last_login),
    INDEX idx_email_verification_token (email_verification_token),
    INDEX idx_password_reset_token (password_reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create system_logs table for comprehensive logging
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level ENUM('emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug') NOT NULL,
    message TEXT NOT NULL,
    context JSON DEFAULT NULL COMMENT 'Additional context data',
    user_id INT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    request_method VARCHAR(10) DEFAULT NULL,
    request_uri VARCHAR(500) DEFAULT NULL,
    response_code INT DEFAULT NULL,
    execution_time DECIMAL(10,4) DEFAULT NULL COMMENT 'Execution time in seconds',
    memory_usage INT DEFAULT NULL COMMENT 'Memory usage in bytes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_level (level),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at),
    INDEX idx_response_code (response_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create email_logs table for tracking email communications
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL CHECK (recipient_email REGEXP '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    sender_email VARCHAR(255) DEFAULT NULL,
    subject VARCHAR(255) NOT NULL,
    email_type ENUM('contact_response', 'newsletter', 'blog_notification', 'password_reset', 'email_verification', 'system_alert') NOT NULL,
    template_used VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked') DEFAULT 'pending',
    error_message TEXT DEFAULT NULL,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    opened_at TIMESTAMP NULL DEFAULT NULL,
    clicked_at TIMESTAMP NULL DEFAULT NULL,
    bounce_reason TEXT DEFAULT NULL,
    tracking_id VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_email_type (email_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_tracking_id (tracking_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sessions table for user session management
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    payload LONGTEXT NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create api_keys table for API access management
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    api_secret VARCHAR(128) NOT NULL,
    user_id INT DEFAULT NULL,
    permissions JSON DEFAULT NULL COMMENT 'API permissions and scopes',
    rate_limit_per_hour INT DEFAULT 1000,
    status ENUM('active', 'inactive', 'revoked') DEFAULT 'active',
    last_used TIMESTAMP NULL DEFAULT NULL,
    usage_count INT DEFAULT 0,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_api_key (api_key),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_last_used (last_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create file_uploads table for managing uploaded files
CREATE TABLE IF NOT EXISTS file_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    upload_type ENUM('image', 'document', 'video', 'audio', 'other') NOT NULL,
    uploaded_by INT DEFAULT NULL,
    alt_text VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_stored_name (stored_name),
    INDEX idx_upload_type (upload_type),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_is_public (is_public),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional - remove in production)
-- INSERT INTO contact_submissions (name, email, message) 
-- VALUES ('Test User', 'test@example.com', 'This is a test message.');

-- Show tables to verify creation
-- SHOW TABLES;
-- DESCRIBE contact_submissions;
-- DESCRIBE rate_limiting;
-- DESCRIBE newsletter_subscriptions;