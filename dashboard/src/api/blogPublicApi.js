/**
 * Public Blog API Endpoints
 * Secure API endpoints for external blog content access
 */

import firestoreService from '../services/firestoreService.js';
import blogApiKeyService from '../services/blogApiKeyService.js';
import { blogCachingService } from '../services/blogCachingService.js';

class BlogPublicApi {
  constructor() {
    this.corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Domain',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Handle CORS preflight requests
   */
  handleOptions() {
    return {
      status: 200,
      headers: this.corsHeaders,
      body: ''
    };
  }

  /**
   * Authenticate request using API key
   */
  async authenticateRequest(request) {
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');
    const domain = request.headers['x-domain'] || request.headers['origin'];
    
    if (!apiKey) {
      return {
        success: false,
        error: 'API key required',
        status: 401
      };
    }

    const validation = await blogApiKeyService.validateApiKey(apiKey, 'read', domain);
    
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        status: 403
      };
    }

    return {
      success: true,
      keyData: validation.keyData
    };
  }

  /**
   * Get published blog posts
   */
  async getBlogPosts(request) {
    try {
      // Authenticate request
      const auth = await this.authenticateRequest(request);
      if (!auth.success) {
        return this.errorResponse(auth.error, auth.status);
      }

      // Parse query parameters
      const url = new URL(request.url);
      const params = {
        page: parseInt(url.searchParams.get('page')) || 1,
        limit: Math.min(parseInt(url.searchParams.get('limit')) || 10, 50), // Max 50 posts
        category: url.searchParams.get('category'),
        tag: url.searchParams.get('tag'),
        search: url.searchParams.get('search'),
        sortBy: url.searchParams.get('sortBy') || 'publishedAt',
        sortOrder: url.searchParams.get('sortOrder') || 'desc',
        includeContent: url.searchParams.get('includeContent') === 'true'
      };

      // Check cache first
      const cacheKey = `public_posts_${JSON.stringify(params)}`;
      const cached = await blogCachingService.get(cacheKey);
      if (cached) {
        return this.successResponse(cached);
      }

      // Build Firestore query filters - use 'posts' collection (matches contentService)
      const filters = [
        { field: 'status', operator: '==', value: 'published' },
        { field: 'isPublic', operator: '==', value: true }
      ];

      // Apply filters
      if (params.category) {
        filters.push({ field: 'category', operator: '==', value: params.category });
      }

      if (params.tag) {
        filters.push({ field: 'tags', operator: 'array-contains', value: params.tag });
      }

      // Apply sorting
      const validSortFields = ['publishedAt', 'createdAt', 'updatedAt', 'title'];
      const sortField = validSortFields.includes(params.sortBy) ? params.sortBy : 'publishedAt';
      const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

      // Execute query using firestoreService
      const result = await firestoreService.getDocuments('posts', {
        filters,
        orderByField: sortField,
        orderByDirection: sortOrder,
        limitCount: params.limit * params.page // Get enough for pagination
      });

      let posts = [];
      if (result.success && result.data && Array.isArray(result.data)) {
        posts = result.data.map(doc => {
          // Handle both direct data objects and doc objects
          const data = doc.data || doc;
          const docId = doc.id || data.id;
          
          // Convert Firestore timestamps to ISO strings
          const convertTimestamp = (timestamp) => {
            if (!timestamp) return null;
            if (timestamp.toDate) return timestamp.toDate().toISOString();
            if (timestamp instanceof Date) return timestamp.toISOString();
            if (typeof timestamp === 'string') return timestamp;
            return null;
          };
          
          return {
            id: docId,
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt,
            category: data.category,
            tags: data.tags || [],
            author: {
              name: data.author?.name || data.author_name || 'Anonymous',
              avatar: data.author?.avatar || data.author_avatar || null
            },
            publishedAt: convertTimestamp(data.publishedAt || data.metadata?.publishedAt),
            updatedAt: convertTimestamp(data.updatedAt || data.metadata?.updatedAt),
            featuredImage: data.featuredImage || data.featured_image,
            readTime: data.readTime || data.analytics?.readTime || 5,
            views: data.views || data.analytics?.views || 0,
            likes: data.likes || data.analytics?.likes || 0,
            ...(params.includeContent && { content: data.content })
          };
        });
      }

      // Apply client-side search if needed
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        posts = posts.filter(post => 
          post.title.toLowerCase().includes(searchTerm) ||
          post.excerpt.toLowerCase().includes(searchTerm) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Apply pagination
      const total = posts.length;
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedPosts = posts.slice(startIndex, endIndex);

      const result = {
        posts: paginatedPosts,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
          hasNext: endIndex < total,
          hasPrev: params.page > 1
        },
        meta: {
          timestamp: new Date().toISOString(),
          source: 'firebase',
          cached: false
        }
      };

      // Cache the result for 5 minutes
      await blogCachingService.set(cacheKey, result, 300);

      return this.successResponse(result);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return this.errorResponse('Internal server error', 500);
    }
  }

  /**
   * Get single blog post by ID or slug
   */
  async getBlogPost(request, postId) {
    try {
      // Authenticate request
      const auth = await this.authenticateRequest(request);
      if (!auth.success) {
        return this.errorResponse(auth.error, auth.status);
      }

      // Check cache first
      const cacheKey = `public_post_${postId}`;
      const cached = await blogCachingService.get(cacheKey);
      if (cached) {
        return this.successResponse(cached);
      }

      // Try to find by ID first
      let docResult = await firestoreService.getDocument('posts', postId);
      
      let postData = null;
      
      if (docResult.success && docResult.data) {
        postData = docResult.data;
      } else {
        // Try finding by slug
        const slugQuery = await firestoreService.getDocuments('posts', {
          filters: [
            { field: 'slug', operator: '==', value: postId },
            { field: 'status', operator: '==', value: 'published' },
            { field: 'isPublic', operator: '==', value: true }
          ],
          limitCount: 1
        });
        
        if (slugQuery.success && slugQuery.data && slugQuery.data.length > 0) {
          postData = slugQuery.data[0];
        } else {
          return this.errorResponse('Post not found', 404);
        }
      }

      // Check if post is published and public
      if (postData.status !== 'published' || !postData.isPublic) {
        return this.errorResponse('Post not found', 404);
      }
      
      const data = postData;

      // Convert Firestore timestamps
      const convertTimestamp = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate().toISOString();
        if (timestamp instanceof Date) return timestamp.toISOString();
        if (typeof timestamp === 'string') return timestamp;
        return null;
      };

      const post = {
        id: postData.id || data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category,
        tags: data.tags || [],
        author: {
          name: data.author?.name || data.author_name || 'Anonymous',
          avatar: data.author?.avatar || data.author_avatar || null,
          bio: data.author?.bio || null
        },
        publishedAt: convertTimestamp(data.publishedAt || data.metadata?.publishedAt),
        updatedAt: convertTimestamp(data.updatedAt || data.metadata?.updatedAt),
        featuredImage: data.featuredImage || data.featured_image,
        readTime: data.readTime || data.analytics?.readTime || 5,
        views: data.views || data.analytics?.views || 0,
        likes: data.likes || data.analytics?.likes || 0,
        seo: {
          metaTitle: data.seo?.metaTitle || data.title,
          metaDescription: data.seo?.metaDescription || data.excerpt,
          keywords: data.seo?.keywords || data.tags
        }
      };

      // Increment view count (fire and forget)
      const postId = postData.id || data.id;
      if (postId) {
        firestoreService.updateDocument('posts', postId, {
          views: (data.views || data.analytics?.views || 0) + 1,
          lastViewed: new Date().toISOString()
        }).catch(err => console.error('Error updating view count:', err));
      }

      // Cache the result for 10 minutes
      await blogCachingService.set(cacheKey, post, 600);

      return this.successResponse(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return this.errorResponse('Internal server error', 500);
    }
  }

  /**
   * Get blog categories
   */
  async getCategories(request) {
    try {
      // Authenticate request
      const auth = await this.authenticateRequest(request);
      if (!auth.success) {
        return this.errorResponse(auth.error, auth.status);
      }

      // Check cache first
      const cacheKey = 'public_categories';
      const cached = await blogCachingService.get(cacheKey);
      if (cached) {
        return this.successResponse(cached);
      }

      // Get all published posts and extract categories
      const postsResult = await firestoreService.getDocuments('posts', {
        filters: [
          { field: 'status', operator: '==', value: 'published' },
          { field: 'isPublic', operator: '==', value: true }
        ],
        limitCount: 1000 // Get all published posts to count categories
      });

      const categoryCount = {};
      if (postsResult.success && postsResult.data && Array.isArray(postsResult.data)) {
        postsResult.data.forEach(doc => {
          const data = doc.data || doc;
          const category = data.category;
          if (category) {
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          }
        });
      }

      const categories = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count,
        slug: name.toLowerCase().replace(/\s+/g, '-')
      }));

      // Cache for 30 minutes
      await blogCachingService.set(cacheKey, categories, 1800);

      return this.successResponse(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return this.errorResponse('Internal server error', 500);
    }
  }

  /**
   * Get blog tags
   */
  async getTags(request) {
    try {
      // Authenticate request
      const auth = await this.authenticateRequest(request);
      if (!auth.success) {
        return this.errorResponse(auth.error, auth.status);
      }

      // Check cache first
      const cacheKey = 'public_tags';
      const cached = await blogCachingService.get(cacheKey);
      if (cached) {
        return this.successResponse(cached);
      }

      // Get all published posts and extract tags
      const postsResult = await firestoreService.getDocuments('posts', {
        filters: [
          { field: 'status', operator: '==', value: 'published' },
          { field: 'isPublic', operator: '==', value: true }
        ],
        limitCount: 1000 // Get all published posts to count tags
      });

      const tagCount = {};
      if (postsResult.success && postsResult.data && Array.isArray(postsResult.data)) {
        postsResult.data.forEach(doc => {
          const data = doc.data || doc;
          const tags = data.tags || [];
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (tag) {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
              }
            });
          }
        });
      }

      const tags = Object.entries(tagCount)
        .map(([name, count]) => ({
          name,
          count,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        }))
        .sort((a, b) => b.count - a.count); // Sort by popularity

      // Cache for 30 minutes
      await blogCachingService.set(cacheKey, tags, 1800);

      return this.successResponse(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      return this.errorResponse('Internal server error', 500);
    }
  }

  /**
   * Success response helper
   */
  successResponse(data) {
    return {
      status: 200,
      headers: this.corsHeaders,
      body: JSON.stringify({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Error response helper
   */
  errorResponse(message, status = 400) {
    return {
      status,
      headers: this.corsHeaders,
      body: JSON.stringify({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Route handler for different endpoints
   */
  async handleRequest(request) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return this.handleOptions();
    }

    // Route to appropriate handler
    if (method === 'GET') {
      if (path === '/api/blog/posts') {
        return this.getBlogPosts(request);
      } else if (path.startsWith('/api/blog/posts/')) {
        const postId = path.split('/').pop();
        return this.getBlogPost(request, postId);
      } else if (path === '/api/blog/categories') {
        return this.getCategories(request);
      } else if (path === '/api/blog/tags') {
        return this.getTags(request);
      }
    }

    return this.errorResponse('Endpoint not found', 404);
  }
}

const blogPublicApi = new BlogPublicApi();
export default blogPublicApi;

// Export individual methods for serverless functions
export const handleBlogRequest = (request) => blogPublicApi.handleRequest(request);
export const getBlogPosts = (request) => blogPublicApi.getBlogPosts(request);
export const getBlogPost = (request, postId) => blogPublicApi.getBlogPost(request, postId);
export const getCategories = (request) => blogPublicApi.getCategories(request);
export const getTags = (request) => blogPublicApi.getTags(request);