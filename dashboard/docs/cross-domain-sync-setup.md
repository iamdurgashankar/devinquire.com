# Cross-Domain Blog Synchronization Setup

This guide explains how to set up real-time synchronization between your dashboard application and the main website (devinquire.com) for blog posts.

## Overview

The cross-domain synchronization system enables:
- Real-time blog post updates from dashboard to main website
- Secure cross-origin communication using postMessage API
- Firebase real-time listeners for data synchronization
- Automatic reconnection and offline handling
- SEO-friendly blog list updates without page refresh

## Architecture

```
┌─────────────────┐    postMessage API    ┌──────────────────┐
│   Dashboard     │ ◄──────────────────► │  Main Website    │
│  (Admin Panel)  │                       │ (devinquire.com) │
├─────────────────┤                       ├──────────────────┤
│ CrossDomainSync │                       │ BlogSyncClient   │
│ Service         │                       │ (JavaScript)     │
├─────────────────┤                       └──────────────────┘
│ Firebase        │
│ Real-time       │
│ Listeners       │
└─────────────────┘
```

## Dashboard Setup (Already Implemented)

The dashboard includes:

### 1. CrossDomainSyncService
- **Location**: `src/services/crossDomainSyncService.js`
- **Features**:
  - Firebase real-time listeners for blog posts
  - postMessage API for cross-origin communication
  - Automatic initialization and reconnection
  - Security validation for allowed origins

### 2. BlogManager Integration
- **Location**: `src/components/BlogManager.jsx`
- **Features**:
  - Automatic cross-domain sync initialization
  - Real-time blog update broadcasting
  - Integration with existing real-time features

## Main Website Setup

### 1. Include the Blog Sync Client

Add the blog sync client script to your main website:

```html
<!-- Include the blog sync client -->
<script src="https://dashboard.devinquire.com/blog-sync-client.js"></script>
```

### 2. Initialize the Client

Add initialization code to your website:

```html
<script>
  // Initialize blog sync client
  BlogSyncClient.initialize({
    dashboardUrl: 'https://dashboard.devinquire.com',
    
    // Handle blog updates
    onBlogUpdate: function(data) {
      console.log('Blog update received:', data);
      
      switch (data.type) {
        case 'BLOG_PUBLISHED':
          // New blog post published
          handleNewBlogPost(data.data);
          break;
          
        case 'BLOG_UPDATED':
          // Existing blog post updated
          handleBlogUpdate(data.data);
          break;
          
        case 'BLOG_DELETED':
          // Blog post deleted
          handleBlogDeletion(data.data);
          break;
          
        case 'FULL_SYNC':
          // Full blog list synchronization
          handleFullSync(data.data);
          break;
      }
    },
    
    // Handle connection status changes
    onConnectionChange: function(status) {
      console.log('Connection status:', status.connected ? 'Connected' : 'Disconnected');
      
      // Update UI to show sync status
      updateSyncStatusIndicator(status.connected);
    },
    
    // Handle errors
    onError: function(error) {
      console.error('Blog sync error:', error);
    }
  });
  
  // Custom handlers for your website
  function handleNewBlogPost(blog) {
    // Add new blog post to your blog list
    // This function should match your website's structure
    
    // Example: Add to blog container
    const blogContainer = document.querySelector('.blog-list');
    if (blogContainer) {
      const newPost = createBlogPostElement(blog);
      blogContainer.insertBefore(newPost, blogContainer.firstChild);
      
      // Show notification
      showNotification('New blog post: ' + blog.title);
    }
  }
  
  function handleBlogUpdate(blog) {
    // Update existing blog post
    const existingPost = document.querySelector(`[data-blog-id="${blog.id}"]`);
    if (existingPost) {
      const updatedPost = createBlogPostElement(blog);
      existingPost.replaceWith(updatedPost);
    }
  }
  
  function handleBlogDeletion(data) {
    // Remove blog post from list
    const postToRemove = document.querySelector(`[data-blog-id="${data.id}"]`);
    if (postToRemove) {
      postToRemove.remove();
    }
  }
  
  function handleFullSync(posts) {
    // Rebuild entire blog list
    const blogContainer = document.querySelector('.blog-list');
    if (blogContainer && posts) {
      blogContainer.innerHTML = '';
      posts.forEach(post => {
        if (post.status === 'published') {
          const postElement = createBlogPostElement(post);
          blogContainer.appendChild(postElement);
        }
      });
    }
  }
  
  function createBlogPostElement(blog) {
    // Create blog post HTML element
    // Customize this based on your website's structure
    
    const article = document.createElement('article');
    article.className = 'blog-post';
    article.setAttribute('data-blog-id', blog.id);
    
    article.innerHTML = `
      <h2><a href="/blog/${blog.slug || blog.id}">${escapeHtml(blog.title)}</a></h2>
      <p class="excerpt">${escapeHtml(blog.excerpt || '')}</p>
      <div class="meta">
        <span class="author">By ${escapeHtml(blog.author_name || 'Admin')}</span>
        <time class="date">${new Date(blog.published_at || blog.created_at).toLocaleDateString()}</time>
        ${blog.category ? `<span class="category">${escapeHtml(blog.category)}</span>` : ''}
      </div>
      ${blog.tags && blog.tags.length ? `
        <div class="tags">
          ${blog.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
    `;
    
    return article;
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function updateSyncStatusIndicator(connected) {
    // Update sync status indicator in your UI
    const indicator = document.querySelector('.sync-status');
    if (indicator) {
      indicator.className = `sync-status ${connected ? 'connected' : 'disconnected'}`;
      indicator.textContent = connected ? 'Live' : 'Offline';
    }
  }
  
  function showNotification(message) {
    // Show notification to users (customize as needed)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DevInquire Blog Update', {
        body: message,
        icon: '/favicon.ico'
      });
    }
    
    // Or show in-page notification
    const notification = document.createElement('div');
    notification.className = 'blog-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
