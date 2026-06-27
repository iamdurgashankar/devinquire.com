import { BLOG_API_CONFIG, API_BASE } from '../config';

/**
 * Blog API Service with fallback mechanism
 * Handles all blog-related API calls with proper authentication
 * Falls back to local PHP API when external dashboard is unavailable
 */
class BlogApiService {
  constructor() {
    this.externalBaseUrl = BLOG_API_CONFIG.baseUrl;
    this.localBaseUrl = API_BASE;
    this.apiKey = BLOG_API_CONFIG.apiKey;
    this.useLocalFallback = false;
  }



  /**
   * Make authenticated API request with fallback mechanism
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, options = {}) {
     let externalUrl, localUrl;
     
     // Try external API first if not already using fallback
     if (!this.useLocalFallback) {
       try {
         externalUrl = `${this.externalBaseUrl}${endpoint}`;
         const config = {
           ...options,
           headers: {
             'Content-Type': 'application/json',
             'X-API-Key': this.apiKey,
             ...options.headers,
           },
         };

         const response = await fetch(externalUrl, config);
         
         if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
         }
         
         return await response.json();
       } catch (error) {
          console.warn(`[BlogAPI] External API failed (${externalUrl}):`, error.message);
          console.info('[BlogAPI] Switching to local fallback API');
          this.useLocalFallback = true;
        }
     }

     // Fallback to local API
     try {
       localUrl = `${this.localBaseUrl}/api/blog${endpoint}`;
       const config = {
         ...options,
         headers: {
           'Content-Type': 'application/json',
           ...options.headers,
         },
       };

       const response = await fetch(localUrl, config);
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       return await response.json();
     } catch (error) {
        console.error(`[BlogAPI] Local API also failed (${localUrl}):`, error.message);
        console.info('[BlogAPI] Using mock data as fallback');
        // Return mock data as last resort
        const mockResponse = this.getMockData(endpoint);
        console.info(`[BlogAPI] Mock data returned for ${endpoint}:`, mockResponse);
        return mockResponse;
      }
   }

  /**
    * Get mock data as last resort fallback
    * @param {string} endpoint - API endpoint
    * @returns {Object} Mock data response
    */
   getMockData(endpoint) {
     // Extract base endpoint without query parameters for mock data matching
     const baseEndpoint = endpoint.split('?')[0];
     
     const mockData = {
       '/categories': {
         success: true,
         data: [
           { id: 1, name: 'Technology', slug: 'technology', count: 15 },
           { id: 2, name: 'Business', slug: 'business', count: 12 },
           { id: 3, name: 'Lifestyle', slug: 'lifestyle', count: 8 },
           { id: 4, name: 'Health', slug: 'health', count: 6 }
         ]
       },
       '/posts': {
         success: true,
         data: [
           {
             id: 1,
             title: 'Getting Started with Modern Web Development',
             slug: 'getting-started-modern-web-development',
             excerpt: 'Learn the fundamentals of modern web development with the latest tools and technologies.',
             content: 'This is a sample blog post content...',
             category: 'Technology',
             category_name: 'Technology',
             category_slug: 'technology',
             author: 'John Doe',
             author_name: 'John Doe',
             published_at: '2024-01-15T10:00:00Z',
             created_at: '2024-01-15T10:00:00Z',
             featured_image: '/images/blog/web-development.jpg',
             is_featured: true,
             read_time: 5,
             tags: ['web development', 'javascript', 'react']
           },
           {
             id: 2,
             title: 'Building Scalable Business Solutions',
             slug: 'building-scalable-business-solutions',
             excerpt: 'Discover strategies for creating business solutions that grow with your company.',
             content: 'This is another sample blog post content...',
             category: 'Business',
             category_name: 'Business',
             category_slug: 'business',
             author: 'Jane Smith',
             author_name: 'Jane Smith',
             published_at: '2024-01-10T14:30:00Z',
             created_at: '2024-01-10T14:30:00Z',
             featured_image: '/images/blog/business-solutions.jpg',
             is_featured: false,
             read_time: 7,
             tags: ['business', 'scalability', 'strategy']
           }
         ],
         pagination: {
           current_page: 1,
           total_pages: 1,
           total_posts: 2,
           per_page: 10
         }
       }
     };

     return mockData[baseEndpoint] || { success: false, error: 'Endpoint not found' };
   }

   /**
   * Fetch all blog categories
   */
  async getCategories() {
    try {
      // For local PHP API
      if (this.useLocalFallback || this.localBaseUrl === this.externalBaseUrl) {
        const response = await fetch(`${this.localBaseUrl}/blog.php?action=categories`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
        return [];
      }
      
      const response = await this.makeRequest('/categories');
      // Ensure we return an array - handle both direct array and wrapped response
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  /**
   * Fetch blog posts with optional filters
   */
  async getPosts(options = {}) {
    try {
      const {
        status = 'published',
        limit = 20,
        category = null,
        page = 1
      } = options;
      
      // For local PHP API, use different endpoint format
      if (this.useLocalFallback || this.localBaseUrl === this.externalBaseUrl) {
        // Use PHP API endpoint: /api/blog.php?action=posts&category=...
        let endpoint = `/blog.php?action=posts&status=${status}&limit=${limit}&offset=${(page - 1) * limit}`;
        
        if (category && category !== 'All') {
          const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
          endpoint += `&category=${encodeURIComponent(categorySlug)}`;
        }
        
        const response = await fetch(`${this.localBaseUrl}${endpoint}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
        return [];
      }
      
      // External API (if needed)
      let endpoint = `/posts?status=${status}&limit=${limit}&page=${page}`;
      
      if (category && category !== 'All') {
        const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
        endpoint += `&category=${encodeURIComponent(categorySlug)}`;
      }
      
      const response = await this.makeRequest(endpoint);
      // Ensure we return an array - handle both direct array and wrapped response
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error in getPosts:', error);
      return [];
    }
  }

  /**
   * Fetch a single blog post by ID or slug
   */
  async getPost(identifier) {
    try {
      // For local PHP API
      if (this.useLocalFallback || this.localBaseUrl === this.externalBaseUrl) {
        const isNumeric = /^\d+$/.test(identifier);
        const param = isNumeric ? `id=${encodeURIComponent(identifier)}` : `slug=${encodeURIComponent(identifier)}`;
        const response = await fetch(`${this.localBaseUrl}/blog.php?action=posts&${param}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          return data.data;
        }
        return null;
      }

      const response = await this.makeRequest(`/posts/${encodeURIComponent(identifier)}`);
      // Handle both direct object and wrapped response
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        return response.data || response;
      }
      return null;
    } catch (error) {
      console.error('Error in getPost:', error);
      return null;
    }
  }

  /**
   * Search blog posts by query
   */
  async searchPosts(query, options = {}) {
    try {
      const { limit = 10 } = options;
      const response = await this.makeRequest(`/posts/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      // Ensure we return an array - handle both direct array and wrapped response
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error in searchPosts:', error);
      return [];
    }
  }

  /**
   * Fetch posts by tag
   */
  async getPostsByTag(tag, options = {}) {
    try {
      const { limit = 20 } = options;
      const response = await this.makeRequest(`/posts/tag/${encodeURIComponent(tag)}?limit=${limit}`);
      // Ensure we return an array - handle both direct array and wrapped response
      if (Array.isArray(response)) {
        return response;
      }
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error in getPostsByTag:', error);
      return [];
    }
  }
}

// Export singleton instance
export default new BlogApiService();