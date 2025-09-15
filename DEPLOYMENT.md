# Devinquire.com Deployment Guide for Hostinger

## Overview
This guide provides step-by-step instructions for deploying the Devinquire.com website to Hostinger hosting.

## Prerequisites
- Hostinger hosting account with PHP support (7.4+)
- MySQL database access
- Domain configured to point to Hostinger
- FTP/SFTP access or File Manager access

## Deployment Structure
```
public_html/
├── index.html (from build folder)
├── static/ (from build folder)
├── manifest.json
├── robots.txt
├── sitemap.xml
├── .htaccess
└── api/
    ├── auth.php
    ├── blog-admin.php
    ├── blog.php
    ├── composer.json
    ├── composer.lock
    ├── config/
    │   └── database.php
    ├── contact.php
    ├── newsletter-confirm.php
    ├── newsletter.php
    ├── sql/
    │   └── schema.sql
    ├── utils/
    │   └── EmailSender.php
    └── vendor/
        └── (all composer dependencies)
```

## Step 1: Prepare Files for Upload

### Frontend Files (from build folder)
Upload these files to your domain's root directory (public_html):
- `index.html`
- `static/` folder (contains CSS and JS)
- `manifest.json`
- `robots.txt`
- `sitemap.xml`
- `.htaccess`

### Backend Files (api folder)
Upload the entire `api/` folder to your domain's root directory.

## Step 2: Database Setup

### Create MySQL Database
1. Log into Hostinger control panel
2. Go to MySQL Databases
3. Create a new database (e.g., `devinquire_db`)
4. Create a database user with full privileges
5. Note down: database name, username, password, and host

### Import Database Schema
1. Access phpMyAdmin or use MySQL command line
2. Import the schema from `api/sql/schema.sql`
3. Verify tables are created: `blog_posts`, `contact_submissions`, `newsletter_subscriptions`

## Step 3: Configure Environment Variables

### Update Database Configuration
Edit `api/config/database.php` with your Hostinger database credentials:
```php
<?php
$host = 'your-hostinger-mysql-host';
$dbname = 'your-database-name';
$username = 'your-database-username';
$password = 'your-database-password';
```

### Email Configuration
Create `api/config/.env` file with your email settings:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
CONTACT_EMAIL=contact@devinquire.com
```

## Step 4: SSL and Security

### Enable SSL
1. In Hostinger control panel, enable SSL certificate
2. Force HTTPS redirects
3. Update any hardcoded HTTP URLs to HTTPS

### Security Headers
Ensure `.htaccess` includes security headers:
```apache
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

## Step 5: Testing

### Test Frontend
1. Visit your domain
2. Check all pages load correctly
3. Verify responsive design
4. Test navigation and forms

### Test API Endpoints
1. Test contact form submission
2. Test newsletter subscription
3. Verify email notifications work
4. Check database entries are created

### Test Email Functionality
1. Submit contact form
2. Subscribe to newsletter
3. Verify emails are sent and received
4. Test newsletter confirmation links

## Step 6: Performance Optimization

### Enable Compression
Add to `.htaccess`:
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

### Enable Caching
Add caching rules to `.htaccess`:
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

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify database credentials in `config/database.php`
   - Check if database user has proper privileges
   - Ensure database host is correct

2. **Email Not Sending**
   - Verify SMTP credentials in `.env` file
   - Check if Gmail App Password is used (not regular password)
   - Ensure SMTP ports are not blocked by hosting provider

3. **404 Errors on API Calls**
   - Check if `.htaccess` is properly uploaded
   - Verify API folder structure
   - Ensure mod_rewrite is enabled

4. **CORS Issues**
   - Update CORS headers in PHP files if needed
   - Check if domain matches in API responses

### Log Files
- Check Hostinger error logs for PHP errors
- Monitor database connection logs
- Review email delivery logs

## Maintenance

### Regular Tasks
1. Monitor database size and optimize tables
2. Update composer dependencies regularly
3. Review and rotate email credentials
4. Monitor SSL certificate expiration
5. Backup database regularly

### Updates
1. Test changes locally first
2. Use staging environment if available
3. Backup before deploying updates
4. Monitor logs after deployment

## Support
For issues specific to this deployment, check:
1. Hostinger documentation
2. PHP error logs
3. Database connection status
4. Email delivery logs

## Security Checklist
- [ ] SSL certificate enabled
- [ ] Database credentials secured
- [ ] Email credentials secured
- [ ] Security headers configured
- [ ] File permissions set correctly
- [ ] Regular backups scheduled
- [ ] Error reporting disabled in production