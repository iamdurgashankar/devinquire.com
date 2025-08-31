# DevInquire

A modern web application platform featuring a React frontend with comprehensive PHP backend API for blog management, contact forms, and newsletter subscriptions.

## Project Structure

This project contains:

- **Frontend Application** (`/src`) - React-based public website with marketing pages, blog system, and user features
- **PHP Backend API** (`/api`) - RESTful API with comprehensive database schema for all backend operations
- **Database Schema** (`/api/sql`) - Complete MySQL database structure with advanced features

## Applications

### Frontend Application
- **Port**: 3000 (default)
- **Purpose**: Public website with home, about, services, products, blog, and contact pages
- **Key Features**: 
  - Modern React-based marketing website
  - Dynamic blog system with categories and tags
  - Contact forms with backend integration
  - Newsletter subscription system
  - Support agent integration
  - SEO optimized pages

### PHP Backend API
- **Port**: 8000 (development)
- **Purpose**: RESTful API for all backend operations
- **Key Features**:
  - Blog management (CRUD operations)
  - Contact form processing
  - Newsletter subscription management
  - Rate limiting and security
  - Comprehensive logging system
  - File upload management

## Getting Started

### Frontend Application
```bash
npm install
npm start
```

### PHP Backend API
```bash
npm run server
# or manually:
cd api
php -S localhost:8000
```

## Build Commands

- `npm run build` - Build frontend application for production
- `npm run server` - Start PHP development server on port 8000
- `npm test` - Run frontend tests
- `npm run eject` - Eject from Create React App (not recommended)

## Technology Stack

### Frontend
- **React** 18.2.0 - Modern UI library
- **Tailwind CSS** 3.4.1 - Utility-first CSS framework
- **Framer Motion** 12.18.1 - Animation library
- **React Router DOM** 6.21.0 - Client-side routing
- **Lucide React** 0.539.0 - Icon library
- **Axios** 1.6.0 - HTTP client
- **React Helmet Async** 2.0.5 - SEO management

### Backend
- **PHP** 7.4+ - Server-side scripting
- **MySQL** 5.7+ - Database management
- **RESTful API** - Clean API architecture

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **React Scripts** 5.0.1 - Build tooling

A comprehensive web platform for development agencies featuring a modern React frontend and robust PHP backend API with complete blog management system.

## 🚀 Features

### Frontend Website
- **Modern Landing Page**: Professional homepage with services and products showcase
- **Dynamic Blog System**: Full-featured blog with categories, tags, and content management
- **Responsive Design**: Mobile-first design with Tailwind CSS and smooth animations
- **Contact Forms**: Integrated contact forms with backend processing
- **Newsletter System**: Email subscription management with confirmation
- **SEO Optimized**: Meta tags, structured data, and performance optimization
- **Support Agent**: Interactive support chat integration

### Backend API Features
- **Blog Management**: Complete CRUD operations for posts, categories, and tags
- **Contact Processing**: Form submission handling with validation and logging
- **Newsletter Management**: Subscription handling with email verification
- **File Upload System**: Secure file management with metadata tracking
- **User Management**: Comprehensive user system with roles and permissions
- **Email System**: Automated email sending with tracking and logging

### Technical Features
- **RESTful API Architecture**: Clean, well-documented PHP backend
- **Advanced Database Schema**: 10+ tables with proper relationships and indexing
- **Rate Limiting**: API protection with configurable limits
- **Security Features**: Input validation, SQL injection protection, and secure sessions
- **Comprehensive Logging**: System logs, email logs, and authentication tracking
- **CORS Support**: Proper cross-origin resource sharing for API access

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

```bash
npm install
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

The project includes a comprehensive database schema with all required tables:

```bash
mysql -u your_username -p devinquire < api/sql/schema.sql
```

This creates the following tables:
- **contact_submissions** - Contact form submissions
- **blog_posts, blog_categories, blog_tags** - Complete blog system
- **newsletter_subscriptions, blog_subscribers** - Email subscription management
- **users** - User management with roles and permissions
- **file_uploads** - File management system
- **system_logs, email_logs, auth_logs** - Comprehensive logging
- **sessions, api_keys** - Security and session management
- **rate_limiting** - API protection

#### Configure Database Connection

Update the database credentials in `api/config/database.php`:

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

The application consists of two components that need to be running simultaneously:

#### 1. Start the PHP API Server

```bash
cd api
php -S localhost:8000
```

This starts the backend API on `http://localhost:8000`

#### 2. Start the Frontend Application

```bash
# In a new terminal, from project root
npm start
```

This starts the React application on `http://localhost:3000`

### Access URLs

- **Frontend Website**: http://localhost:3000
- **API Backend**: http://localhost:8000
- **API Documentation**: Available through the API endpoints

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

## 🚀 Deployment

### Automated Deployment (GitHub Actions)
The project uses GitHub Actions for automated deployment to Hostinger:

**Workflow Features:**
- **Trigger**: Push to `main` branch or manual workflow dispatch
- **Build Process**: 
  - Install dependencies (`npm install`)
  - Build React application (`npm run build`)
  - Build dashboard if needed (`npm run build:dashboard`)
- **Deploy**: Trigger Hostinger webhook for deployment
- **Live URL**: `https://devinquire.com`

### Manual Production Build
```bash
# Install dependencies
npm install

# Build React application
npm run build

# Start PHP server (for local testing)
npm run php-server
```

### Environment Configuration

**Frontend Configuration (`src/config.js`)**
```javascript
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development'
};
```

**Backend Configuration (`api/config/database.php`)**
- Update database credentials for production
- Configure CORS settings for production domain
- Set up SSL certificates
- Configure web server (Apache/Nginx) for PHP support

