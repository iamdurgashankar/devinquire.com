#!/bin/bash

# Hostinger Manual Deployment Script
# This script helps with manual deployment to Hostinger

set -e

echo "🚀 Starting Hostinger deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if FTP credentials are provided
if [ -z "$HOSTINGER_FTP_SERVER" ] || [ -z "$HOSTINGER_FTP_USERNAME" ] || [ -z "$HOSTINGER_FTP_PASSWORD" ]; then
    print_error "FTP credentials not found. Please set these environment variables:"
    echo "HOSTINGER_FTP_SERVER=your-ftp-server.com"
    echo "HOSTINGER_FTP_USERNAME=your-ftp-username"
    echo "HOSTINGER_FTP_PASSWORD=your-ftp-password"
    echo ""
    print_warning "You can also create a .env file with these variables"
    exit 1
fi

# Step 1: Build frontend
print_step "1. Building frontend..."
npm install
npm run build

if [ $? -eq 0 ]; then
    print_status "Frontend build successful!"
else
    print_error "Frontend build failed!"
    exit 1
fi

# Step 2: Install backend dependencies
print_step "2. Installing backend dependencies..."
cd backend
npm install

if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed successfully!"
else
    print_error "Backend dependency installation failed!"
    exit 1
fi

cd ..

# Step 3: Create deployment package
print_step "3. Creating deployment package..."
rm -rf deployment
mkdir -p deployment

# Copy frontend build
cp -r build/* deployment/

# Copy backend files
mkdir -p deployment/backend
cp -r backend/* deployment/backend/

# Copy configuration files
cp package.json deployment/
cp package-lock.json deployment/
cp README.md deployment/

# Create .htaccess for React Router
cat > deployment/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
EOF

print_status "Deployment package created!"

# Step 4: Upload to Hostinger
print_step "4. Uploading to Hostinger..."

# Check if lftp is available
if command -v lftp &> /dev/null; then
    print_status "Using lftp for upload..."
    
    # Create lftp script
    cat > upload.lftp << EOF
set ssl:verify-certificate no
open -u $HOSTINGER_FTP_USERNAME,$HOSTINGER_FTP_PASSWORD $HOSTINGER_FTP_SERVER
mirror --reverse --delete --verbose deployment/ /public_html/
bye
EOF
    
    lftp -f upload.lftp
    
    # Clean up
    rm upload.lftp
    
elif command -v curl &> /dev/null; then
    print_warning "lftp not found, using curl (slower)..."
    
    # Upload files using curl
    for file in $(find deployment -type f); do
        remote_path=$(echo $file | sed 's|deployment/|/public_html/|')
        print_status "Uploading: $file"
        curl -T "$file" "ftp://$HOSTINGER_FTP_SERVER$remote_path" --user "$HOSTINGER_FTP_USERNAME:$HOSTINGER_FTP_PASSWORD"
    done
    
else
    print_error "Neither lftp nor curl found. Please install lftp for faster uploads:"
    echo "macOS: brew install lftp"
    echo "Ubuntu: sudo apt-get install lftp"
    echo "Windows: Download from http://lftp.yar.ru/"
    exit 1
fi

# Step 5: Cleanup
print_step "5. Cleaning up..."
rm -rf deployment

print_status "Deployment completed successfully!"
print_warning "Your site should be live at devinquire.com"
print_warning "Note: DNS changes may take up to 24 hours to propagate"

echo ""
print_status "🎉 Deployment finished! Check your site at devinquire.com" 