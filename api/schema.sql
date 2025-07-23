-- Create pages table
CREATE TABLE IF NOT EXISTS `pages` (
    `id` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NULL DEFAULT NULL,
    `html` LONGTEXT NULL DEFAULT NULL,
    `css` LONGTEXT NULL DEFAULT NULL,
    `deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `position` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_deleted` (`deleted`),
    INDEX `idx_position` (`position`),
    INDEX `idx_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a sample page (optional)
INSERT INTO `pages` (`id`, `title`, `html`, `css`, `deleted`, `position`) VALUES
('home', 'Home Page', '<section class="py-16 px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl flex flex-col items-center justify-center"><h1 class="text-4xl font-bold mb-4">Welcome to Your Website</h1><p class="text-lg mb-6">Edit this page to get started!</p></section>', '', 0, 0)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

-- Add any missing columns (in case table already exists)
ALTER TABLE `pages`
ADD COLUMN IF NOT EXISTS `deleted` TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `position` INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS `idx_deleted` ON `pages` (`deleted`);
CREATE INDEX IF NOT EXISTS `idx_position` ON `pages` (`position`);
CREATE INDEX IF NOT EXISTS `idx_updated` ON `pages` (`updated_at`);