</script>
```

### 3. CSS for Sync Status Indicator (Optional)

Add CSS for the sync status indicator:

```css
.sync-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.sync-status.connected {
  background-color: #10b981;
  color: white;
}

.sync-status.disconnected {
  background-color: #ef4444;
  color: white;
}

.blog-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #3b82f6;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Security Configuration

### Allowed Origins

The dashboard is configured to accept messages from these origins:
- `https://devinquire.com`
- `https://www.devinquire.com`
- `http://localhost:3000-3004` (for development)

To add more origins, update the `allowedOrigins` array in `crossDomainSyncService.js`:

```javascript
this.allowedOrigins = [
  'https://devinquire.com',
  'https://www.devinquire.com',
  'https://your-additional-domain.com',
  // ... other domains
];
```

## Testing the Integration

### 1. Development Testing

1. Start the dashboard: `npm start` (runs on port 3004)
2. Open your main website in another tab
3. Create/update/publish a blog post in the dashboard
4. Check the browser console for sync messages
5. Verify that the main website receives updates

### 2. Production Testing

1. Deploy the dashboard with the sync service
2. Add the blog sync client to your main website
3. Test cross-domain communication
4. Monitor for any CORS or security issues

## Troubleshooting

### Common Issues

1. **No connection between dashboard and website**
   - Check browser console for CORS errors
   - Verify allowed origins configuration
   - Ensure both sites are using HTTPS in production

2. **Messages not being received**
   - Check if postMessage is being blocked by browser
   - Verify event listeners are properly set up
   - Check network connectivity

3. **Firebase connection issues**
   - Verify Firebase configuration
   - Check Firestore security rules
   - Ensure proper authentication

### Debug Mode

Enable debug logging by adding this to your website:

```javascript
// Enable debug logging
window.BlogSyncDebug = true;

// Check connection status
console.log('Blog sync status:', BlogSyncClient.getStatus());
```

## Performance Considerations

1. **Message Frequency**: The system uses heartbeat pings every 30 seconds
2. **DOM Updates**: Blog list updates are optimized to minimize reflows
3. **Offline Handling**: Messages are queued when offline and processed when reconnected
4. **Memory Usage**: Event listeners are properly cleaned up on disconnect

## Browser Support

- **Modern Browsers**: Full support (Chrome 60+, Firefox 55+, Safari 12+)
- **postMessage API**: Supported in all modern browsers
- **Notifications API**: Optional feature, gracefully degrades

## Next Steps

1. Customize the blog post HTML structure to match your website
2. Add CSS styling for sync indicators and notifications
3. Implement additional sync features (comments, likes, etc.)
4. Set up monitoring and analytics for sync performance
5. Consider implementing WebSocket fallback for better real-time performance

## API Reference

### BlogSyncClient Methods

- `initialize(options)`: Initialize the sync client
- `disconnect()`: Disconnect from dashboard
- `getStatus()`: Get current connection status
- `requestData(type, params)`: Request specific data from dashboard

### Event Types

- `BLOG_PUBLISHED`: New blog post published
- `BLOG_UPDATED`: Existing blog post updated
- `BLOG_DELETED`: Blog post deleted
- `FULL_SYNC`: Complete blog list synchronization

### Configuration Options

- `dashboardUrl`: URL of the dashboard application
- `onBlogUpdate`: Callback for blog updates
- `onConnectionChange`: Callback for connection status changes
- `onError`: Callback for error handling