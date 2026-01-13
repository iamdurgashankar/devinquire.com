# 🚀 START HERE - Upload Dashboard to Hostinger

## 📋 What You Need to Do (Simple Steps)

### Step 1: Prepare Files (2 minutes)

Run this command:
```bash
cd dashboard
bash PREPARE_FOR_UPLOAD.sh
```

This will:
- ✅ Build the frontend
- ✅ Prepare the backend
- ✅ Show you what to upload

---

### Step 2: Upload to Hostinger (10 minutes)

#### 📱 Frontend (React Dashboard)

**What to upload:**
- Everything inside `dashboard/build/` folder

**Where to upload:**
- `public_html/dashboard/` on Hostinger

**Files:**
```
build/
├── index.html
├── manifest.json
├── asset-manifest.json
├── blog-sync-client.js
└── static/ (entire folder)
```

**Size:** ~1.8 MB

---

#### 🔧 Backend (PHP API)

**What to upload:**
- Everything inside `dashboard/backend/` folder

**Where to upload:**
- `public_html/api/` on Hostinger

**Files:**
```
backend/
├── index.php
├── .htaccess
├── .env (with Firebase credentials)
├── composer.json
├── config/ (entire folder)
├── controllers/ (entire folder)
├── middleware/ (entire folder)
└── vendor/ (entire folder - 9.4 MB) ⚠️
```

**Size:** ~10 MB

---

### Step 3: Configure Hostinger (2 minutes)

1. **Set PHP Version:**
   - Control Panel → PHP Configuration → PHP 7.4+

2. **Set Permissions:**
   - Folders: `755`
   - Files: `644`
   - `.env`: `600`

---

### Step 4: Test (1 minute)

**Frontend:**
```
https://yourdomain.com/dashboard
```

**Backend:**
```
https://yourdomain.com/api/health
```

---

## 📚 Detailed Guides

- **`EXACT_FILES_TO_UPLOAD.md`** - Exact file list
- **`HOSTINGER_UPLOAD_GUIDE.md`** - Simple upload guide
- **`HOSTINGER_COMPLETE_DEPLOYMENT.md`** - Complete guide
- **`UPLOAD_CHECKLIST.md`** - Checklist

---

## ✅ Quick Checklist

- [ ] Run `bash PREPARE_FOR_UPLOAD.sh`
- [ ] Upload `build/*` to `public_html/dashboard/`
- [ ] Upload `backend/*` to `public_html/api/`
- [ ] Set PHP version to 7.4+
- [ ] Set file permissions
- [ ] Test both frontend and backend

---

**That's it! Follow these steps and your dashboard will be live!** 🎉




