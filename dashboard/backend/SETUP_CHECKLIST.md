# ✅ Complete Setup Checklist - Make Backend Work Perfectly

Follow these steps in order to ensure your backend works perfectly.

## 📋 Step-by-Step Setup

### Step 1: Verify Dependencies ✅

**Check if Composer dependencies are installed:**

```bash
cd backend
ls -la vendor/autoload.php
```

**If vendor folder is missing or incomplete:**

```bash
# Install production dependencies only
composer install --no-dev --optimize-autoloader
```

**Expected result:** You should see `vendor/autoload.php` file exists.

---

### Step 2: Configure Environment Variables ✅

**Check your .env file:**

```bash
cat .env
```

**Required variables:**
```env
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_WEB_API_KEY=your-actual-firebase-api-key
```

**If .env is missing or has placeholder values:**

1. Copy the example:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace with your actual Firebase credentials:
   - Get `FIREBASE_PROJECT_ID` from Firebase Console → Project Settings → General
   - Get `FIREBASE_WEB_API_KEY` from Firebase Console → Project Settings → General → Your apps → Web app

3. **Important:** Remove any quotes around values in .env file

**Example of correct .env:**
```env
FIREBASE_PROJECT_ID=devinquirecom
FIREBASE_WEB_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### Step 3: Verify File Structure ✅

**Check all required files exist:**

```bash
ls -la
```

**Required files:**
- ✅ `index.php` - Main entry point
- ✅ `.htaccess` - Apache configuration
- ✅ `.env` - Environment variables (with real values)
- ✅ `composer.json` - Dependencies
- ✅ `config/firebase.php` - Firebase config
- ✅ `controllers/AuthController.php` - Auth controller
- ✅ `middleware/AuthMiddleware.php` - Auth middleware
- ✅ `vendor/autoload.php` - Composer autoloader

---

### Step 4: Test Locally (Before Deployment) ✅

**Start local PHP server:**

```bash
php -S localhost:8000 index.php
```

**Test endpoints in another terminal or browser:**

1. **Health Check:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   
   **Expected response:**
   ```json
   {
     "status": "healthy",
     "service": "DevInquire Dashboard API",
     "version": "1.0.0",
     "timestamp": "2024-11-24T22:00:00+00:00",
     "firebase_configured": true
   }
   ```

2. **Auth Status:**
   ```bash
   curl http://localhost:8000/api/auth/status
   ```
   
   **Expected response:**
   ```json
   {
     "firebase_configured": true,
     "server_time": "2024-11-24T22:00:00+00:00",
     "auth_methods": {
       "firebase_id_token": true
     }
   }
   ```

**If you get errors:**
- Check PHP version: `php -v` (needs 7.4+)
- Check if vendor folder exists: `ls vendor/autoload.php`
- Check .env file has correct values
- Check error logs

---

### Step 5: Fix Common Issues ✅

#### Issue: "Class not found" or "vendor/autoload.php not found"

**Solution:**
```bash
composer install --no-dev --optimize-autoloader
```

#### Issue: "Firebase configuration error"

**Solution:**
1. Check `.env` file exists and has correct values
2. Verify no quotes around values in .env
3. Check Firebase Project ID is correct
4. Test: `php -r "require 'vendor/autoload.php'; echo 'OK';"`

#### Issue: "500 Internal Server Error"

**Solution:**
1. Enable error display temporarily in `index.php`:
   ```php
   ini_set('display_errors', 1);
   ```
2. Check PHP error logs
3. Verify all files are uploaded correctly
4. Check file permissions (755 for folders, 644 for files)

#### Issue: "CORS errors"

**Solution:**
- Check `.htaccess` file is uploaded
- Verify `Access-Control-Allow-Origin` header in `index.php`
- Test OPTIONS request: `curl -X OPTIONS http://localhost:8000/api/health`

---

### Step 6: Prepare for Hostinger Deployment ✅

**Before uploading to Hostinger:**

1. **Install production dependencies:**
   ```bash
   composer install --no-dev --optimize-autoloader
   ```

2. **Verify .env file:**
   ```bash
   cat .env
   # Make sure it has real Firebase credentials, not placeholders
   ```

3. **Test locally one more time:**
   ```bash
   php -S localhost:8000 index.php
   # Test all endpoints
   ```

4. **Create logs directory (if needed):**
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

---

### Step 7: Upload to Hostinger ✅

**Files to upload:**
```
backend/
├── index.php
├── .htaccess
├── .env                    ← Make sure this has real values!
├── composer.json
├── config/
│   └── firebase.php
├── controllers/
│   └── AuthController.php
├── middleware/
│   └── AuthMiddleware.php
└── vendor/                 ← Upload entire vendor folder
    └── (all files)
```

