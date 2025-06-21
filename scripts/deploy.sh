#!/bin/bash

# Devinquire Deployment Script
# This script helps with manual deployment if needed

set -e

echo "🚀 Starting Devinquire deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Build frontend
print_status "Building frontend..."
npm install
npm run build

if [ $? -eq 0 ]; then
    print_status "Frontend build successful!"
else
    print_error "Frontend build failed!"
    exit 1
fi

# Build backend
print_status "Building backend..."
cd backend
npm install

if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed successfully!"
else
    print_error "Backend dependency installation failed!"
    exit 1
fi

cd ..

print_status "Deployment preparation complete!"
print_warning "This script only prepares the build. For actual deployment:"
echo "1. Push your code to GitHub"
echo "2. Set up GitHub Actions secrets"
echo "3. Configure your hosting platforms"
echo "4. Follow the DEPLOYMENT_GUIDE.md for detailed instructions"

echo ""
print_status "Ready for deployment! 🎉" 