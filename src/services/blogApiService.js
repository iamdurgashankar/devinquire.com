import { BLOG_API_CONFIG, API_BASE } from '../config';

/**
 * Blog API Service with Resilient Multi-Tier Synchronization
 * 1. Primary: Local devinquire.com backend API (/api/blog)
 * 2. Secondary Fallback: Direct Dashboard Public API (http://localhost:8001/api/public/blog_list)
 * 3. Offline Safety Net: Mock data
 */
class BlogApiService {
  constructor() {
    this.baseUrl = API_BASE || 'http://localhost:8000';
    this.dashboardBaseUrl = process.env.REACT_APP_DASHBOARD_API_URL || 'http://localhost:8001/api/public';
    this.apiKey = BLOG_API_CONFIG.apiKey;
  }

  /**
   * Helper to execute fetch with timeout
   */
  async fetchWithTimeout(resource, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  /**
   * Fetch all blog categories
   */
  async getCategories() {
    // 1. Try local site API
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/blog/categories`, {}, 4000);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
    } catch (err) {
      console.warn('[BlogAPI] Local categories API unreachable:', err.message);
    }

    // 2. Try dashboard public list to infer categories
    try {
      const dashRes = await this.fetchWithTimeout(`${this.dashboardBaseUrl}/blog_list`, {}, 4000);
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        const posts = dashData.data || [];
        if (Array.isArray(posts) && posts.length > 0) {
          const uniqueCats = Array.from(new Set(posts.map(p => p.category).filter(Boolean)));
          return uniqueCats.map((cat, idx) => ({ id: idx + 1, name: cat, slug: cat.toLowerCase().replace(/\s+/g, '-') }));
        }
      }
    } catch (err) {
      console.warn('[BlogAPI] Dashboard public list unreachable for categories:', err.message);
    }

    // 3. Fallback static categories
    return [
      { id: 1, name: 'Web Development', slug: 'web-development' },
      { id: 2, name: 'React', slug: 'react' },
      { id: 3, name: 'Engineering', slug: 'engineering' },
      { id: 4, name: 'SEO', slug: 'seo' },
      { id: 5, name: 'Performance', slug: 'performance' }
    ];
  }

  /**
   * Fetch blog posts with optional filters
   */
  async getPosts(options = {}) {
    const {
      status = 'published',
      limit = 20,
      category = null,
      page = 1
    } = options;

    let queryParams = `?status=${status}&limit=${limit}&offset=${(page - 1) * limit}`;
    if (category && category !== 'All') {
      queryParams += `&category=${encodeURIComponent(category)}`;
    }

    // 1. Try Primary Site Backend API
    try {
      const primaryUrl = `${this.baseUrl}/api/blog/posts${queryParams}`;
      const response = await this.fetchWithTimeout(primaryUrl, {}, 4000);
      if (response.ok) {
        const result = await response.json();
        const posts = Array.isArray(result) ? result : (result.data || []);
        if (posts.length > 0) {
          return this.normalizePosts(posts);
        }
      }
    } catch (err) {
      console.warn('[BlogAPI] Primary blog posts API failed, falling back to Dashboard API:', err.message);
    }

    // 2. Try Direct Dashboard Public API
    try {
      let dashUrl = `${this.dashboardBaseUrl}/blog_list`;
      if (category && category !== 'All') {
        dashUrl += `?category=${encodeURIComponent(category)}`;
      }
      const dashRes = await this.fetchWithTimeout(dashUrl, {}, 4000);
      if (dashRes.ok) {
        const dashResult = await dashRes.json();
        const dashPosts = dashResult.data || [];
        if (Array.isArray(dashPosts) && dashPosts.length > 0) {
          return this.normalizePosts(dashPosts);
        }
      }
    } catch (err) {
      console.warn('[BlogAPI] Dashboard public API also unreachable:', err.message);
    }

    // 3. Last Resort Mock Data
    return this.getMockPosts();
  }

  /**
   * Fetch single blog post by ID or slug
   */
  async getPost(identifier) {
    if (!identifier) return null;

    // 1. Try Primary Site Backend API
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/blog/posts/${encodeURIComponent(identifier)}`, {}, 4000);
      if (response.ok) {
        const result = await response.json();
        const post = result.data || result;
        if (post && post.title) {
          return this.normalizePost(post);
        }
      }
    } catch (err) {
      console.warn(`[BlogAPI] Primary getPost(${identifier}) failed:`, err.message);
    }

