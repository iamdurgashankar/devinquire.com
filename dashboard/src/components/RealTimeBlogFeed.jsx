/**
 * Real-time Blog Feed Component for Main Website
 * Displays published blog posts with live updates when new content is published
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import realTimeService from '../services/realTimeService';
import enhancedApiService from '../services/enhancedApiService';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  ExternalLink, 
  ChevronRight,
  Wifi,
  WifiOff,
  Globe,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RealTimeBlogFeed = ({ maxPosts = 10, showFilters = true, compact = false }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newPostNotification, setNewPostNotification] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Real-time connection management
  useEffect(() => {
    // Subscribe to connection status
    const unsubscribeConnection = realTimeService.onConnectionChange((data) => {
      setIsConnected(data.status === 'connected');
    });

    // Subscribe to new blog publications
    const unsubscribePublished = realTimeService.onBlogPublished((blog) => {
      // Add new published post to the feed
      setPosts(prevPosts => {
        // Check if post already exists
        const existingIndex = prevPosts.findIndex(p => p.id === blog.id);
        if (existingIndex >= 0) {
          // Update existing post
          const updatedPosts = [...prevPosts];
          updatedPosts[existingIndex] = blog;
          return updatedPosts;
        } else {
          // Add new post at the beginning
          return [blog, ...prevPosts.slice(0, maxPosts - 1)];
        }
      });

      // Show notification for new post
      setNewPostNotification({
        id: blog.id,
        title: blog.title,
        timestamp: new Date()
      });

      // Hide notification after 5 seconds
      setTimeout(() => setNewPostNotification(null), 5000);
    });

    // Subscribe to blog updates
    const unsubscribeUpdated = realTimeService.onBlogUpdated((blog) => {
      if (blog.status === 'published') {
        setPosts(prevPosts => 
          prevPosts.map(post => post.id === blog.id ? blog : post)
        );
      }
    });

    // Subscribe to blog deletions
    const unsubscribeDeleted = realTimeService.onBlogDeleted((data) => {
      setPosts(prevPosts => prevPosts.filter(post => post.id !== data.id));
    });

    // Set initial connection status
    setIsConnected(realTimeService.isConnectionActive());

    return () => {
      unsubscribeConnection();
      unsubscribePublished();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [maxPosts]);

  // Load initial posts
  useEffect(() => {
    loadPosts();
  }, [selectedCategory, maxPosts]);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await enhancedApiService.getPosts(
        1, 
        maxPosts, 
        selectedCategory === 'all' ? null : selectedCategory, 
        'published'
      );

      if (response.success) {
        const publishedPosts = (response.data?.posts || response.data || [])
          .filter(post => post.status === 'published')
          .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
        
        setPosts(publishedPosts);
      }
    } catch (error) {
      console.error('Error loading blog feed:', error);
      // Try to show cached posts if available
      const cached = JSON.parse(localStorage.getItem('blog_feed_cache') || '[]');
      setPosts(cached);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, maxPosts]);

  // Get unique categories from posts
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(posts.map(post => post.category).filter(Boolean))];
    return cats;
  }, [posts]);

  // Format date
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Format reading time
  const getReadingTime = useCallback((content) => {
    const wordsPerMinute = 200;
    const wordCount = content?.split(' ').length || 0;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readingTime} min read`;
  }, []);

  // Truncate content for excerpt
  const truncateContent = useCallback((content, maxLength = 150) => {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  // Post card component
  const PostCard = React.memo(({ post, index }) => (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-neutral-200/50 overflow-hidden ${
        compact ? 'h-auto' : 'h-full'
      }`}
    >
      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={post.featured_image} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className="px-2 py-1 bg-[var(--primary)]/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
              {post.category}
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Post Meta */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-neutral-600">
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>{post.author_name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{getReadingTime(post.content)}</span>
          </div>
        </div>

        {/* Post Title */}
        <h2 className="text-xl font-bold text-neutral-800 mb-3 line-clamp-2 hover:text-[var(--primary)] transition-colors cursor-pointer">
          {post.title}
        </h2>

        {/* Post Excerpt */}
        <p className="text-neutral-600 mb-4 line-clamp-3">
          {post.excerpt || truncateContent(post.content)}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(Array.isArray(post.tags) ? post.tags : post.tags.split(',')).slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button className="flex items-center space-x-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors">
            <span>Read More</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <Heart className="w-4 h-4 text-neutral-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <Share2 className="w-4 h-4 text-neutral-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <Bookmark className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary/5 to-accent/10">
      {/* Real-time connection indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 ${
          isConnected 
            ? 'bg-green-500/20 border-green-500/30 text-green-700' 
            : 'bg-red-500/20 border-red-500/30 text-red-700'
        }`}>
          {isConnected ? (
            <><Globe className="w-4 h-4" /> <span className="text-xs font-medium">Live Feed</span></>
          ) : (
            <><WifiOff className="w-4 h-4" /> <span className="text-xs font-medium">Offline</span></>
          )}
        </div>
      </div>

      {/* New post notification */}
      <AnimatePresence>
        {newPostNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 right-4 z-40 max-w-sm"
          >
            <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg border border-green-400">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">New Post Published!</p>
                  <p className="text-xs opacity-90 mt-1">{newPostNotification.title}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">
            Latest Blog Posts
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Stay updated with our latest articles, tutorials, and insights. Posts update automatically when new content is published.
          </p>
        </div>

        {/* Filters and Controls */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                    selectedCategory === category
                      ? 'bg-[var(--primary)] text-white shadow-md'
                      : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-neutral-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-[var(--primary)] text-white' : 'text-neutral-600'
                }`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-xs"></div>
                  <div className="bg-current rounded-xs"></div>
                  <div className="bg-current rounded-xs"></div>
                  <div className="bg-current rounded-xs"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-[var(--primary)] text-white' : 'text-neutral-600'
                }`}
              >
                <div className="w-4 h-4 flex flex-col gap-1">
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                  <div className="bg-current h-0.5 rounded"></div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-neutral-600">Loading latest posts...</span>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {!loading && (
          <div className={`grid gap-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            <AnimatePresence>
              {posts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Posts Yet</h3>
            <p className="text-neutral-500">
              {selectedCategory === 'all' 
                ? 'Be the first to publish a blog post!' 
                : `No posts found in the "${selectedCategory}" category.`
              }
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!loading && posts.length >= maxPosts && (
          <div className="text-center mt-12">
            <button 
              onClick={() => loadPosts()}
              className="px-8 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors shadow-lg"
            >
              Load More Posts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeBlogFeed;