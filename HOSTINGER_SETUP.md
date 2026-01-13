# Hostinger Deployment Setup Guide

## Database Configuration ✅

Your Hostinger database credentials have been configured:

- **Database Name**: `u180145459_devinquire`
- **Username**: `u180145459_devinquire_db`
- **Password**: `8763155488@Sipu`
- **Host**: `localhost` (on Hostinger server)

## Files Ready for Upload

### 1. Frontend Files (Upload to public_html/)
From the `build/` folder, upload:
- `index.html`
- `static/` folder (CSS & JS files)
- `manifest.json`
- `robots.txt`
- `sitemap.xml`
- `.htaccess`

### 2. Backend Files (Upload to public_html/api/)
Upload the entire `api/` folder containing:
- All PHP files (contact.php, newsletter.php, etc.)
- `config/` folder with database.php and .env
- `utils/` folder with EmailSender.php
- `vendor/` folder with PHPMailer dependencies
- `sql/` folder with database schema

## Database Setup Steps

### Step 1: Import Database Schema
1. Go to Hostinger control panel → MySQL Databases
2. Click on phpMyAdmin for database `u180145459_devinquire`
3. Import the file `api/sql/schema.sql`
4. Verify these tables are created:
   - `blog_posts`
   - `contact_submissions`
   - `newsletter_subscriptions`

### Step 2: Verify Database Connection
After uploading files, test the connection by visiting:
```
https://yourdomain.com/api/test-db.php
```

You should see a success message with database connection details.

## Email Configuration

Update the email settings in `api/config/.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-actual-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=your-actual-email@gmail.com
CONTACT_EMAIL=contact@devinquire.com
```

### Gmail App Password Setup:
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security → App passwords
3. Generate an app password for "Mail"
4. Use this app password (not your regular Gmail password)

## Testing After Deployment

### 1. Test Website
Visit your domain to ensure the frontend loads correctly.

### 2. Test Contact Form
1. Fill out the contact form on your website
2. Check if the form submits successfully
3. Verify email notification is sent

### 3. Test Newsletter
1. Subscribe to the newsletter
2. Check if confirmation email is sent
3. Click the confirmation link to verify it works

### 4. Test Database
Visit `https://yourdomain.com/api/test-db.php` to verify database connection.

## Security Checklist

- [ ] SSL certificate enabled in Hostinger
- [ ] Database credentials secured in .env file
- [ ] Email credentials configured with app password
- [ ] File permissions set correctly (644 for files, 755 for directories)
- [ ] Remove test files (test-db.php, test-email.php) after testing

## Troubleshooting

### Database Connection Issues
- Verify database name, username, and password are correct
- Check if database user has proper privileges
- Ensure the database exists in Hostinger control panel

### Email Not Sending
- Verify Gmail app password is used (not regular password)
- Check SMTP settings are correct
- Ensure Gmail account has 2FA enabled

### 404 Errors
- Check if .htaccess file is uploaded
- Verify file paths are correct
- Ensure mod_rewrite is enabled (usually enabled by default on Hostinger)

## File Structure on Hostinger

```
public_html/
├── index.html (React app entry point)
├── static/ (CSS, JS, images)
├── manifest.json
├── robots.txt
├── sitemap.xml
├── .htaccess
└── api/
    ├── contact.php
    ├── newsletter.php
    ├── newsletter-confirm.php
    ├── blog.php
    ├── auth.php
    ├── config/
    │   ├── database.php
    │   └── .env (with your credentials)
    ├── utils/
    │   └── EmailSender.php
    ├── vendor/ (PHPMailer)
    └── sql/
        └── schema.sql
```

## Next Steps

1. Upload all files to Hostinger
2. Import database schema
3. Configure email credentials
4. Test all functionality
5. Enable SSL certificate
6. Remove test files

Your website is now ready for production! 🚀