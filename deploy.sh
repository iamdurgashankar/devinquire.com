#!/bin/bash

# Hostinger Auto-Deployment Script
# This script will be executed by Hostinger when the webhook is triggered

echo "🚀 Starting deployment process..."

# Set error handling
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Installing dependencies...${NC}"

# Install main application dependencies
if [ -f "package.json" ]; then
    npm install --production
    echo -e "${GREEN}✅ Main dependencies installed${NC}"
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

# Install dashboard dependencies
if [ -d "dashboard" ] && [ -f "dashboard/package.json" ]; then
    cd dashboard
    npm install --production
    cd ..
    echo -e "${GREEN}✅ Dashboard dependencies installed${NC}"
fi

echo -e "${YELLOW}🔨 Building applications...${NC}"

# Build main application
npm run build
echo -e "${GREEN}✅ Main application built${NC}"

# Build dashboard if it exists
if [ -d "dashboard" ]; then
    cd dashboard
    npm run build
    cd ..
    echo -e "${GREEN}✅ Dashboard built${NC}"
fi

echo -e "${YELLOW}📁 Setting up file structure...${NC}"

# Create public_html structure if it doesn't exist
mkdir -p public_html
mkdir -p public_html/dashboard

# Copy built files to public_html
if [ -d "build" ]; then
    cp -r build/* public_html/
    echo -e "${GREEN}✅ Main app files copied to public_html${NC}"
fi

# Copy dashboard build to subdirectory
if [ -d "dashboard/build" ]; then
    cp -r dashboard/build/* public_html/dashboard/
    echo -e "${GREEN}✅ Dashboard files copied to public_html/dashboard${NC}"
fi

# Copy API files
if [ -d "api" ]; then
    cp -r api public_html/
    echo -e "${GREEN}✅ API files copied${NC}"
fi

# Set proper permissions
find public_html -type f -exec chmod 644 {} \;
find public_html -type d -exec chmod 755 {} \;
chmod 755 public_html/api/*.php

echo -e "${YELLOW}🔧 Setting up .htaccess files...${NC}"

# Create main .htaccess for React Router
cat > public_html/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Handle React Router - all requests go to index.html except API and dashboard
RewriteRule ^api/ - [L]
RewriteRule ^dashboard/ - [L]
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache control for static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
EOF

# Create dashboard .htaccess
cat > public_html/dashboard/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /dashboard/

# Handle React Router - all requests go to index.html
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /dashboard/index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"

# CORS headers for API calls to main domain
Header always set Access-Control-Allow-Origin "https://devinquire.com"
Header always set Access-Control-Allow-Credentials "true"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
EOF

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📋 Deployment Summary:${NC}"
echo -e "  • Main application: ${GREEN}✅ Deployed${NC}"
echo -e "  • Dashboard: ${GREEN}✅ Deployed${NC}"
echo -e "  • API: ${GREEN}✅ Deployed${NC}"
echo -e "  • .htaccess files: ${GREEN}✅ Configured${NC}"
echo -e "${YELLOW}🌐 Your website should now be live!${NC}"