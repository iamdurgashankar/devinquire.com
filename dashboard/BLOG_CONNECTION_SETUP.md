# Blog Management System - Connection Setup Guide

## Overview

This guide explains how to connect your dashboard blog management system with your devinquire.com blog section to fetch and display blog posts by category.

## Current Architecture

1. **Dashboard (dashboard.devinquire.com)**: 
   - Uses Firebase Firestore to store blog posts in the `posts` collection
   - BlogManager component creates/edits posts
   - Posts are stored with fields: `title`, `content`, `excerpt`, `category`, `tags`, `status`, `isPublic`, etc.

2. **Main Site (devinquire.com)**:
   - Uses `blogApiService.js` to fetch posts
   - Tries to connect to `https://dashboard.devinquire.com/blogmanager` first
   - Falls back to local PHP API if dashboard is unavailable

## Issues Found & Fixed

### ✅ Fixed Issues:

1. **Collection Name**: Updated `blogPublicApi.js` to use `posts` collection (matches contentService)
2. **Missing `isPublic` Field**: Updated `contentService.js` to automatically set `isPublic: true` when status is `published`
3. **Field Mapping**: Updated API to handle both field name formats (`featuredImage`/`featured_image`, etc.)
4. **Timestamp Conversion**: Added proper timestamp conversion for Firestore timestamps

## What You Need to Do

### Step 1: Deploy Firebase Functions

I've already added the blog API endpoints to your Firebase Functions (`dashboard/firebase/functions/src/index.ts`). You just need to deploy them:

1. **Navigate to Firebase Functions directory**:
```bash
cd dashboard/firebase/functions
```

2. **Install dependencies** (if not already done):
```bash
npm install
```

3. **Build TypeScript**:
```bash
npm run build
```

4. **Deploy the functions**:
```bash
firebase deploy --only functions:api
```

5. **Get your Firebase Function URL**:
After deployment, you'll get a URL like:
```
https://YOUR-REGION-YOUR-PROJECT-ID.cloudfunctions.net/api
```

The blog API will be available at:
```
https://YOUR-REGION-YOUR-PROJECT-ID.cloudfunctions.net/api/blogmanager/api/blog/posts
```

### Step 2: Update devinquire.com Configuration

Once deployed, update `devinquire.com/src/config.js` to point to your Firebase Function URL:

**Option A: Direct Firebase Functions URL** (Recommended for testing):
```javascript
const BLOG_API_CONFIG = {
  baseUrl: 'https://YOUR-REGION-YOUR-PROJECT-ID.cloudfunctions.net/api/blogmanager',
  apiKey: '2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271'
};
```

**Option B: Custom Domain** (For production):
1. Set up a custom domain in Firebase Functions
2. Point `dashboard.devinquire.com` to your Firebase Function
3. Keep the existing config as is

### Step 3: Configure API Key

1. **Generate/Get API Key**:
   - The API key is already in `devinquire.com/src/config.js`: `2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271`
   - Ensure this key is registered in your `blogApiKeyService` in the dashboard

2. **Verify API Key Registration**:
   - Check `dashboard/src/services/blogApiKeyService.js`
   - Ensure the API key allows read access for `devinquire.com` domain

### Step 4: Ensure Posts Have Required Fields

When creating/editing posts in BlogManager, ensure:

1. **Status is set to "published"** when you want it visible on devinquire.com
2. **Category is set** - This is used for category-wise filtering
3. **Posts automatically get `isPublic: true`** when status is `published` (already fixed in code)

### Step 5: Test the Connection

1. **Test API Endpoint** (replace with your actual endpoint):
```bash
curl -X GET "https://dashboard.devinquire.com/blogmanager/api/blog/posts?status=published&limit=10" \
  -H "X-API-Key: 2fbe97e6809d5312f88de5926050926a4b8b8b31fa7776927969eac2386d1271"
```

2. **Test Category Filter**:
```bash
curl -X GET "https://dashboard.devinquire.com/blogmanager/api/blog/posts?category=Web%20Development&status=published" \
  -H "X-API-Key: YOUR_API_KEY"
```

3. **Test Categories Endpoint**:
```bash
curl -X GET "https://dashboard.devinquire.com/blogmanager/api/blog/categories" \
  -H "X-API-Key: YOUR_API_KEY"
```

## API Endpoints Available

### Get All Posts
```
GET /api/blog/posts?status=published&category=CATEGORY&limit=10&page=1
```

**Query Parameters:**
- `status`: Filter by status (default: published)
- `category`: Filter by category name
- `tag`: Filter by tag
- `search`: Search in title, excerpt, tags
- `limit`: Number of posts (max 50)
- `page`: Page number
- `sortBy`: Sort field (publishedAt, createdAt, updatedAt, title, views)
- `sortOrder`: asc or desc
- `includeContent`: true/false to include full content

### Get Single Post
```
GET /api/blog/posts/:postId
```
or
```
GET /api/blog/posts/:slug
```

### Get Categories
```
GET /api/blog/categories
```

### Get Tags
```
GET /api/blog/tags
```

## Category-Wise Fetching

The devinquire.com blog page already supports category filtering. When a user selects a category:

1. The `blogApiService.getPosts()` is called with `category` parameter
2. The category name is converted to slug format
3. Posts are filtered by category
4. Results are displayed on the blog page

**Example:**
- Category: "Web Development" 
- API call: `/api/blog/posts?category=web-development&status=published`
- Returns only posts with category "Web Development"

## Troubleshooting

### Posts Not Showing on devinquire.com

1. **Check Post Status**: Ensure posts have `status: 'published'`
2. **Check isPublic Field**: Ensure `isPublic: true` (automatically set when published)
3. **Check API Endpoint**: Verify the endpoint is accessible
4. **Check API Key**: Verify the API key is valid and registered
5. **Check CORS**: Ensure CORS headers are set correctly
6. **Check Console**: Look for errors in browser console

### Category Filter Not Working

1. **Check Category Name**: Ensure category names match exactly (case-sensitive)
2. **Check Category Field**: Verify posts have `category` field set
3. **Test API Directly**: Use curl to test the API endpoint directly

### API Returns Empty Results

1. **Check Firestore**: Verify posts exist in Firestore `posts` collection
2. **Check Filters**: Ensure `status: 'published'` and `isPublic: true`
3. **Check Collection Name**: Verify using `posts` collection (not `blogPosts`)

## Current Status

✅ **Fixed:**
- Collection name mismatch (`blogPosts` → `posts`)
- Missing `isPublic` field when publishing
- Field name compatibility (handles both formats)
- Timestamp conversion for Firestore dates

⏳ **Needs Setup:**
- Expose blogPublicApi as HTTP endpoint (Firebase Functions or Express server)
- Verify API key registration
- Test end-to-end connection

## Next Steps

1. Choose and implement one of the API endpoint options (Firebase Functions or Express)
2. Deploy the endpoint
3. Update devinquire.com config if needed
4. Test with a published blog post
5. Verify category filtering works

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Firebase console for Firestore data
3. Test API endpoints directly with curl
4. Verify API key is correct and registered

