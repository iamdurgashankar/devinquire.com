#!/bin/bash

# Test script to verify Hostinger webhook configuration
# This script tests the webhook URL and simulates a GitHub push event

echo "🧪 Testing Hostinger Webhook Configuration"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Webhook URL
WEBHOOK_URL="https://webhooks.hostinger.com/deploy/6a336b05bd6b1e6e2060ee80c41c2c01"

echo -e "${BLUE}🔗 Webhook URL: ${WEBHOOK_URL}${NC}"
echo ""

# Test 1: Check if webhook URL is accessible
echo -e "${YELLOW}Test 1: Checking webhook URL accessibility...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL")

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 405 ]; then
    echo -e "${GREEN}✅ Webhook URL is accessible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Webhook URL returned HTTP $HTTP_STATUS${NC}"
fi

echo ""

# Test 2: Simulate GitHub webhook payload
echo -e "${YELLOW}Test 2: Simulating GitHub webhook payload...${NC}"

# Create a test payload similar to what GitHub sends
TEST_PAYLOAD='{
  "ref": "refs/heads/main",
  "repository": {
    "name": "devinquire.com",
    "full_name": "iamdurgashankar/devinquire.com",
    "html_url": "https://github.com/iamdurgashankar/devinquire.com"
  },
  "head_commit": {
    "id": "test123456789",
    "message": "Test deployment webhook",
    "author": {
      "name": "Test User",
      "email": "test@example.com"
    }
  },
  "pusher": {
    "name": "test-user"
  }
}'

# Send test payload
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "User-Agent: GitHub-Hookshot/test" \
  -d "$TEST_PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}")

# Extract HTTP status from response
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 202 ]; then
    echo -e "${GREEN}✅ Webhook accepted the payload (HTTP $HTTP_STATUS)${NC}"
    if [ ! -z "$RESPONSE_BODY" ]; then
        echo -e "${BLUE}📝 Response: $RESPONSE_BODY${NC}"
    fi
else
    echo -e "${RED}❌ Webhook rejected the payload (HTTP $HTTP_STATUS)${NC}"
    if [ ! -z "$RESPONSE_BODY" ]; then
        echo -e "${RED}📝 Error response: $RESPONSE_BODY${NC}"
    fi
fi

echo ""

# Test 3: Check GitHub repository webhook configuration
echo -e "${YELLOW}Test 3: GitHub repository information...${NC}"
echo -e "${BLUE}📁 Repository: https://github.com/iamdurgashankar/devinquire.com${NC}"
echo -e "${BLUE}⚙️  Webhook Setup: https://github.com/iamdurgashankar/devinquire.com/settings/hooks/new${NC}"
echo -e "${BLUE}🔧 Actions: https://github.com/iamdurgashankar/devinquire.com/actions${NC}"

echo ""

# Test 4: Verify local deployment script
echo -e "${YELLOW}Test 4: Checking local deployment script...${NC}"
if [ -f "deploy.sh" ]; then
    if [ -x "deploy.sh" ]; then
        echo -e "${GREEN}✅ deploy.sh exists and is executable${NC}"
    else
        echo -e "${YELLOW}⚠️  deploy.sh exists but is not executable${NC}"
        echo -e "${BLUE}💡 Run: chmod +x deploy.sh${NC}"
    fi
else
    echo -e "${RED}❌ deploy.sh not found${NC}"
fi

echo ""

# Test 5: Check GitHub Actions workflow
echo -e "${YELLOW}Test 5: Checking GitHub Actions workflow...${NC}"
if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}✅ GitHub Actions workflow file exists${NC}"
    echo -e "${BLUE}📄 File: .github/workflows/deploy.yml${NC}"
else
    echo -e "${RED}❌ GitHub Actions workflow file not found${NC}"
fi

echo ""
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}🎉 Webhook testing completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Commit and push these changes to trigger deployment"
echo -e "2. Check GitHub Actions tab for workflow execution"
echo -e "3. Monitor Hostinger for deployment status"
echo -e "4. Verify your website at https://devinquire.com"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo -e "• GitHub Webhooks: https://github.com/iamdurgashankar/devinquire.com/settings/hooks"
echo -e "• GitHub Actions: https://github.com/iamdurgashankar/devinquire.com/actions"
echo -e "• Deployment Guide: ./DEPLOYMENT.md"
echo ""