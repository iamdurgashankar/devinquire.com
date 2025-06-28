@echo off
echo 🚀 Starting DevInquire Development Environment...

REM Check if PHP is installed
php --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PHP is not installed. Please install PHP first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed!

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo 🌐 Starting PHP API server on http://localhost:8000...
start "PHP Server" php -S localhost:8000 -t api

REM Wait a moment for PHP server to start
timeout /t 2 /nobreak >nul

echo ⚛️ Starting React development server on http://localhost:3000...
start "React Server" npm start

echo.
echo 🎉 Development environment is ready!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 API: http://localhost:8000
echo.
echo Default admin credentials:
echo Email: admin@devinquire.com
echo Password: admin123
echo.
echo Press any key to close this window...
pause >nul 