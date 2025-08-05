#!/bin/bash

# Dashboard Setup Script
# This script helps set up and deploy the DevInquire Dashboard

echo "🚀 Setting up DevInquire Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking environment...${NC}"

# Check if we're in the dashboard directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the dashboard directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found package.json${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js is installed (${NODE_VERSION})${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install npm first.${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm is installed (${NPM_VERSION})${NC}"

echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${BLUE}Step 3: Building dashboard for production...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dashboard build completed successfully${NC}"
else
    echo -e "${RED}Error: Dashboard build failed${NC}"
    exit 1
fi

echo -e "${BLUE}Step 4: Checking build output...${NC}"
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    echo -e "${GREEN}✓ Build directory created (${BUILD_SIZE})${NC}"
else
    echo -e "${RED}Error: Build directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Dashboard setup completed successfully!${NC}"
echo -e "${BLUE}Build output is ready in the 'build' directory.${NC}"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Configure DNS to point dashboard.devinquire.com to your server"
echo -e "2. Set up subdomain in your hosting panel"
echo -e "3. Upload the contents of the 'build' folder to your dashboard subdomain directory"
echo -e "4. Test the dashboard at https://dashboard.devinquire.com"
echo -e ""
echo -e "${BLUE}For development:${NC}"
echo -e "• Run 'npm start' to start the development server"
echo -e "• Run 'npm run build' to create a production build"
echo -e ""
echo -e "${YELLOW}📖 For detailed instructions, see README.md${NC}"