    // 2. Try Dashboard Public API Detail Endpoint
    try {
      const isNumeric = /^\d+$/.test(identifier);
      const param = isNumeric ? `id=${encodeURIComponent(identifier)}` : `slug=${encodeURIComponent(identifier)}`;
      const dashRes = await this.fetchWithTimeout(`${this.dashboardBaseUrl}/blog_detail?${param}`, {}, 4000);
      if (dashRes.ok) {
        const dashResult = await dashRes.json();
        if (dashResult.status === 'success' && dashResult.data) {
          return this.normalizePost(dashResult.data);
        }
      }
    } catch (err) {
      console.warn(`[BlogAPI] Dashboard blog_detail API failed:`, err.message);
    }

    // 3. Fallback: Search inside mock posts or all posts
    const mockPosts = this.getMockPosts();
    const found = mockPosts.find(p => String(p.id) === String(identifier) || p.slug === identifier);
    return found ? this.normalizePost(found) : null;
  }

  /**
   * Helper to normalize array of post objects
   */
  normalizePosts(posts) {
    if (!Array.isArray(posts)) return [];
    return posts.map(p => this.normalizePost(p));
  }

  /**
   * Helper to normalize single post object
   */
  normalizePost(post) {
    if (!post) return null;

    let parsedTags = [];
    if (Array.isArray(post.tags)) {
      parsedTags = post.tags;
    } else if (typeof post.tags === 'string') {
      try {
        parsedTags = JSON.parse(post.tags);
      } catch {
        parsedTags = post.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const title = post.title || 'Untitled Article';
    const slug = post.slug || title.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || `post-${post.id}`;

    return {
      id: post.id,
      title,
      slug,
      excerpt: post.excerpt || post.content?.substring(0, 160) + '...' || '',
      content: post.content || '',
      author_name: post.author_name || post.author || 'DevInquire Team',
      category_name: post.category_name || post.category || 'Engineering',
      category_slug: post.category_slug || (post.category || 'engineering').toLowerCase().replace(/\s+/g, '-'),
      featured_image: post.featured_image || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=80',
      read_time: post.read_time || 5,
      tags: parsedTags,
      published_at: post.published_at || post.created_at || new Date().toISOString(),
      created_at: post.created_at || new Date().toISOString()
    };
  }

  /**
   * Mock posts for offline safety
   */
  getMockPosts() {
    return [
      {
        id: 101,
        title: 'Building Production-Grade Micro Frontends & AI Dashboards',
        slug: 'building-production-grade-micro-frontends',
        excerpt: 'Explore best practices for designing distributed web applications, state synchronization, and real-time management pipelines.',
        content: 'Building scalable modern web architectures requires clean decoupling between presentation layers and backend services...\n\n### Key Principles\n1. Resilient State Management\n2. Webhook Event Pipelines\n3. High-Performance API Caching',
        author_name: 'DevInquire Architecture Team',
        category_name: 'Engineering',
        category_slug: 'engineering',
        featured_image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1000&q=80',
        read_time: 6,
        tags: ['react', 'node', 'architecture', 'dashboard'],
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 102,
        title: 'Optimizing Core Web Vitals for Modern React Applications',
        slug: 'optimizing-core-web-vitals-react',
        excerpt: 'Learn how to streamline Largest Contentful Paint (LCP) and Interaction to Next Paint (INP) for lightning-fast digital experiences.',
        content: 'Core Web Vitals are critical metrics for search rankings and user satisfaction. In this guide, we walk through modern image optimization, code splitting, and DOM render strategies.',
        author_name: 'Performance Lead',
        category_name: 'Performance',
        category_slug: 'performance',
        featured_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
        read_time: 5,
        tags: ['performance', 'web-vitals', 'react', 'seo'],
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];
  }
}

export default new BlogApiService();