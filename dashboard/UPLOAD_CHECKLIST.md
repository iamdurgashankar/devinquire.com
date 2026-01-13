# 📤 Upload Checklist - Exact Files to Upload

Use this checklist to ensure you upload everything correctly.

---

## 🎨 FRONTEND FILES (React Dashboard)

### Location: `dashboard/build/` folder

**Upload to:** `public_html/dashboard/` (or `public_html/` for root)

### Files to Upload:

```
✅ index.html
✅ manifest.json
✅ asset-manifest.json
✅ blog-sync-client.js (if exists)
✅ .htaccess (for SPA routing)
✅ static/
   ├── css/
   │   └── main.xxxxx.css
   ├── js/
   │   └── main.xxxxx.js
   └── media/ (if exists)
```

**How to get these files:**

1. Run: `npm run build` in `dashboard/` folder
2. Upload everything inside the `build/` folder

---

## 🔧 BACKEND FILES (PHP API)

### Location: `dashboard/backend/` folder

**Upload to:** `public_html/api/`

### Files to Upload:

#### Required Files:

```
✅ index.php
✅ .htaccess
✅ .env (with your Firebase credentials)
✅ composer.json
```

#### Required Folders:

```
✅ config/
   └── firebase.php

✅ controllers/
   └── AuthController.php

✅ middleware/
   └── AuthMiddleware.php

✅ vendor/ (ENTIRE FOLDER - Very Important!)
   ├── autoload.php
   ├── firebase/
   ├── guzzlehttp/
   └── ... (all subfolders)
```

**Important Notes:**

- ⚠️ `vendor/` folder is **large** (~10-15 MB) - upload may take time
- ⚠️ Upload **entire** `vendor/` folder, not just parts
- ⚠️ `.env` must have **real** Firebase credentials (not placeholders)

---

## 📋 Upload Order

### Step 1: Prepare Files Locally

```bash
# 1. Build frontend
cd dashboard
npm run build

# 2. Prepare backend (if not done)
cd backend
composer install --no-dev --optimize-autoloader
```

### Step 2: Upload Frontend First

1. Go to `dashboard/build/` folder
2. Select **ALL files and folders**
3. Upload to `public_html/dashboard/`
4. Upload `.htaccess` for frontend

### Step 3: Upload Backend

1. Go to `dashboard/backend/` folder
2. Upload files first:
   - `index.php`
   - `.htaccess`
   - `.env`
   - `composer.json`
3. Upload folders:
   - `config/`
   - `controllers/`
   - `middleware/`
4. Upload `vendor/` folder last (it's large)

### Step 4: Set Permissions

**Folders:** `755`
**Files:** `644`
**.env file:** `600`

---

## ✅ Verification After Upload

### Check Frontend:

- [ ] Visit: `https://yourdomain.com/dashboard`
- [ ] Page loads without errors
- [ ] No console errors in browser

### Check Backend:

- [ ] Visit: `https://yourdomain.com/api/health`
- [ ] Returns JSON: `{"status": "healthy", ...}`
- [ ] Visit: `https://yourdomain.com/api/auth/status`
- [ ] Returns JSON with `firebase_configured: true`

---

## 📊 File Sizes (Approximate)

- **Frontend build/**: 500 KB - 2 MB
- **Backend (without vendor/)**: 50 KB
- **Backend vendor/**: 10-15 MB ⚠️ (largest)
- **Total**: ~15-20 MB

**Upload time:** 5-10 minutes (depending on connection)

---

## 🚨 Common Mistakes to Avoid

❌ **Don't upload:**

- `node_modules/` folder (not needed)
- `.git/` folder (not needed)
- Source files (only upload `build/` for frontend)
- Development files

✅ **Do upload:**

- Everything from `build/` folder
- Complete `vendor/` folder for backend
- `.htaccess` files
- `.env` file with real credentials

---

## 📝 Quick Reference

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

**Follow this checklist and you'll have everything uploaded correctly!** ✅



