#!/bin/bash

# Define directories
DIST_DIR="hostinger_deploy"
API_DIR="$DIST_DIR/api"

echo "🚀 Preparing deployment for Hostinger Shared Hosting..."

# 1. Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf $DIST_DIR
mkdir -p $API_DIR

# 2. Build React Frontend
echo "🏗️  Building React Frontend..."
# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    npm install
fi
# Build project
npm run build

# 3. Copy Frontend to root of deploy folder
echo "📂 Copying Frontend files..."
cp -r build/* $DIST_DIR/
cp public/.htaccess $DIST_DIR/

# 4. Prepare PHP Backend
echo "🐘 Preparing PHP Backend..."

# Copy backend files excluding sensitive/unnecessary ones
rsync -av --progress backend/ $API_DIR/ --exclude 'vendor' --exclude '.env' --exclude '.git' --exclude 'composer.lock'

# Copy vendor directory separately (if it exists) or run composer install if you can
if [ -d "backend/vendor" ]; then
    echo "📦 Copying vendor dependencies..."
    cp -r backend/vendor $API_DIR/
else
    echo "⚠️  Vendor directory not found! You must run 'composer install' in the backend directory before deploying."
fi

# 5. Create a placeholder .env file
echo "📝 Creating configuration templates..."
cp backend/.env.example $API_DIR/.env
echo "# Hostinger Production Config" > $API_DIR/.env
echo "FIREBASE_PROJECT_ID=your-project-id" >> $API_DIR/.env
echo "FIREBASE_WEB_API_KEY=your-api-key" >> $API_DIR/.env

echo "✅ Deployment package ready in '$DIST_DIR' directory!"
echo "---------------------------------------------------"
echo "👉 Upload contents of '$DIST_DIR' to 'public_html' on Hostinger."
echo "👉 IMPORTANT: Edit '$API_DIR/.env' with your actual Firebase credentials."
