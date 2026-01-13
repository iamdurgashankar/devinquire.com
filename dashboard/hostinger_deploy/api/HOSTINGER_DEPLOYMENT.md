# Hostinger Shared Hosting Deployment Guide

This guide will help you deploy the simplified PHP backend to Hostinger shared hosting.

## 📋 Prerequisites

- Hostinger shared hosting account
- PHP 7.4 or higher
- FTP/File Manager access
- Firebase project credentials

## 🚀 Deployment Steps

### Step 1: Prepare Files Locally

1. **Install Dependencies** (on your local machine):
   ```bash
   cd backend
   composer install --no-dev --optimize-autoloader
   ```

2. **Create Environment File**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase credentials:
   ```
   FIREBASE_PROJECT_ID=your-actual-project-id
   FIREBASE_WEB_API_KEY=your-actual-api-key
   ```

### Step 2: Upload to Hostinger

1. **Connect via FTP or File Manager**:
   - Log in to your Hostinger control panel
   - Navigate to File Manager or use FTP client
   - Go to `public_html` or your domain's root directory

2. **Create API Directory** (optional):
   - Create a folder: `api` or `backend`
   - Or upload directly to a subdomain like `api.yourdomain.com`

3. **Upload Files**:
   Upload these files and folders:
   ```
   backend/
   ├── index.php
   ├── .htaccess
   ├── .env (with your credentials)
   ├── config/
   │   └── firebase.php
   ├── controllers/
   │   └── AuthController.php
   ├── middleware/
   │   └── AuthMiddleware.php
   └── vendor/
       └── (all composer dependencies)
   ```

### Step 3: Configure Hostinger

1. **Set PHP Version**:
   - In Hostinger control panel, go to PHP Configuration
   - Set PHP version to 7.4 or higher (8.0+ recommended)

2. **Update .htaccess** (if needed):
   - The `.htaccess` file is already configured
   - If your backend is in a subdirectory, update `RewriteBase` in `.htaccess`

3. **Set Permissions**:
   - Set folder permissions to `755`
   - Set file permissions to `644`
   - Ensure `logs/` directory is writable (`755` or `777`)

### Step 4: Test the API

1. **Health Check**:
   ```
   https://yourdomain.com/api/health
   ```
   
   Should return:
   ```json
   {
     "status": "healthy",
     "service": "DevInquire Dashboard API",
     "version": "1.0.0",
     "timestamp": "2024-01-15T10:00:00+00:00",
     "firebase_configured": true
   }
   ```

2. **Auth Status**:
   ```
   https://yourdomain.com/api/auth/status
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory with:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
```

**Important**: 
- Never commit `.env` to version control
- Keep `.env` file secure on the server

### CORS Configuration

The backend is configured to allow requests from any origin. To restrict:

Edit `index.php` and change:
```php
header('Access-Control-Allow-Origin: *');
```

To:
```php
header('Access-Control-Allow-Origin: https://dashboard.devinquire.com');
```

## 📁 Directory Structure

After deployment, your structure should look like:

```
public_html/
└── api/                    (or your chosen directory)
    ├── index.php
    ├── .htaccess
    ├── .env
    ├── config/
    │   └── firebase.php
    ├── controllers/
    │   └── AuthController.php
    ├── middleware/
    │   └── AuthMiddleware.php
    ├── vendor/
    │   └── (composer dependencies)
    └── logs/               (create if needed)
```

## 🔍 API Endpoints

### Health Check
```
GET /api/health
```

### Verify Token
```
POST /api/auth/verify
Body: { "idToken": "firebase-id-token" }
```

### Auth Status
```
GET /api/auth/status
```

## 🐛 Troubleshooting

### Issue: 500 Internal Server Error

**Solutions**:
1. Check PHP error logs in Hostinger control panel
2. Verify `.env` file exists and has correct values
3. Check file permissions (755 for folders, 644 for files)
4. Verify PHP version is 7.4+

### Issue: Composer Dependencies Not Found

**Solutions**:
1. Ensure `vendor/` folder is uploaded completely
2. Re-upload `vendor/` folder if missing files
3. Check file permissions on `vendor/` directory

### Issue: CORS Errors

**Solutions**:
1. Verify `.htaccess` is uploaded and working
2. Check `Access-Control-Allow-Origin` header in `index.php`
3. Ensure OPTIONS requests are handled (check `.htaccess`)

### Issue: Firebase Token Verification Fails

**Solutions**:
1. Verify `FIREBASE_PROJECT_ID` in `.env` is correct
2. Check Firebase project is active
3. Verify token is not expired
4. Check server can make outbound HTTPS requests

### Issue: .htaccess Not Working

**Solutions**:
1. Verify `.htaccess` file is in the correct directory
2. Check if mod_rewrite is enabled (should be on Hostinger)
3. Try accessing `index.php` directly: `https://yourdomain.com/api/index.php`

## 🔒 Security Best Practices

1. **Protect .env file**:
   - Ensure `.env` is not publicly accessible
   - `.htaccess` should block access to `.env`

2. **File Permissions**:
   - Folders: `755`
   - Files: `644`
   - `.env`: `600` (most restrictive)

3. **Error Reporting**:
   - Disable `display_errors` in production
   - Enable `log_errors` for debugging

4. **HTTPS**:
   - Always use HTTPS in production
   - Hostinger provides free SSL certificates

## 📊 Monitoring

### Check Logs

1. **PHP Error Logs**:
   - Access via Hostinger control panel
   - Look for PHP errors and warnings

2. **Application Logs** (if enabled):
   - Check `logs/auth.log` if configured
   - Ensure `logs/` directory is writable

### Test Endpoints

Use curl or Postman to test:

```bash
# Health check
curl https://yourdomain.com/api/health

# Auth status
curl https://yourdomain.com/api/auth/status
```

## 🔄 Updating the Backend

1. **Make changes locally**
2. **Test locally**:
   ```bash
   composer install
   php -S localhost:8000 index.php
   ```
3. **Upload changed files** via FTP/File Manager
4. **Test on production**

## 📞 Support

If you encounter issues:

1. Check Hostinger error logs
2. Verify all files are uploaded correctly
3. Test endpoints individually
4. Check Firebase configuration

## ✅ Deployment Checklist

- [ ] Composer dependencies installed locally
- [ ] `.env` file created with Firebase credentials
- [ ] All files uploaded to Hostinger
- [ ] PHP version set to 7.4+
- [ ] File permissions set correctly
- [ ] `.htaccess` file uploaded
- [ ] Health check endpoint works
- [ ] CORS configured correctly
- [ ] Error reporting disabled in production
- [ ] HTTPS enabled

---

**Note**: This is a simplified backend. Most functionality is handled by Firebase directly in the frontend. The PHP backend only provides token verification endpoints.

