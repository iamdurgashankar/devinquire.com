# 🚀 Hostinger Admin Panel Setup Guide

This guide will help you set up the complete admin panel on your Hostinger hosting with PHP backend and MySQL database.

## 📋 Prerequisites

- Hostinger hosting account with PHP support
- MySQL database access
- Domain name (optional, can use subdomain)
- Basic knowledge of FTP/cPanel

## 🗄️ Step 1: Database Setup

### 1.1 Create MySQL Database

1. Log into your Hostinger control panel
2. Go to "Databases" → "MySQL Databases"
3. Create a new database:
   - **Database name**: `devinquire_admin` (or your preferred name)
   - **Username**: Create a new user
   - **Password**: Use a strong password
4. Note down the database details for later use

### 1.2 Import Database Schema

1. Go to "Databases" → "phpMyAdmin"
2. Select your newly created database
3. Click on "SQL" tab
4. Copy and paste the contents of `backend/database/schema.sql`
5. Click "Go" to execute the SQL

## 📁 Step 2: Upload Backend Files

### 2.1 Upload via File Manager

1. In Hostinger control panel, go to "Files" → "File Manager"
2. Navigate to your `public_html` folder
3. Create a new folder called `backend`
4. Upload all files from the `backend` folder to this directory

### 2.2 File Structure on Hostinger

```
public_html/
├── backend/
│   ├── config/
│   │   ├── database.php
│   │   └── config.php
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.php
│   │   │   └── register.php
│   │   ├── posts/
│   │   │   └── index.php
│   │   └── upload/
│   │       └── image.php
│   ├── database/
│   │   └── schema.sql
│   └── uploads/
└── (your React app files)
```

## ⚙️ Step 3: Configure Backend

### 3.1 Update Database Configuration

Edit `backend/config/database.php`:

```php
<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'your_hostinger_db_name'; // Your database name
    private $username = 'your_hostinger_username'; // Your database username
    private $password = 'your_hostinger_password'; // Your database password
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>
```

### 3.2 Update Security Keys

Edit `backend/config/config.php`:

```php
// Change these to random strings
define('SECRET_KEY', 'your-random-secret-key-here');
define('JWT_SECRET', 'your-random-jwt-secret-key-here');
```

Generate random keys:

```bash
# You can use online generators or run this in PHP:
echo bin2hex(random_bytes(32));
```

### 3.3 Update Upload URL

Edit `backend/api/upload/image.php`:

```php
// Change this to your actual domain
$fileUrl = 'https://yourdomain.com/backend/uploads/' . $result['filename'];
```

## 🌐 Step 4: Configure Frontend

### 4.1 Update API Base URL

Edit `src/services/api.js`:

```javascript
const API_BASE_URL = "https://yourdomain.com/backend/api";
```

### 4.2 Build and Upload React App

1. Build your React app:

```bash
npm run build
```

2. Upload the contents of the `build` folder to your `public_html` directory

### 4.3 Create .htaccess for React Router

Create `.htaccess` in your `public_html` directory:

