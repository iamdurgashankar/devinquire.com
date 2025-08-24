-- Create posts table
CREATE TABLE IF NOT EXISTS `posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `excerpt` TEXT,
    `content` LONGTEXT,
    `category` VARCHAR(100),
    `tags` JSON,
    `featured_image` VARCHAR(500),
    `author_name` VARCHAR(255),
    `author_id` INT,
    `read_time` VARCHAR(50) DEFAULT '5 min read',
    `status` ENUM('draft', 'published', 'archived', 'deleted') DEFAULT 'draft',
    `views` INT DEFAULT 0,
    `likes` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_status` (`status`),
    INDEX `idx_category` (`category`),
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample blog post
INSERT INTO `posts` (`title`, `excerpt`, `content`, `category`, `tags`, `featured_image`, `author_name`, `status`) VALUES
('Welcome to DevInquire Blog', 'This is our first blog post to get you started with the DevInquire platform.', 'Welcome to the DevInquire blog! This is where we will share insights, tutorials, and updates about web development, React, and modern development practices.\n\nOur blog covers a wide range of topics including:\n\n- Web Development Best Practices\n- React Tips and Tricks\n- SEO Optimization\n- UI/UX Design Principles\n- Performance Optimization\n- Backend Development\n- Mobile Development\n\nStay tuned for more exciting content!', 'Web Development', '["welcome", "blog", "development"]', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', 'Admin User', 'published'),
('Getting Started with React', 'Learn the fundamentals of React and start building modern web applications.', 'React is a powerful JavaScript library for building user interfaces. In this post, we will cover the basics of React and how to get started.\n\n## What is React?\n\nReact is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components".\n\n## Key Concepts\n\n### Components\nComponents are the building blocks of React applications. They can be either functional or class-based.\n\n### JSX\nJSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files.\n\n### Props\nProps are how you pass data from parent components to child components.\n\n### State\nState is how you manage data that changes over time in your components.\n\n## Getting Started\n\nTo create a new React app, you can use Create React App:\n\n```bash\nnpx create-react-app my-app\ncd my-app\nnpm start\n```\n\nThis will create a new React application and start the development server.', 'React', '["react", "javascript", "tutorial", "beginner"]', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', 'Admin User', 'published');