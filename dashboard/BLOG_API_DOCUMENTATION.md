# Blog API Documentation

## Overview

This document provides comprehensive documentation for the DevInquire Blog API endpoints. The API provides access to blog posts with full CRUD operations, filtering, pagination, and SEO metadata.

## Base URL

```
http://localhost:3007
```

## API Endpoints

### 1. Get All Blog Posts

**Endpoint:** `GET /api/blog/posts`

**Description:** Retrieves a list of all blog posts with optional filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by post status (`published`, `draft`, `archived`)
- `featured` (optional): Filter by featured status (`true`, `false`)
- `limit` (optional): Number of posts to return (default: all)
- `offset` (optional): Number of posts to skip (default: 0)

**Example Requests:**

```bash
# Get all published posts
curl "http://localhost:3007/api/blog/posts?status=published"

# Get featured posts only
curl "http://localhost:3007/api/blog/posts?featured=true"

# Get posts with pagination
curl "http://localhost:3007/api/blog/posts?limit=10&offset=0"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "test-post-1",
      "title": "Test Blog Post - API Workflow Verification",
      "content": "This is a test blog post created to verify the complete workflow...",
      "excerpt": "A test post to verify the blog API workflow...",
      "author": "System Test",
      "status": "published",
      "featured": false,
      "tags": ["test", "api", "workflow"],
      "category": "Testing",
      "slug": "test-blog-post-api-workflow-verification",
      "publishedAt": "2025-09-12T17:21:00.748Z",
      "createdAt": "2025-09-12T17:21:00.756Z",
      "updatedAt": "2025-09-12T17:21:00.756Z",
      "views": 0,
      "likes": 0,
      "comments": 0,
      "seo": {
        "metaTitle": "Test Blog Post - API Workflow Verification",
        "metaDescription": "A test post to verify the blog API workflow...",
        "keywords": ["test", "api", "workflow", "blog"]
      }
    }
  ],
  "total": 2,
  "count": 1,
  "pagination": {
    "offset": 0,
    "limit": 1,
    "hasMore": true
  }
}
```

### 2. Get Specific Blog Post by ID

**Endpoint:** `GET /api/blog/posts/:id`

**Description:** Retrieves a specific blog post by its unique ID.

**Parameters:**
- `id` (required): The unique identifier of the blog post

**Example Request:**

```bash
curl "http://localhost:3007/api/blog/posts/test-post-1"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "test-post-1",
    "title": "Test Blog Post - API Workflow Verification",
    "content": "This is a test blog post created to verify the complete workflow from creation to API access. It includes sample content to demonstrate the blog functionality.",
    "excerpt": "A test post to verify the blog API workflow and ensure everything is working correctly.",
    "author": "System Test",
    "status": "published",
    "featured": false,
    "tags": ["test", "api", "workflow"],
    "category": "Testing",
    "slug": "test-blog-post-api-workflow-verification",
    "publishedAt": "2025-09-12T17:21:00.748Z",
    "createdAt": "2025-09-12T17:21:00.756Z",
    "updatedAt": "2025-09-12T17:21:00.756Z",
    "views": 0,
    "likes": 0,
    "comments": 0,
    "seo": {
      "metaTitle": "Test Blog Post - API Workflow Verification",
      "metaDescription": "A test post to verify the blog API workflow and ensure everything is working correctly.",
      "keywords": ["test", "api", "workflow", "blog"]
    }
  }
}
```

### 3. Get Blog Post by Slug

**Endpoint:** `GET /api/blog/posts/slug/:slug`

**Description:** Retrieves a specific blog post by its URL slug (SEO-friendly identifier).

**Parameters:**
- `slug` (required): The URL slug of the blog post

**Example Request:**

```bash
curl "http://localhost:3007/api/blog/posts/slug/test-blog-post-api-workflow-verification"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "test-post-1",
    "title": "Test Blog Post - API Workflow Verification",
    "slug": "test-blog-post-api-workflow-verification",
    // ... rest of post data
  }
}
```

### 4. Health Check

**Endpoint:** `GET /health`

**Description:** Returns the health status of the API server and available endpoints.

**Example Request:**

```bash
curl "http://localhost:3007/health"
```

**Example Response:**

```json
{
  "success": true,
  "message": "Blog API simulation server is running",
  "timestamp": "2025-09-12T17:21:00.756Z",
  "endpoints": [
    "GET /api/blog/posts",
    "GET /api/blog/posts/:id",
    "GET /api/blog/posts/slug/:slug"
  ]
}
```