**Important:**
- Upload `.env` file with your actual Firebase credentials
- Upload entire `vendor/` folder
- Set file permissions: folders 755, files 644
- Ensure `.htaccess` is uploaded

---

### Step 8: Configure Hostinger ✅

1. **Set PHP Version:**
   - Go to Hostinger Control Panel
   - PHP Configuration → Set to PHP 7.4 or higher (8.0+ recommended)

2. **Check File Permissions:**
   - Folders: `755`
   - Files: `644`
   - `.env`: `600` (most secure)

3. **Test on Hostinger:**
   ```
   https://yourdomain.com/api/health
   ```

---

### Step 9: Verify Everything Works ✅

**Test all endpoints:**

1. **Health Check:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

2. **Auth Status:**
   ```bash
   curl https://yourdomain.com/api/auth/status
   ```

3. **Token Verification (with real token):**
   ```bash
   curl -X POST https://yourdomain.com/api/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"idToken":"your-firebase-id-token"}'
   ```

**All should return JSON responses without errors.**

---

## 🔍 Quick Verification Commands

Run these to check everything:

```bash
# 1. Check PHP version
php -v

# 2. Check composer dependencies
composer show

# 3. Check .env file
cat .env | grep FIREBASE

# 4. Check file structure
ls -la
ls -la config/
ls -la controllers/
ls -la middleware/
ls -la vendor/autoload.php

# 5. Test locally
php -S localhost:8000 index.php
# Then in another terminal:
curl http://localhost:8000/api/health
```

---

## ✅ Final Checklist

Before considering it "working perfectly", verify:

- [ ] Composer dependencies installed (`vendor/autoload.php` exists)
- [ ] `.env` file has real Firebase credentials (not placeholders)
- [ ] All PHP files are present (index.php, config, controllers, middleware)
- [ ] `.htaccess` file is present
- [ ] Local test works (`php -S localhost:8000`)
- [ ] Health endpoint returns success
- [ ] Auth status endpoint returns success
- [ ] No PHP errors in logs
- [ ] CORS headers working (if testing from browser)
- [ ] File permissions correct (755/644)

---

## 🆘 Still Having Issues?

1. **Check PHP Error Logs:**
   - Local: Check terminal output
   - Hostinger: Check error logs in control panel

2. **Enable Debug Mode:**
   In `index.php`, temporarily change:
   ```php
   ini_set('display_errors', 1);
   error_reporting(E_ALL);
   ```

3. **Test Each Component:**
   ```php
   // Test autoloader
   require_once 'vendor/autoload.php';
   echo "Autoloader OK\n";
   
   // Test Firebase config
   require_once 'config/firebase.php';
   $firebase = new FirebaseConfig();
   echo "Firebase config OK\n";
   ```

4. **Verify Firebase Credentials:**
   - Double-check Project ID matches Firebase Console
   - Verify API Key is correct
   - Test Firebase project is active

---

## 📞 Quick Test Script

Create `test.php` in backend directory:

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing Backend Setup...\n\n";

// Test 1: Autoloader
echo "1. Testing autoloader... ";
require_once 'vendor/autoload.php';
echo "✅ OK\n";

// Test 2: Environment
echo "2. Testing .env file... ";
if (file_exists('.env')) {
    $env = file('.env', FILE_IGNORE_NEW_LINES);
    $hasProjectId = false;
    $hasApiKey = false;
    foreach ($env as $line) {
        if (strpos($line, 'FIREBASE_PROJECT_ID=') === 0 && !strpos($line, 'your-')) {
            $hasProjectId = true;
        }
        if (strpos($line, 'FIREBASE_WEB_API_KEY=') === 0 && !strpos($line, 'your-')) {
            $hasApiKey = true;
        }
    }
    if ($hasProjectId && $hasApiKey) {
        echo "✅ OK\n";
    } else {
        echo "❌ Missing or has placeholder values\n";
    }
} else {
    echo "❌ .env file not found\n";
}

// Test 3: Firebase Config
echo "3. Testing Firebase config... ";
try {
    require_once 'config/firebase.php';
    $firebase = new FirebaseConfig();
    if ($firebase->isConfigured()) {
        echo "✅ OK\n";
    } else {
        echo "❌ Not configured\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

// Test 4: Controllers
echo "4. Testing controllers... ";
if (file_exists('controllers/AuthController.php')) {
    echo "✅ OK\n";
} else {
    echo "❌ Missing\n";
}

// Test 5: Middleware
echo "5. Testing middleware... ";
if (file_exists('middleware/AuthMiddleware.php')) {
    echo "✅ OK\n";
} else {
    echo "❌ Missing\n";
}

echo "\n✅ Setup check complete!\n";
?>
```

Run it:
```bash
php test.php
```

---

**Once all checks pass, your backend is ready to work perfectly!** 🎉