### Deployment Checklist
- [ ] Update database credentials in `api/config/database.php`
- [ ] Set production API URL in frontend configuration
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificates
- [ ] Import database schema (`api/sql/schema.sql`)
- [ ] Configure web server for PHP and React routing

## 👤 Admin Access

### Default Admin Setup
To create an admin user, you can:

1. **Register through the API** and manually update the user role in the database:
   ```sql
   UPDATE users SET role = 'admin', status = 'active' WHERE email = 'your-email@domain.com';
   ```

2. **Insert directly into the database**:
   ```sql
   INSERT INTO users (username, email, password_hash, role, status) 
   VALUES ('admin', 'admin@devinquire.com', '$2y$10$hashed_password', 'admin', 'active');
   ```

### Admin Features
- Blog post management (create, edit, delete)
- Category and tag management
- Contact form submissions review
- Newsletter subscriber management
- User management and role assignment
- System logs and analytics

## 📡 API Endpoints

### Blog API (`/api/blog.php`)
- `GET /api/blog.php` - Get all published blog posts
- `GET /api/blog.php/{id}` - Get single blog post by ID
- `GET /api/blog.php/category/{slug}` - Get posts by category
- `GET /api/blog.php/tag/{slug}` - Get posts by tag
- `GET /api/blog.php/search?q={query}` - Search blog posts

### Blog Admin API (`/api/blog-admin.php`) 
- `GET /api/blog-admin.php/posts` - Get all posts (including drafts)
- `POST /api/blog-admin.php/posts` - Create new blog post
- `PUT /api/blog-admin.php/posts/{id}` - Update blog post
- `DELETE /api/blog-admin.php/posts/{id}` - Delete blog post
- `GET /api/blog-admin.php/categories` - Manage categories
- `GET /api/blog-admin.php/tags` - Manage tags

### Contact API (`/api/contact.php`)
- `POST /api/contact.php` - Submit contact form
- `GET /api/contact.php` - Get contact submissions (admin)

### Newsletter API (`/api/newsletter.php`)
- `POST /api/newsletter.php/subscribe` - Subscribe to newsletter
- `POST /api/newsletter.php/unsubscribe` - Unsubscribe from newsletter
- `GET /api/newsletter.php/verify/{token}` - Verify email subscription

### Authentication API (`/api/auth.php`)
- `POST /api/auth.php/login` - User authentication
- `POST /api/auth.php/logout` - User logout
- `GET /api/auth.php/session` - Get current session
- `POST /api/auth.php/register` - User registration

## 📁 Project Structure

```
devinquire/
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions deployment
├── api/                   # PHP Backend API
│   ├── config/
│   │   └── database.php   # Database configuration
│   ├── sql/
│   │   └── schema.sql     # Complete database schema
│   ├── auth.php           # Authentication & security
│   ├── blog.php           # Public blog API
│   ├── blog-admin.php     # Admin blog management
│   ├── contact.php        # Contact form processing
│   └── newsletter.php     # Newsletter management
├── public/                # Static files & build output
│   ├── index.html         # Main HTML template
│   ├── manifest.json      # PWA manifest
│   ├── robots.txt         # SEO robots file
│   └── sitemap.xml        # SEO sitemap
├── src/                   # React Frontend Source
│   ├── components/        # Reusable UI components
│   │   ├── shared/        # Shared component library
│   │   ├── Navbar.jsx     # Navigation component
│   │   ├── Footer.jsx     # Footer component
│   │   └── ...
│   ├── pages/             # Page components
│   │   ├── Home.jsx       # Homepage
│   │   ├── Blog.jsx       # Blog listing
│   │   ├── BlogPost.jsx   # Individual blog post
│   │   ├── Services.jsx   # Services page
│   │   ├── Products.jsx   # Products page
│   │   ├── Contact.jsx    # Contact page
│   │   └── ...
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service functions
│   ├── styles/            # CSS and styling
│   ├── utils/             # Utility functions
│   ├── images/            # Image assets
│   └── config.js          # Frontend configuration
├── package.json           # Dependencies & scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── README.md              # Project documentation
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

## 🔒 Security Features

### Authentication & Authorization
- JWT-based session management
- Role-based access control (admin, user, guest)
- Password hashing with PHP's `password_hash()`
- Session timeout and automatic logout

### API Security
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Input validation and sanitization
- SQL injection prevention with prepared statements
- XSS protection with output escaping

### Database Security
- Prepared statements for all queries
- User role and permission management
- Audit logging for admin actions
- Secure password storage

### Production Security
- HTTPS enforcement (set `session.cookie_secure` to `1`)
- Secure cookie configuration
- Environment-based configuration
- Error logging without exposing sensitive data

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (frontend and API)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- **Frontend**: Follow React best practices and ESLint rules
- **Backend**: Follow PSR-12 PHP coding standards
- **Database**: Use proper indexing and foreign key constraints
- **Security**: Always validate and sanitize user inputs

## 📞 Support

### Getting Help
- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check this README and inline code comments
- **Contact**: Reach out via the contact form on the website

### Common Issues
- **CORS Errors**: Check `api/auth.php` CORS configuration
- **Database Connection**: Verify credentials in `api/config/database.php`
- **Build Errors**: Ensure all dependencies are installed (`npm install`)
- **PHP Errors**: Check server error logs and PHP version compatibility

---

**Built with ❤️ by the DevInquire Team**

## 📊 Database Schema

The complete database schema is available in `api/sql/schema.sql` and includes:

- **Blog System**: Posts, categories, tags, and relationships
- **User Management**: Users, roles, sessions, and authentication
- **Contact System**: Form submissions and processing
- **Newsletter**: Subscriptions and email verification
- **Logging**: System logs, email logs, and audit trails
- **File Management**: Upload tracking and metadata

---
