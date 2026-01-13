# 🚀 Complete Hostinger Deployment Guide - Dashboard Application

This guide will help you deploy both the **Frontend (React)** and **Backend (PHP)** to Hostinger hosting.

---

## 📋 Overview

Your dashboard application has **two parts**:

1. **Frontend (React)** - The dashboard UI
2. **Backend (PHP)** - API for Firebase token verification

---

## 🎯 Deployment Strategy

### Option 1: Separate Subdomains (Recommended)

- **Frontend**: `dashboard.yourdomain.com` or `yourdomain.com/dashboard`
- **Backend**: `api.yourdomain.com` or `yourdomain.com/api`

### Option 2: Same Domain

- **Frontend**: `yourdomain.com` (root)
- **Backend**: `yourdomain.com/api`

---

## 📦 Part 1: Frontend Deployment (React)

### Step 1: Build Production Version

**On your local machine:**

```bash
cd dashboard
npm run build
```

This creates a `build/` folder with optimized production files.

**Expected output:**

```
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:
  447.04 kB  build/static/js/main.xxxxx.js
  20.23 kB   build/static/css/main.xxxxx.css

The build folder is ready to be deployed.
```

### Step 2: Files to Upload for Frontend

Upload **everything inside** the `build/` folder to Hostinger:

```
build/
├── index.html
├── manifest.json
├── asset-manifest.json
├── blog-sync-client.js (if exists)
└── static/
    ├── css/
    │   └── main.xxxxx.css
    ├── js/
    │   └── main.xxxxx.js
    └── media/ (if exists)
```

**Upload location on Hostinger:**

- **Option A**: `public_html/dashboard/` (if using subdirectory)
- **Option B**: `public_html/` (if using subdomain like dashboard.yourdomain.com)

### Step 3: Create .htaccess for Frontend

Create `.htaccess` in your frontend upload location:

```apache
# React Router - SPA Support
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule . /index.html [L]
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "DENY"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

---

## 🔧 Part 2: Backend Deployment (PHP)

### Step 1: Prepare Backend Files

**On your local machine:**

```bash
cd dashboard/backend

# Install production dependencies (if not done)
composer install --no-dev --optimize-autoloader
```

### Step 2: Files to Upload for Backend

Upload **these files and folders** to Hostinger:

```
backend/
├── index.php                    ✅ REQUIRED
├── .htaccess                    ✅ REQUIRED
├── .env                         ✅ REQUIRED (with your Firebase credentials)
├── composer.json                 ✅ REQUIRED
├── config/
│   └── firebase.php             ✅ REQUIRED
├── controllers/
│   └── AuthController.php       ✅ REQUIRED
├── middleware/
│   └── AuthMiddleware.php       ✅ REQUIRED
└── vendor/                      ✅ REQUIRED (entire folder)
    ├── autoload.php
    ├── firebase/
    ├── guzzlehttp/
    └── ... (all dependencies)
```

**Upload location on Hostinger:**

- `public_html/api/` (recommended)
- Or `public_html/backend/`

### Step 3: Verify .env File

Make sure your `.env` file has **real Firebase credentials**:

```env
FIREBASE_PROJECT_ID=devinquirecom
FIREBASE_WEB_API_KEY=AIzaSyArdCvkX7bDdp0EtwiFmvqOotkcQuY-cYY
```

**Important:**

- ✅ Use your actual Firebase Project ID
- ✅ Use your actual Firebase Web API Key
- ❌ Don't use placeholder values like "your-project-id"

---

## 📤 Complete Upload Checklist

### Frontend Files (from `build/` folder):

- [ ] `index.html`
- [ ] `manifest.json`
- [ ] `asset-manifest.json`
- [ ] `static/` folder (entire folder)
- [ ] `.htaccess` (for SPA routing)

**Upload to:** `public_html/dashboard/` or `public_html/`

### Backend Files (from `backend/` folder):

- [ ] `index.php`
- [ ] `.htaccess`
- [ ] `.env` (with Firebase credentials)
- [ ] `composer.json`
- [ ] `config/` folder
- [ ] `controllers/` folder
- [ ] `middleware/` folder
- [ ] `vendor/` folder (entire folder - very important!)

**Upload to:** `public_html/api/`

---

## 🗂️ Hostinger File Structure

After upload, your Hostinger structure should look like:

```
public_html/
├── index.html                    (Frontend - if root)
├── .htaccess                     (Frontend - if root)
├── static/                       (Frontend assets)
│   ├── css/
│   ├── js/
│   └── media/
├── dashboard/                    (OR if using subdirectory)
│   ├── index.html
│   ├── .htaccess
│   └── static/
└── api/                          (Backend)
    ├── index.php
    ├── .htaccess
    ├── .env
    ├── composer.json
    ├── config/
    ├── controllers/
    ├── middleware/
    └── vendor/
