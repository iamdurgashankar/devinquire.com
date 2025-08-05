# DevInquire - Development Agency Website

A comprehensive web platform for development agencies featuring a modern frontend, powerful admin dashboard, and complete blog management system.

## 🚀 Features

### Frontend Website
- **Modern Landing Page**: Professional homepage with services showcase
- **Blog System**: Dynamic blog with categories, tags, and search functionality
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Contact Forms**: Integrated contact and newsletter subscription
- **SEO Optimized**: Meta tags and structured content

### Admin Dashboard
- **User Management**: Approve/reject registrations, manage user roles
- **Blog Management**: Create, edit, publish, and manage blog posts
- **Dashboard Analytics**: User statistics and content metrics
- **Content Management**: Dynamic page builder and content editor
- **Role-based Access**: Secure admin-only features

### Technical Features
- **Dual Application Architecture**: Separate main website and admin dashboard
- **RESTful API**: PHP backend with MySQL database
- **Authentication System**: JWT-based session management
- **CORS Support**: Proper cross-origin resource sharing
- **Database Schema**: Comprehensive tables for users, posts, and pages

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **PHP** (v7.4 or higher) with MySQL extension
- **MySQL** database (v5.7 or higher)
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/iamdurgashankar/devinquire.com.git
cd devinquire
```

### 2. Install dependencies

#### Main Website Dependencies
```bash
npm install
```

#### Dashboard Dependencies
```bash
cd dashboard
npm install
cd ..
```

### 3. Install PHP (if not already installed)

#### macOS:

```bash
# Using Homebrew
brew install php

# Or using MAMP/XAMPP
# Download from https://www.mamp.info/ or https://www.apachefriends.org/
```

#### Windows:

```bash
# Download from https://windows.php.net/download/
# Or use XAMPP: https://www.apachefriends.org/
```

#### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install php php-cli php-common
```

### 4. Database Setup

#### Create MySQL Database

```sql
CREATE DATABASE devinquire CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE devinquire;
```

#### Import Database Schema

1. **Users Table** (for authentication and user management):
```bash
mysql -u your_username -p devinquire < api/schema.sql
```

2. **Posts Table** (for blog functionality):
```bash
mysql -u your_username -p devinquire < api/posts_schema.sql
```

#### Configure Database Connection

Update the database credentials in `api/db.php`:

```php
$host = 'localhost';
$dbname = 'devinquire';
$username = 'your_db_username';
$password = 'your_db_password';
```

### 5. Environment Configuration

The application automatically detects the environment:

- **Development**: Uses `http://localhost:8000/api`
- **Production**: Uses `https://devinquire.com/api`

## 🚀 Running the Application

### Development Environment

The application consists of three components that need to be running simultaneously:

#### 1. Start the PHP API Server

```bash
cd api
php -S localhost:8000
```

This starts the backend API on `http://localhost:8000`

#### 2. Start the Main Website (Frontend)

```bash
# In a new terminal, from project root
PORT=3002 npm start
```

This starts the main website on `http://localhost:3002`

#### 3. Start the Admin Dashboard

```bash
# In a new terminal
cd dashboard
PORT=3003 npm start
```

This starts the admin dashboard on `http://localhost:3003`

### Access URLs

- **Main Website**: http://localhost:3002
- **Admin Dashboard**: http://localhost:3003
- **API Backend**: http://localhost:8000

### Quick Start Script

For convenience, you can use the provided setup scripts:

#### macOS/Linux:
```bash
./dev-setup.sh
```

#### Windows:
```bash
dev-setup.bat
```

### Production

1. **Build the React application**:

```bash
npm run build
```

2. **Deploy the files**:

- Upload the `build` folder contents to your web server
- Upload the `api` folder to your server's API directory
- Ensure the API base URL in `src/services/api.js` points to your production domain

## Default Admin Credentials

For local development, the default admin credentials are:

- **Email**: admin@devinquire.com
- **Password**: admin123

## 📡 API Endpoints

### Authentication
- `POST /api/login.php` - User login
- `POST /api/signup.php` - User registration
- `GET /api/session.php` - Get current session
- `POST /api/logout.php` - User logout

### User Management (Admin)
- `GET /api/get_users.php` - Get all users
- `POST /api/delete_user.php` - Delete user
- `GET /api/get_pending_users.php` - Get pending users
- `POST /api/approve_user.php` - Approve user registration
- `POST /api/reject_user.php` - Reject user registration

### Profile Management
- `GET /api/profile.php` - Get user profile
- `POST /api/profile.php` - Update user profile

### Blog Management
- `GET /api/get_posts.php` - Get all blog posts
- `GET /api/get_post.php?id={id}` - Get single blog post
- `POST /api/create_post.php` - Create new blog post (admin)
- `POST /api/update_post.php` - Update blog post (admin)
- `POST /api/delete_post.php` - Soft delete blog post (admin)
- `POST /api/permanent_delete_post.php` - Permanently delete blog post (admin)

## 📁 Project Structure

```
devinquire/
├── api/                    # PHP Backend API
│   ├── db.php             # Database connection & CORS
│   ├── schema.sql         # Users table schema
│   ├── posts_schema.sql   # Posts table schema
│   ├── login.php          # Authentication endpoints
│   ├── signup.php
│   ├── session.php
│   ├── get_posts.php      # Blog API endpoints
│   ├── get_post.php
│   ├── create_post.php
│   ├── update_post.php
│   ├── delete_post.php
│   └── ...
├── dashboard/              # Admin Dashboard (React)
│   ├── public/
│   ├── src/
│   │   ├── components/    # Dashboard components
│   │   ├── pages/         # Dashboard pages
│   │   └── services/      # API services
│   └── package.json
├── public/                 # Main website static files
├── src/                    # Main website source (React)
│   ├── components/        # Reusable components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   └── services/          # API services
├── package.json           # Main website dependencies
├── dev-setup.sh          # Development setup script
└── README.md             # Documentation
```

## Troubleshooting

### Common Issues

1. **PHP not found**: Install PHP using the instructions above
2. **API Connection Error**: Make sure the PHP server is running on port 8000
3. **CORS Issues**: The PHP server includes CORS headers for local development
4. **Login Not Working**: Check that the API endpoints are accessible

### Reset Database (Local Development)

If you need to reset the local database:

1. Open the browser console
2. Run: `localStorage.clear()`
3. Refresh the page

Or use the reset button in the admin panel.

### Port Already in Use

If port 8000 is already in use:

```bash
# Find the process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the MIT License.

## 🗄️ Database Schema

### Users Table

For user authentication and management:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Posts Table

For blog functionality:

```sql
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(100),
    tags TEXT,
    featured_image VARCHAR(255),
    author_name VARCHAR(255) NOT NULL,
    read_time INT DEFAULT 5,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Migration Notes

- Import `api/schema.sql` for the users table
- Import `api/posts_schema.sql` for the posts table with sample data
- MySQL 8.0+ supports `IF NOT EXISTS` for columns
- For older MySQL versions, check column existence before altering tables

---

## Session Cookie Security

- In `api/db.php`, set `session.cookie_secure` to `1` for production (HTTPS), and to `0` for local development (HTTP).

---
