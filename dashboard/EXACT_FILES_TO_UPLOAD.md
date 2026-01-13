# 📤 EXACT FILES TO UPLOAD TO HOSTINGER

## 🎯 Quick Answer

### Frontend (React Dashboard):
**Upload everything from:** `dashboard/build/` folder  
**To:** `public_html/dashboard/` on Hostinger

### Backend (PHP API):
**Upload everything from:** `dashboard/backend/` folder  
**To:** `public_html/api/` on Hostinger

---

## 📋 Detailed File List

### ✅ FRONTEND FILES (Upload to `public_html/dashboard/`)

**From:** `dashboard/build/` folder

```
✅ index.html
✅ manifest.json
✅ asset-manifest.json
✅ blog-sync-client.js
✅ static/
   ├── css/
   │   └── main.xxxxx.css
   ├── js/
   │   └── main.xxxxx.js
   └── media/ (if exists)
✅ .htaccess (create this - see HOSTINGER_UPLOAD_GUIDE.md)
```

**Total Size:** ~1.8 MB

---

### ✅ BACKEND FILES (Upload to `public_html/api/`)

**From:** `dashboard/backend/` folder

#### Files:
```
✅ index.php
✅ .htaccess
✅ .env (with your Firebase credentials)
✅ composer.json
```

#### Folders (upload entire folders):
```
✅ config/
   └── firebase.php

✅ controllers/
   └── AuthController.php

✅ middleware/
   └── AuthMiddleware.php

✅ vendor/  ⚠️ IMPORTANT - Upload entire folder (~9.4 MB)
   ├── autoload.php
   ├── firebase/
   ├── guzzlehttp/
   └── ... (all subfolders)
```

**Total Size:** ~10 MB (vendor folder is 9.4 MB)

---

## 🚀 Step-by-Step Upload Instructions

### Step 1: Prepare Files (Do this first!)

```bash
# Run this script to prepare everything
cd dashboard
bash PREPARE_FOR_UPLOAD.sh
```

Or manually:
```bash
# Build frontend
npm run build

# Prepare backend
cd backend
composer install --no-dev --optimize-autoloader
cd ..
```

### Step 2: Upload Frontend

1. **Open Hostinger File Manager**
2. **Navigate to** `public_html`
3. **Create folder** `dashboard` (or use root)
4. **Go to** `dashboard/build/` on your computer
5. **Select ALL files and folders** inside `build/`
6. **Upload** to `public_html/dashboard/`
7. **Create `.htaccess`** file (copy from HOSTINGER_UPLOAD_GUIDE.md)

### Step 3: Upload Backend

1. **In Hostinger File Manager**, navigate to `public_html`
2. **Create folder** `api`
3. **Go to** `dashboard/backend/` on your computer
4. **Upload files first:**
   - `index.php`
   - `.htaccess`
   - `.env`
   - `composer.json`
5. **Upload folders:**
   - `config/`
   - `controllers/`
   - `middleware/`
   - `vendor/` ⚠️ (This is large - 9.4 MB - be patient!)

### Step 4: Set Permissions

**In Hostinger File Manager:**
- **Folders:** Right-click → Permissions → `755`
- **Files:** Right-click → Permissions → `644`
- **`.env` file:** Right-click → Permissions → `600`

### Step 5: Configure Hostinger

1. **Set PHP Version:**
   - Control Panel → PHP Configuration
   - Select **PHP 7.4 or higher**

2. **Test:**
   - Frontend: `https://yourdomain.com/dashboard`
   - Backend: `https://yourdomain.com/api/health`

---

## 📊 File Size Summary

| Component | Size | Location |
|-----------|------|----------|
| Frontend build/ | ~1.8 MB | `dashboard/build/` |
| Backend vendor/ | ~9.4 MB | `dashboard/backend/vendor/` |
| Backend other | ~50 KB | `dashboard/backend/` |
| **Total** | **~11 MB** | |

---

## ✅ Upload Checklist

### Frontend:
- [ ] `build/` folder contents uploaded
- [ ] `.htaccess` created for frontend
- [ ] All files in `static/` folder uploaded

### Backend:
- [ ] `index.php` uploaded
- [ ] `.htaccess` uploaded
- [ ] `.env` uploaded (with real Firebase credentials)
- [ ] `composer.json` uploaded
- [ ] `config/` folder uploaded
- [ ] `controllers/` folder uploaded
- [ ] `middleware/` folder uploaded
- [ ] `vendor/` folder uploaded (entire folder!)
- [ ] File permissions set (755/644/600)

---

## 🎯 Quick Reference

**Frontend Upload:**
```
Source: dashboard/build/*
Destination: public_html/dashboard/
```

**Backend Upload:**
```
Source: dashboard/backend/*
Destination: public_html/api/
```

---

## 📚 More Help

- **Detailed Guide:** See `HOSTINGER_COMPLETE_DEPLOYMENT.md`
- **Upload Checklist:** See `UPLOAD_CHECKLIST.md`
- **Quick Guide:** See `HOSTINGER_UPLOAD_GUIDE.md`

---

**That's it! Upload these files and your dashboard will be live!** 🚀