```

---

## ⚙️ Hostinger Configuration

### 1. Set PHP Version

1. Log in to **Hostinger Control Panel**
2. Go to **PHP Configuration**
3. Select **PHP 7.4 or higher** (8.0+ recommended)
4. Apply to your domain

### 2. Set File Permissions

**Using File Manager:**

- Right-click folders → Change Permissions → `755`
- Right-click files → Change Permissions → `644`
- `.env` file → `600` (most secure)

**Using FTP:**

```bash
# Folders
chmod 755 api/
chmod 755 api/config/
chmod 755 api/controllers/
chmod 755 api/middleware/
chmod 755 api/vendor/

# Files
chmod 644 api/index.php
chmod 644 api/composer.json
chmod 600 api/.env  # Most secure for .env
```

### 3. Configure Domain/Subdomain

**For Frontend:**

- If using subdomain: Create `dashboard.yourdomain.com` in Hostinger
- Point it to `public_html/dashboard/` or `public_html/`

**For Backend:**

- If using subdomain: Create `api.yourdomain.com` in Hostinger
- Point it to `public_html/api/`

---

## ✅ Testing After Deployment

### Test Frontend:

1. **Visit your dashboard URL:**

   ```
   https://dashboard.yourdomain.com
   ```

   OR

   ```
   https://yourdomain.com/dashboard
   ```

2. **Check if it loads:**
   - Should see the dashboard interface
   - No console errors
   - Firebase connection works

### Test Backend:

1. **Health Check:**

   ```
   https://api.yourdomain.com/api/health
   ```

   OR

   ```
   https://yourdomain.com/api/health
   ```

   **Expected response:**

   ```json
   {
     "status": "healthy",
     "service": "DevInquire Dashboard API",
     "version": "1.0.0",
     "timestamp": "2024-11-24T...",
     "firebase_configured": true
   }
   ```

2. **Auth Status:**
   ```
   https://api.yourdomain.com/api/auth/status
   ```

---

## 🔧 Update Frontend Configuration

After deployment, update your frontend to point to the correct API URL.

**In your React app's environment variables or config:**

```javascript
// Update API_BASE in your frontend config
const API_BASE = "https://api.yourdomain.com/api";
// OR
const API_BASE = "https://yourdomain.com/api";
```

**Rebuild frontend:**

```bash
npm run build
```

**Re-upload the `build/` folder.**

---

## 📝 Step-by-Step Upload Process

### Method 1: Using Hostinger File Manager

1. **Log in to Hostinger Control Panel**
2. **Go to File Manager**
3. **Navigate to `public_html`**

#### Upload Frontend:

4. **Create folder `dashboard`** (or use root)
5. **Upload all files from `build/` folder:**
   - Select all files in `build/`
   - Upload to `public_html/dashboard/`
6. **Upload `.htaccess`** for frontend

#### Upload Backend:

7. **Create folder `api`**
8. **Upload backend files:**
   - `index.php`
   - `.htaccess`
   - `.env`
   - `composer.json`
9. **Upload folders:**

   - `config/`
   - `controllers/`
   - `middleware/`
   - `vendor/` (entire folder - this is large, be patient)

10. **Set permissions:**
    - Folders: `755`
    - Files: `644`
    - `.env`: `600`

### Method 2: Using FTP (FileZilla, etc.)

1. **Connect to Hostinger via FTP**
2. **Navigate to `public_html`**

#### Upload Frontend:

3. **Create `dashboard` folder** (or use root)
4. **Upload all contents of `build/` folder**
5. **Upload `.htaccess`** for frontend

#### Upload Backend:

6. **Create `api` folder**
7. **Upload all backend files and folders**
8. **Set permissions via FTP client**

---

## 🐛 Common Issues & Solutions

### Issue: Frontend shows blank page

**Solutions:**

1. Check `.htaccess` is uploaded for frontend
2. Verify `index.html` exists
3. Check browser console for errors
4. Verify API URL in frontend config matches backend URL

### Issue: Backend returns 500 error

**Solutions:**

1. Check PHP version is 7.4+
2. Verify `vendor/` folder is completely uploaded
3. Check `.env` file has correct Firebase credentials
4. Check file permissions (755/644)
5. Check Hostinger error logs

### Issue: CORS errors

**Solutions:**

1. Verify backend `.htaccess` is uploaded
2. Check `Access-Control-Allow-Origin` in `index.php`
3. Update frontend API URL to match backend

### Issue: "Class not found" error

**Solutions:**

1. Verify `vendor/autoload.php` exists
2. Re-upload `vendor/` folder completely
3. Run `composer install --no-dev` locally and re-upload vendor

---

## 📊 File Size Estimates

- **Frontend build/**: ~500 KB - 2 MB (compressed)
- **Backend vendor/**: ~10-15 MB (largest folder)
- **Total upload**: ~15-20 MB

**Note:** `vendor/` folder upload may take a few minutes.

---

## ✅ Final Verification Checklist

### Frontend:

- [ ] `build/` folder contents uploaded
- [ ] `.htaccess` uploaded for frontend
- [ ] Dashboard loads in browser
- [ ] No console errors
- [ ] Firebase connection works

### Backend:

- [ ] All backend files uploaded
- [ ] `vendor/` folder completely uploaded
- [ ] `.env` file has real Firebase credentials
- [ ] `.htaccess` uploaded for backend
- [ ] PHP version set to 7.4+
- [ ] File permissions set correctly
- [ ] Health endpoint works: `/api/health`
- [ ] Auth status endpoint works: `/api/auth/status`

### Integration:

- [ ] Frontend API URL points to backend
- [ ] CORS working (no CORS errors)
- [ ] Authentication works end-to-end

---

## 🚀 Quick Upload Commands (If you have SSH access)

**Note:** Most Hostinger shared hosting doesn't have SSH, but if you do:

```bash
# Upload via SCP
scp -r build/* user@yourdomain.com:public_html/dashboard/
scp -r backend/* user@yourdomain.com:public_html/api/

# Set permissions
ssh user@yourdomain.com
chmod -R 755 public_html/api/
chmod -R 644 public_html/api/*.php
chmod 600 public_html/api/.env
```

---

## 📞 Support

If you encounter issues:

1. **Check Hostinger error logs** in control panel
2. **Verify all files uploaded correctly**
3. **Test endpoints individually**
4. **Check file permissions**
5. **Verify Firebase credentials in `.env`**

---

## 🎯 Summary

**What to Upload:**

1. **Frontend:** Everything from `build/` folder → `public_html/dashboard/`
2. **Backend:** All files from `backend/` folder → `public_html/api/`

**Key Points:**

- ✅ Build frontend first: `npm run build`
- ✅ Upload entire `vendor/` folder for backend
- ✅ Include `.htaccess` files for both
- ✅ Set correct file permissions
- ✅ Update frontend API URL after deployment

**Once both are uploaded and tested, your dashboard will be live!** 🎉