## Error Responses

### 404 Not Found

When a requested resource is not found:

```json
{
  "success": false,
  "error": "Post not found",
  "message": "Blog post with ID 'invalid-id' does not exist"
}
```

## Data Schema

### Blog Post Object

```typescript
interface BlogPost {
  id: string;                    // Unique identifier
  title: string;                 // Post title
  content: string;               // Full post content
  excerpt: string;               // Short description
  author: string;                // Author name
  status: 'published' | 'draft' | 'archived'; // Publication status
  featured: boolean;             // Featured post flag
  tags: string[];                // Post tags
  category: string;              // Post category
  slug: string;                  // URL-friendly identifier
  publishedAt: string;           // ISO 8601 timestamp
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  views: number;                 // View count
  likes: number;                 // Like count
  comments: number;              // Comment count
  seo: {
    metaTitle: string;           // SEO meta title
    metaDescription: string;     // SEO meta description
    keywords: string[];          // SEO keywords
  };
}
```

## Usage Examples

### JavaScript/Node.js

```javascript
// Using fetch API
async function getAllPosts() {
  try {
    const response = await fetch('http://localhost:3007/api/blog/posts');
    const data = await response.json();
    
    if (data.success) {
      console.log('Posts:', data.data);
      console.log('Total posts:', data.total);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

// Get specific post
async function getPost(id) {
  try {
    const response = await fetch(`http://localhost:3007/api/blog/posts/${id}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Post:', data.data);
    } else {
      console.error('Post not found:', data.message);
    }
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('http://localhost:3007/api/blog/posts?status=published');
        const data = await response.json();
        
        if (data.success) {
          setPosts(data.data);
        } else {
          setError('Failed to fetch posts');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <small>By {post.author} on {new Date(post.publishedAt).toLocaleDateString()}</small>
        </article>
      ))}
    </div>
  );
}

export default BlogList;
```

### Python Example

```python
import requests
import json

def get_all_posts():
    """Fetch all blog posts"""
    try:
        response = requests.get('http://localhost:3007/api/blog/posts')
        response.raise_for_status()
        
        data = response.json()
        if data['success']:
            return data['data']
        else:
            print(f"Error: {data.get('message', 'Unknown error')}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        return []

def get_post_by_slug(slug):
    """Fetch a specific post by slug"""
    try:
        response = requests.get(f'http://localhost:3007/api/blog/posts/slug/{slug}')
        response.raise_for_status()
        
        data = response.json()
        if data['success']:
            return data['data']
        else:
            print(f"Post not found: {data.get('message')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        return None

# Usage
if __name__ == "__main__":
    posts = get_all_posts()
    print(f"Found {len(posts)} posts")
    
    # Get specific post
    post = get_post_by_slug('test-blog-post-api-workflow-verification')
    if post:
        print(f"Post title: {post['title']}")
```

## Testing the API

### Using curl

```bash
# Test all endpoints
curl -s http://localhost:3007/health | jq .
curl -s http://localhost:3007/api/blog/posts | jq .
curl -s http://localhost:3007/api/blog/posts/test-post-1 | jq .
curl -s http://localhost:3007/api/blog/posts/slug/test-blog-post-api-workflow-verification | jq .
```

### Using Postman

1. Import the following collection:
   - GET `http://localhost:3007/api/blog/posts`
   - GET `http://localhost:3007/api/blog/posts/test-post-1`
   - GET `http://localhost:3007/api/blog/posts/slug/test-blog-post-api-workflow-verification`
   - GET `http://localhost:3007/health`

2. Set up environment variables:
   - `base_url`: `http://localhost:3007`

## Server Information

- **Port:** 3007
- **CORS:** Enabled for all origins
- **Content-Type:** application/json
- **Status:** Simulation server (for testing purposes)

## Next Steps

To implement the full production API:

1. **Firebase Functions Deployment:** Deploy the Firebase Functions with proper authentication
2. **Database Integration:** Connect to Firestore for real data persistence
3. **Authentication:** Implement API key or JWT authentication
4. **Rate Limiting:** Add rate limiting for production use
5. **Caching:** Implement caching for better performance
6. **Monitoring:** Add logging and monitoring capabilities

---

**Note:** This is a simulation server created for testing the blog API workflow. In production, these endpoints would be served by Firebase Functions with proper authentication and database integration.