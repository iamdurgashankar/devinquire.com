#!/bin/bash

# Script to prepare dashboard for Hostinger upload
# Run: bash PREPARE_FOR_UPLOAD.sh

echo "🚀 Preparing Dashboard for Hostinger Upload..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the dashboard directory"
    exit 1
fi

# Step 1: Build Frontend
echo "📦 Step 1: Building frontend..."
if [ ! -d "build" ] || [ -z "$(ls -A build 2>/dev/null)" ]; then
    echo "   Building React app..."
    npm run build
    if [ $? -eq 0 ]; then
        echo "   ✅ Frontend build complete"
    else
        echo "   ❌ Build failed"
        exit 1
    fi
else
    echo "   ✅ Build folder already exists"
fi

# Step 2: Prepare Backend
echo ""
echo "🔧 Step 2: Preparing backend..."
cd backend

# Check if vendor exists
if [ ! -d "vendor" ] || [ ! -f "vendor/autoload.php" ]; then
    echo "   Installing backend dependencies..."
    composer install --no-dev --optimize-autoloader
    if [ $? -eq 0 ]; then
        echo "   ✅ Backend dependencies installed"
    else
        echo "   ❌ Composer install failed"
        exit 1
    fi
else
    echo "   ✅ Vendor folder exists"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "   ⚠️  .env file not found"
    echo "   Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "   ⚠️  Please edit .env with your Firebase credentials!"
    fi
else
    # Check if .env has placeholder values
    if grep -q "your-project-id\|your-firebase" .env 2>/dev/null; then
        echo "   ⚠️  .env file has placeholder values!"
        echo "   Please edit .env with your real Firebase credentials!"
    else
        echo "   ✅ .env file configured"
    fi
fi

cd ..

# Step 3: Show file sizes
echo ""
echo "📊 File Sizes:"
echo "   Frontend (build/): $(du -sh build/ 2>/dev/null | cut -f1)"
echo "   Backend (backend/): $(du -sh backend/ 2>/dev/null | cut -f1)"
echo "   Backend vendor/: $(du -sh backend/vendor/ 2>/dev/null | cut -f1)"

# Step 4: Create summary
echo ""
echo "✅ Preparation Complete!"
echo ""
echo "📤 Ready to Upload:"
echo ""
echo "FRONTEND:"
echo "   Source: build/*"
echo "   Upload to: public_html/dashboard/"
echo "   Files: index.html, manifest.json, static/, .htaccess"
echo ""
echo "BACKEND:"
echo "   Source: backend/*"
echo "   Upload to: public_html/api/"
echo "   Files: index.php, .htaccess, .env, config/, controllers/, middleware/, vendor/"
echo ""
echo "📚 See HOSTINGER_UPLOAD_GUIDE.md for detailed instructions"
echo ""




