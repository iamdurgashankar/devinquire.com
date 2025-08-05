#!/bin/bash

# Setup script for dashboard subdomain deployment
# This script helps automate the setup process

echo "🚀 Setting up dashboard subdomain deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking current configuration...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found package.json${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js is installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm is installed${NC}"

echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${BLUE}Step 3: Building dashboard for production...${NC}"
npm run build:dashboard

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dashboard build completed successfully${NC}"
else
    echo -e "${RED}Error: Dashboard build failed${NC}"
    exit 1
fi

echo -e "${BLUE}Step 4: Copying dashboard-specific .htaccess...${NC}"
cp public/.htaccess-dashboard build/.htaccess

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dashboard .htaccess copied${NC}"
else
    echo -e "${YELLOW}Warning: Could not copy dashboard .htaccess${NC}"
fi

echo -e "${GREEN}🎉 Dashboard subdomain setup completed!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Configure DNS to point dashboard.devinquire.com to your server"
echo -e "2. Set up subdomain in your hosting panel"
echo -e "3. Add HOSTINGER_DASHBOARD_DIR secret to GitHub repository"
echo -e "4. Upload the contents of the 'build' folder to your dashboard subdomain directory"
echo -e "5. Test the dashboard at https://dashboard.devinquire.com"

echo -e "${YELLOW}📖 For detailed instructions, see SUBDOMAIN_DEPLOYMENT_GUIDE.md${NC}"

echo -e "${BLUE}Build output is ready in the 'build' directory.${NC}"