#!/bin/bash

# DevInquire Dashboard Build Script
# This script ensures environment variables are properly loaded before building

echo "🔧 Loading environment variables..."

# Load environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📄 Loading .env.local..."
    # Export all variables from .env.local, filtering out comments and empty lines
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
else
    echo "⚠️  .env.local not found, falling back to .env..."
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | grep -v '^$' | xargs)
    else
        echo "❌ No environment files found!"
        exit 1
    fi
fi

# Verify critical environment variables are loaded
echo "🔍 Verifying environment variables..."
if [ -z "$REACT_APP_FIREBASE_API_KEY" ]; then
    echo "❌ REACT_APP_FIREBASE_API_KEY is not set!"
    echo "🔍 Debug: Checking .env.local content..."
    grep "REACT_APP_FIREBASE_API_KEY" .env.local || echo "Not found in .env.local"
    exit 1
fi

if [ -z "$REACT_APP_FIREBASE_PROJECT_ID" ]; then
    echo "❌ REACT_APP_FIREBASE_PROJECT_ID is not set!"
    exit 1
fi

echo "✅ Environment variables loaded successfully"
echo "🔑 API Key: ${REACT_APP_FIREBASE_API_KEY:0:10}..."
echo "📦 Project ID: $REACT_APP_FIREBASE_PROJECT_ID"

# Run the build
echo "🚀 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Verify environment variables are embedded in the build
    echo "🔍 Verifying build contains environment variables..."
    if grep -q "$REACT_APP_FIREBASE_API_KEY" build/static/js/main.*.js; then
        echo "✅ Environment variables successfully embedded in build"
    else
        echo "❌ Environment variables not found in build!"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi