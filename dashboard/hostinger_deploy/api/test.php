<?php
/**
 * Quick Backend Test Script
 * Run: php test.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🧪 Testing Backend Setup...\n\n";

$allTestsPass = true;

// Test 1: Autoloader
echo "1. Testing autoloader... ";
if (file_exists('vendor/autoload.php')) {
    require_once 'vendor/autoload.php';
    echo "✅ OK\n";
} else {
    echo "❌ FAILED - Run: composer install --no-dev\n";
    $allTestsPass = false;
}

// Test 2: Environment File
echo "2. Testing .env file... ";
if (file_exists('.env')) {
    $env = file('.env', FILE_IGNORE_NEW_LINES);
    $hasProjectId = false;
    $hasApiKey = false;
    foreach ($env as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, 'FIREBASE_PROJECT_ID=') === 0) {
            $value = substr($line, strlen('FIREBASE_PROJECT_ID='));
            if (!empty($value) && strpos($value, 'your-') === false) {
                $hasProjectId = true;
            }
        }
        if (strpos($line, 'FIREBASE_WEB_API_KEY=') === 0) {
            $value = substr($line, strlen('FIREBASE_WEB_API_KEY='));
            if (!empty($value) && strpos($value, 'your-') === false) {
                $hasApiKey = true;
            }
        }
    }
    if ($hasProjectId && $hasApiKey) {
        echo "✅ OK\n";
    } else {
        echo "❌ FAILED - Missing or has placeholder values\n";
        $allTestsPass = false;
    }
} else {
    echo "❌ FAILED - .env file not found\n";
    $allTestsPass = false;
}

// Test 3: Load .env first, then Firebase Config
echo "3. Testing Firebase config... ";
try {
    // Load .env file first (same as index.php does)
    if (file_exists('.env')) {
        $envFile = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($envFile as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $_ENV[trim($key)] = trim($value);
            }
        }
    }
    
    require_once 'config/firebase.php';
    $firebase = new FirebaseConfig();
    if ($firebase->isConfigured()) {
        echo "✅ OK\n";
    } else {
        echo "❌ FAILED - Not configured\n";
        $allTestsPass = false;
    }
} catch (Exception $e) {
    echo "❌ FAILED - Error: " . $e->getMessage() . "\n";
    $allTestsPass = false;
}

// Test 4: Controllers
echo "4. Testing controllers... ";
if (file_exists('controllers/AuthController.php')) {
    require_once 'controllers/AuthController.php';
    echo "✅ OK\n";
} else {
    echo "❌ FAILED - Missing\n";
    $allTestsPass = false;
}

// Test 5: Middleware
echo "5. Testing middleware... ";
if (file_exists('middleware/AuthMiddleware.php')) {
    require_once 'middleware/AuthMiddleware.php';
    echo "✅ OK\n";
} else {
    echo "❌ FAILED - Missing\n";
    $allTestsPass = false;
}

// Test 6: Main Index
echo "6. Testing index.php... ";
if (file_exists('index.php')) {
    echo "✅ OK\n";
} else {
    echo "❌ FAILED - Missing\n";
    $allTestsPass = false;
}

// Test 7: .htaccess
echo "7. Testing .htaccess... ";
if (file_exists('.htaccess')) {
    echo "✅ OK\n";
} else {
    echo "⚠️  WARNING - .htaccess not found (needed for Hostinger)\n";
}

// Test 8: PHP Version
echo "8. Testing PHP version... ";
$phpVersion = phpversion();
$majorVersion = (int)explode('.', $phpVersion)[0];
$minorVersion = (int)explode('.', $phpVersion)[1];
if ($majorVersion > 7 || ($majorVersion == 7 && $minorVersion >= 4)) {
    echo "✅ OK (PHP $phpVersion)\n";
} else {
    echo "❌ FAILED - PHP 7.4+ required (current: $phpVersion)\n";
    $allTestsPass = false;
}

echo "\n";
if ($allTestsPass) {
    echo "✅ All tests passed! Backend is ready.\n\n";
    echo "Next steps:\n";
    echo "1. Test locally: php -S localhost:8000 index.php\n";
    echo "2. Test endpoint: curl http://localhost:8000/api/health\n";
    echo "3. Upload to Hostinger following HOSTINGER_DEPLOYMENT.md\n";
} else {
    echo "❌ Some tests failed. Please fix the issues above.\n";
    exit(1);
}
?>