```apache
RewriteEngine On
RewriteBase /

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

## 🔐 Step 5: Security Configuration

### 5.1 Set File Permissions

Set proper permissions for uploads directory:

```bash
chmod 755 backend/uploads
chmod 644 backend/config/*.php
```

### 5.2 Create .htaccess for Backend Security

Create `.htaccess` in your `backend` directory:

```apache
# Prevent direct access to config files
<Files "*.php">
    Order Allow,Deny
    Allow from all
</Files>

<Files "config/*">
    Order Deny,Allow
    Deny from all
</Files>

# Prevent access to database files
<Files "*.sql">
    Order Deny,Allow
    Deny from all
</Files>

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

## 🧪 Step 6: Testing

### 6.1 Test Database Connection

Create a test file `backend/test_db.php`:

```php
<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    echo "Database connection successful!";
} else {
    echo "Database connection failed!";
}
?>
```

Access it via: `https://yourdomain.com/backend/test_db.php`

### 6.2 Test API Endpoints

Test the login endpoint:

```bash
curl -X POST https://yourdomain.com/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@devinquire.com","password":"admin123"}'
```

## 🔧 Step 7: Environment Variables (Optional)

For better security, you can use environment variables:

### 7.1 Create .env file

Create `.env` in your `backend` directory:

```env
DB_HOST=localhost
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
JWT_SECRET=your_jwt_secret
SECRET_KEY=your_secret_key
```

### 7.2 Update config to use .env

Install a PHP dotenv library or manually read the .env file.

## 📱 Step 8: Mobile Optimization

### 8.1 Add PWA Support

Create `public/manifest.json`:

```json
{
  "name": "DevInquire Admin",
  "short_name": "DevInquire",
  "start_url": "/admin",
  "display": "standalone",
  "background_color": "#1e40af",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🚀 Step 9: Performance Optimization

### 9.1 Enable Gzip Compression

Add to your `.htaccess`:

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### 9.2 Enable Browser Caching

Add to your `.htaccess`:

```apache
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

## 🔍 Step 10: Troubleshooting

### Common Issues:

1. **Database Connection Failed**

   - Check database credentials in `database.php`
   - Verify database exists in phpMyAdmin
   - Check if MySQL is enabled in Hostinger

2. **API Endpoints Not Working**

   - Check file permissions
   - Verify .htaccess configuration
   - Check PHP error logs in Hostinger

3. **Image Upload Failed**

   - Check uploads directory permissions
   - Verify file size limits in PHP settings
   - Check allowed file types

4. **CORS Issues**
   - Verify CORS headers in `config.php`
   - Check if your domain is properly configured

### Debug Mode:

Enable debug mode by editing `backend/config/config.php`:

```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## 📊 Step 11: Monitoring

### 11.1 Set up Error Logging

Create `backend/logs/` directory and add to `config.php`:

```php
ini_set('log_errors', 1);
ini_set('error_log', '../logs/php_errors.log');
```

### 11.2 Monitor Performance

Use Hostinger's built-in monitoring tools to track:

- Database performance
- File upload usage
- API response times

## 🎉 Success!

Your admin panel is now live on Hostinger!

**Default Admin Credentials:**

- Email: `admin@devinquire.com`
- Password: `admin123`

**Important:** Change the default password after first login!

## 🔒 Security Checklist

- [ ] Changed default admin password
- [ ] Updated JWT and secret keys
- [ ] Set proper file permissions
- [ ] Enabled HTTPS
- [ ] Configured security headers
- [ ] Set up error logging
- [ ] Disabled debug mode in production
- [ ] Regular database backups

## 📞 Support

If you encounter issues:

1. Check Hostinger's error logs
2. Verify all configuration files
3. Test database connection
4. Check file permissions
5. Review PHP error logs

Your admin panel is now ready to use with full CRUD functionality, secure authentication, and beautiful UI! 🚀

# Hostinger Deployment Guide

This guide will help you deploy your Devinquire project to Hostinger using GitHub for continuous deployment.

## 🚀 Overview

Hostinger supports multiple deployment methods:

1. **FTP/SFTP Deployment** (Recommended)
2. **Git Deployment** (Alternative)
3. **cPanel Git Version Control**

## 📋 Prerequisites

1. **Hostinger Account**: Active hosting plan with domain devinquire.com
2. **GitHub Repository**: Your code pushed to GitHub
3. **FTP Credentials**: From your Hostinger control panel

## 🔧 Method 1: FTP/SFTP Deployment (Recommended)

### Step 1: Get FTP Credentials from Hostinger

1. **Login to Hostinger Control Panel**

   - Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Login with your Hostinger account

2. **Find FTP Credentials**
   - Go to **Files** → **FTP Accounts**
   - Note down:
     - FTP Server (usually `your-domain.com` or `ftp.your-domain.com`)
     - FTP Username
     - FTP Password
     - Server directory (usually `/public_html/`)

### Step 2: Set Up GitHub Secrets

1. **Go to your GitHub repository**

   - Navigate to **Settings** → **Secrets and variables** → **Actions**

2. **Add these secrets:**
   ```
   HOSTINGER_FTP_SERVER=your-ftp-server.com
   HOSTINGER_FTP_USERNAME=your-ftp-username
   HOSTINGER_FTP_PASSWORD=your-ftp-password
   HOSTINGER_SERVER_DIR=/public_html/
   ```

### Step 3: Configure Domain

1. **In Hostinger Control Panel**
   - Go to **Domains** → **Manage**
   - Ensure devinquire.com points to your hosting
   - Set up SSL certificate (free with Hostinger)

### Step 4: Deploy

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Setup Hostinger deployment"
   git push origin main
   ```

2. **Check GitHub Actions**
   - Go to **Actions** tab in your GitHub repository
   - Watch the "Deploy to Hostinger" workflow run

## 🔧 Method 2: Git Deployment (Alternative)

### Step 1: Enable Git in Hostinger

1. **In Hostinger Control Panel**
   - Go to **Advanced** → **Git**
   - Click **Create Repository**
   - Name it `devinquire`
   - Note the Git URL

### Step 2: Set Up Local Git Remote

```bash
# Add Hostinger as a remote
git remote add hostinger your-git-url-from-hostinger

# Push to Hostinger
git push hostinger main
```

### Step 3: Configure Auto-Deploy

1. **In Hostinger Git settings**
   - Enable **Auto-deploy**
   - Set branch to `main`
   - Set directory to `/public_html/`

## 🔧 Method 3: cPanel Git Version Control

### Step 1: Access cPanel

1. **In Hostinger Control Panel**
   - Go to **Advanced** → **cPanel**
   - Find **Git Version Control**

### Step 2: Create Repository

1. **Click "Create"**
   - Repository Name: `devinquire`
   - Repository URL: Your GitHub repository URL
   - Branch: `main`
   - Directory: `/public_html/`

### Step 3: Deploy

1. **Click "Deploy"**
   - This will pull your code from GitHub
   - Your site will be live at devinquire.com

## 🛠️ Configuration Files

### .htaccess for React Router

The deployment workflow automatically creates an `.htaccess` file for React Router:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Environment Variables

Create a `.env` file in your Hostinger public_html directory:

```env
NODE_ENV=production
REACT_APP_API_URL=https://devinquire.com/api
```

## 🔄 Continuous Deployment

Once set up, every push to your `main` branch will:

1. ✅ Build your React frontend
2. ✅ Package backend files
3. ✅ Upload to Hostinger via FTP
4. ✅ Update devinquire.com automatically

## 🗂️ File Structure on Hostinger

After deployment, your Hostinger directory will look like:

```
public_html/
├── index.html              # React app entry point
├── static/                 # React build files
├── .htaccess              # Apache configuration
├── backend/               # Backend files
│   ├── index.js
│   ├── package.json
│   └── api/
└── assets/                # Static assets
```

## 🚨 Important Notes

### Backend Configuration

Since Hostinger shared hosting doesn't support Node.js directly, you have options:

1. **Use External Backend**: Deploy backend to Railway/Render and update API URLs
2. **Use Hostinger VPS**: Upgrade to VPS plan for Node.js support
3. **Use PHP Backend**: Convert backend to PHP for shared hosting

### Recommended Setup

```
Frontend: Hostinger (devinquire.com)
Backend: Railway/Render (api.devinquire.com)
```

## 🔍 Troubleshooting

### Common Issues:

1. **FTP Connection Failed**

   - Verify FTP credentials
   - Check if FTP is enabled in Hostinger
   - Try SFTP instead of FTP

2. **Build Failures**

   - Check GitHub Actions logs
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

3. **React Router Not Working**

   - Ensure `.htaccess` file is uploaded
   - Check if mod_rewrite is enabled
   - Verify RewriteBase path

4. **SSL Issues**
   - Enable SSL in Hostinger control panel
   - Wait for certificate propagation (up to 24 hours)
   - Check mixed content warnings

### Debug Steps:

1. **Check GitHub Actions**

   - Go to Actions tab
   - Click on failed workflow
   - Review error logs

2. **Check Hostinger Logs**

   - Go to **Advanced** → **Error Logs**
   - Look for recent errors

3. **Test FTP Connection**
   - Use FileZilla or similar FTP client
   - Test connection with your credentials

## 📞 Support

- **Hostinger Support**: [support.hostinger.com](https://support.hostinger.com)
- **GitHub Actions**: [docs.github.com/en/actions](https://docs.github.com/en/actions)
- **FTP Issues**: Check Hostinger knowledge base

## 🎯 Next Steps

1. **Choose deployment method** (FTP recommended)
2. **Set up GitHub secrets**
3. **Configure domain and SSL**
4. **Push code to trigger deployment**
5. **Test your live site**

Your site will be live at devinquire.com with automatic updates! 🎉
