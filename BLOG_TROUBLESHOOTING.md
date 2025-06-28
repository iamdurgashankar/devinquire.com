# Blog Functionality Troubleshooting Guide

## Issue: Blog posts are not being published/updated

### Quick Diagnosis Steps

#### 1. Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to create a blog post
4. Look for any error messages or debug logs

#### 2. Test LocalStorage Functionality

1. Open `test-localstorage-blog.html` in your browser
2. Run through the test steps
3. Verify that localStorage blog functions work

#### 3. Check API Availability

1. Open browser console
2. Run: `window.debugBlog()` (if debug script is loaded)
3. Check if PHP backend is available

### Common Issues and Solutions

#### Issue 1: PHP Backend Not Available

**Symptoms:**

- Console shows "API server not available, falling back to localStorage"
- Blog posts work in localStorage but not in production

**Solutions:**

1. **For Development:**

   - Install PHP locally or use a local server
   - Or rely on localStorage fallback (should work)

2. **For Production:**
   - Ensure PHP files are uploaded to server
   - Check server logs for PHP errors
   - Verify database connection

#### Issue 2: LocalStorage Not Persisting

**Symptoms:**

- Posts appear to save but disappear on page reload
- Console shows posts being created but not retrieved

**Solutions:**

1. Check if localStorage is enabled in browser
2. Clear browser cache and try again
3. Check for localStorage quota exceeded errors

#### Issue 3: User Authentication Issues

**Symptoms:**

- "Admin access required" errors
- User not logged in properly

**Solutions:**

1. Ensure you're logged in as admin
2. Check if session is valid
3. Try logging out and back in

#### Issue 4: Form Validation Errors

**Symptoms:**

- Form submission fails silently
- Required fields not being validated

**Solutions:**

1. Fill in all required fields (title, excerpt, content, category)
2. Check for special characters in content
3. Ensure content is not too long

### Debugging Tools

#### 1. Debug Script

```javascript
// Run this in browser console
window.debugBlog();
```

#### 2. Manual API Testing

```javascript
// Test API service directly
const apiService = window.apiService;
apiService
  .createPost({
    title: "Test Post",
    excerpt: "Test excerpt",
    content: "Test content",
    category: "Web Development",
    status: "published",
  })
  .then(console.log);
```

#### 3. Check LocalStorage

```javascript
// Check what's stored in localStorage
console.log(JSON.parse(localStorage.getItem("devinquireDB")));
```

### Step-by-Step Testing

#### Test 1: Basic Functionality

1. Login as admin (admin@devinquire.com / admin123)
2. Go to Blog Manager
3. Click "Create New Post"
4. Fill in all required fields
5. Click "Create Post"
6. Check console for debug messages

#### Test 2: LocalStorage Fallback

1. Disconnect from internet (to force localStorage)
2. Try creating a post
3. Check if it appears in the list
4. Reload page and check if post persists

#### Test 3: Production Backend

1. Ensure you're on production server
2. Check if PHP backend is responding
3. Try creating a post
4. Check database for new post

### Environment-Specific Issues

#### Development Environment

- **Issue:** No PHP server running
- **Solution:** Use localStorage fallback or install local PHP server

#### Production Environment

- **Issue:** PHP backend errors
- **Solution:** Check server logs, verify file permissions

#### Mixed Environment

- **Issue:** Inconsistent behavior between dev/prod
- **Solution:** Ensure same data structure in both environments

### Data Structure Verification

#### Expected localStorage Structure

```javascript
{
  users: [
    {
      id: 1,
      name: "Admin User",
      email: "admin@devinquire.com",
      role: "admin",
      status: "approved"
    }
  ],
  posts: [
    {
      id: 1234567890,
      title: "Blog Post Title",
      excerpt: "Post excerpt",
      content: "Full post content",
      category: "Web Development",
      tags: ["tag1", "tag2"],
      status: "published",
      author_name: "Admin User",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z"
    }
  ],
  pendingUsers: []
}
```

### Common Error Messages

#### "API server not available"

- **Cause:** PHP backend not running or unreachable
- **Solution:** Use localStorage fallback or fix backend

#### "Admin access required"

- **Cause:** User not logged in as admin
- **Solution:** Login with admin credentials

#### "Post not found"

- **Cause:** Post ID doesn't exist
- **Solution:** Refresh page and try again

#### "Failed to save post"

- **Cause:** Validation error or database issue
- **Solution:** Check form data and try again

### Performance Issues

#### Slow Post Creation

- **Cause:** Large images or content
- **Solution:** Optimize images, reduce content size

#### Posts Not Loading

- **Cause:** Too many posts or slow database
- **Solution:** Implement pagination, optimize queries

### Security Considerations

#### Input Validation

- All user inputs are validated
- SQL injection protection in place
- XSS protection implemented

#### Access Control

- Admin-only access for blog management
- Session-based authentication
- Proper authorization checks

### Getting Help

If you're still experiencing issues:

1. **Check the console logs** for specific error messages
2. **Run the debug script** to identify the problem
3. **Test with localStorage** to isolate backend issues
4. **Check network tab** for failed API requests
5. **Verify user permissions** and authentication status

### Quick Fixes

#### Reset Everything

```javascript
// Clear all data and start fresh
localStorage.clear();
window.location.reload();
```

#### Force LocalStorage Mode

```javascript
// Disable API checks temporarily
window.apiService.checkApiAvailability = () => false;
```

#### Reinitialize Database

```javascript
// Reset to default state
window.apiService.resetDatabase();
```
