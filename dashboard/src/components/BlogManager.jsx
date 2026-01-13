import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/api';
import enhancedApiService from '../services/enhancedApiService';
import blogDataService from '../services/blogDataService';
import realTimeFeaturesService from '../services/realTimeFeaturesService';
import crossDomainSyncService from '../services/crossDomainSyncService';
import schedulingService from '../services/schedulingService';
import enhancedBlogApiService from '../services/enhancedBlogApiService';
import blogAuthService from '../services/blogAuthService';
import blogValidationService from '../services/blogValidationService';
import blogVersionControlService from '../services/blogVersionControlService';
import blogCachingService from '../services/blogCachingService';
import PublishingWorkflow from './PublishingWorkflow';
import DraftRecoveryModal from './DraftRecoveryModal';
import { useAuth, useEnhancedAuth } from '../contexts/EnhancedAuthContext';
import BlockEditor from './BlockEditor';
import {
  List,
  Edit,
  Calendar,
  FileText,
  TrendingUp,
  Plus,
  ChevronDown,
  Check,
  Minus,
  Upload,
  Wifi,
  WifiOff,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Send,
  RefreshCw,
  Globe,
  Save,
  X,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Settings,
  BarChart3,
  Users,
  MessageSquare,
  Tag,
  Folder,
  History,
  Share2,
  Download,
  Workflow,
  Bell,
  Shield,
  Home,
  PenTool,
  Image,
  Link,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Info,
  Loader,
  ChevronUp,
  Star,
  Heart,
  Bookmark,
  Share,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Grid,
  Layout,
  Columns,
  Sidebar,
  BookOpen,
  EyeOff
} from 'lucide-react';
import BlogErrorBoundary from './BlogErrorBoundary';
import BlogLoadingState from './BlogLoadingState';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EnhancedBlogEditor from './EnhancedBlogEditor';
const BlogManager = React.memo(function BlogManager({ showCreateForm = false }) {
  const { currentUser } = useAuth();
  const { blogPermissions, isAdmin, getUserDisplay, authError, clearError } = useEnhancedAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(showCreateForm);
  const [editingPost, setEditingPost] = useState(null);
  const [imageUpload, setImageUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Real-time and auto-save states
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [showRealTimeNotification, setShowRealTimeNotification] = useState(false);

  // Publishing workflow states
  const [workflowPost, setWorkflowPost] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Real-time validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, post: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Enhanced blog management states
  const [userPermissions, setUserPermissions] = useState([]);
  const [blogSession, setBlogSession] = useState(null);
  const [validationStatus, setValidationStatus] = useState({});
  const [versionHistory, setVersionHistory] = useState([]);
  const [cacheStatus, setCacheStatus] = useState('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'card'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Performance optimization
  const autoSaveTimeoutRef = useRef(null);
  const formChangeTimeoutRef = useRef(null);
  const lastFormDataRef = useRef(null);

  // Draft recovery state
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const tabList = useMemo(() => [
    { key: 'details', label: 'Details', icon: <List className="w-5 h-5" />, description: 'Basic post information' },
    { key: 'content', label: 'Content', icon: <Edit className="w-5 h-5" />, description: 'Write and edit post content' },
    { key: 'meta', label: 'Meta & SEO', icon: <Calendar className="w-5 h-5" />, description: 'SEO and metadata settings' },
    { key: 'preview', label: 'Preview', icon: <Eye className="w-5 h-5" />, description: 'Preview your post' }
  ], []);
  const tabRefs = useRef([]);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Web Development',
    tags: '',
    featured_image: '',
    status: 'draft',
    // Enhanced fields
    slug: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    socialTitle: '',
    socialDescription: '',
    socialImage: '',
    publishDate: '',
    scheduledDate: '',
    author: currentUser?.displayName || currentUser?.email || '',
    authorId: currentUser?.uid || '',
    readingTime: 0,
    wordCount: 0,
    priority: 'normal', // 'low', 'normal', 'high', 'urgent'
    visibility: 'public', // 'public', 'private', 'password', 'members'
    password: '',
    allowComments: true,
    allowSharing: true,
    featured: false,
    sticky: false,
    template: 'default',
    customCSS: '',
    customJS: '',
    relatedPosts: [],
    series: '',
    seriesOrder: 0,
    language: 'en',
    translations: {},
    analytics: {
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0
    },
    seo: {
      score: 0,
      issues: [],
      suggestions: []
    },
    version: 1,
    revisionNotes: ''
  });

  const categories = useMemo(() => [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'AI/ML',
    'DevOps',
    'UI/UX Design',
    'Backend Development',
    'Frontend Development',
    'Full Stack Development',
    'Technology News',
    'Programming Tips',
    'Career Advice',
    'Industry Insights',
    'Tutorial',
    'Review',
    'Opinion',
    'Case Study',
    'Best Practices',
    'Tools & Resources',
    'Open Source'
  ], []);

  // Add filter buttons for status
  const statusFilters = useMemo(() => [
    { value: 'all', label: 'All Posts' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Drafts' },
    { value: 'archived', label: 'Archived' },
    { value: 'deleted', label: 'Deleted' }
  ], []);

  // Check for recoverable drafts on component mount
  useEffect(() => {
    const checkRecoverableDrafts = async () => {
      try {
        const recoverableDrafts = await enhancedApiService.getRecoverableDrafts();
        if (recoverableDrafts.length > 0) {
          // Show recovery modal after a short delay to let the component settle
          setTimeout(() => {
            setShowDraftRecovery(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking recoverable drafts:', error);
      }
    };

    checkRecoverableDrafts();
  }, []);

  // Enhanced notification system
  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const {
      persistent = false,
      actions = [],
      duration = 3000,
      customId = null
    } = options;

    const notification = {
      id: customId || Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      persistent,
      actions,
      duration
    };

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 8); // Keep last 8 for enhanced notifications

      // Auto-remove after specified duration (unless persistent)
      if (!persistent && duration > 0) {
        setTimeout(() => {
          setNotifications(current => current.filter(n => n.id !== notification.id));
        }, duration);
      }

      return updated;
    });

    // Log error notifications for debugging
    if (type === 'error') {
      console.error('Notification Error:', {
        message,
        timestamp: notification.timestamp,
        actions: actions.length,
        persistent
      });
    }
  }, []);

  // Enhanced blog services initialization
  useEffect(() => {
    const initializeEnhancedServices = async () => {
      try {
        // Initialize blog authentication
        if (currentUser) {
          const token = await currentUser.getIdToken();
          const authResult = await blogAuthService.authenticateUser(token);
          setBlogSession(authResult.session);
          setUserPermissions(authResult.permissions);
        }

        // Initialize caching service
        setCacheStatus('initializing');
        await blogCachingService.initialize();
        setCacheStatus('ready');

        // Load cached posts if available
        const cachedPosts = await blogCachingService.getCachedPosts();
        if (cachedPosts && cachedPosts.length > 0) {
          setPosts(cachedPosts);
          setLoading(false);
        }
      } catch (error) {
        console.error('Enhanced services initialization error:', error);
        setCacheStatus('error');
      }
    };

    initializeEnhancedServices();
  }, [currentUser]);

  // Real-time connection and event management
  useEffect(() => {
    // Subscribe to real-time events
    const unsubscribeConnection = realTimeFeaturesService.addEventListener('connection_changed', (data) => {
      setIsConnected(data.status === 'connected');
    });

    const unsubscribeBlogCreated = realTimeFeaturesService.addEventListener('blog_created', (blog) => {
      if (!blog._isOptimistic && blog.author_name !== currentUser?.displayName) {
        setPosts(prevPosts => {
          // Check if post already exists (handle optimistic updates)
          const existingIndex = prevPosts.findIndex(p =>
            p.id === blog.id || p.id === blog._wasOptimistic
          );

          if (existingIndex >= 0) {
            const newPosts = [...prevPosts];
            newPosts[existingIndex] = blog;
            return newPosts;
          } else {
            return [blog, ...prevPosts];
          }
        });
        addRealTimeNotification('New blog post created by another user');
      }
    });

    const unsubscribeBlogUpdated = realTimeFeaturesService.addEventListener('blog_updated', (blog) => {
      if (!blog._isOptimistic && blog.author_name !== currentUser?.displayName) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === blog.id || post.id === blog._wasOptimistic ? blog : post
          )
        );
        addRealTimeNotification('Blog post updated by another user');
      }
    });

    const unsubscribeBlogDeleted = realTimeFeaturesService.addEventListener('blog_deleted', (data) => {
      setPosts(prevPosts => prevPosts.filter(post => post.id !== data.id));
      addRealTimeNotification('Blog post deleted');
    });

    const unsubscribeBlogPublished = realTimeFeaturesService.addEventListener('blog_published', (blog) => {
      if (blog.author_name !== currentUser?.displayName) {
        addRealTimeNotification('New blog post published!');
      }
    });

    const unsubscribeDraftAcknowledged = realTimeFeaturesService.addEventListener('draft_acknowledged', (data) => {
      if (editingPost?.id === data.id) {
        setDraftSaveStatus('saved');
        setLastSaved(new Date(data.timestamp));
      }
    });

    // Set initial connection status
    const status = realTimeFeaturesService.getStatus();
    setIsConnected(status.isOnline && status.isAvailable);

    // Cleanup subscriptions
    return () => {
      if (unsubscribeConnection) realTimeFeaturesService.removeEventListener('connection_changed', unsubscribeConnection);
      if (unsubscribeBlogCreated) realTimeFeaturesService.removeEventListener('blog_created', unsubscribeBlogCreated);
      if (unsubscribeBlogUpdated) realTimeFeaturesService.removeEventListener('blog_updated', unsubscribeBlogUpdated);
      if (unsubscribeBlogDeleted) realTimeFeaturesService.removeEventListener('blog_deleted', unsubscribeBlogDeleted);
      if (unsubscribeBlogPublished) realTimeFeaturesService.removeEventListener('blog_published', unsubscribeBlogPublished);
      if (unsubscribeDraftAcknowledged) realTimeFeaturesService.removeEventListener('draft_acknowledged', unsubscribeDraftAcknowledged);
    };
  }, [currentUser?.displayName, editingPost?.id]);

  // Cross-domain synchronization setup
  useEffect(() => {
    let crossDomainInitialized = false;

    const initializeCrossDomainSync = async () => {
      try {
        // Ensure cross-domain sync service is initialized
        if (!crossDomainSyncService.isInitialized) {
          await crossDomainSyncService.initialize();
        }
        crossDomainInitialized = true;
        console.log('Cross-domain sync initialized for BlogManager');
      } catch (error) {
        console.error('Failed to initialize cross-domain sync:', error);
      }
    };

    // Initialize cross-domain sync
    initializeCrossDomainSync();

    // Listen for cross-domain blog updates
    const handleCrossDomainMessage = (event) => {
      if (event.data?.type === 'BLOG_UPDATE') {
        const { changeType, payload } = event.data.data;

        switch (changeType) {
          case 'BLOG_PUBLISHED':
            // Update local state when a blog is published
            setPosts(prevPosts => {
              const existingIndex = prevPosts.findIndex(p => p.id === payload.id);
              if (existingIndex >= 0) {
                const newPosts = [...prevPosts];
                newPosts[existingIndex] = { ...newPosts[existingIndex], ...payload };
                return newPosts;
              }
              return prevPosts;
            });
            addRealTimeNotification('Blog post published and synced to website!');
            break;

          case 'BLOG_UPDATED':
            // Handle blog updates from other sources
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === payload.id ? { ...post, ...payload } : post
              )
            );
            break;

          case 'POSTS_SYNC':
            // Handle full posts synchronization
            if (payload.posts && Array.isArray(payload.posts)) {
              setPosts(payload.posts);
            }
            break;
        }
      }
    };

    // Add message listener for cross-domain communication
    window.addEventListener('message', handleCrossDomainMessage);

    return () => {
      window.removeEventListener('message', handleCrossDomainMessage);
    };
  }, []);

  // Scheduling service integration
  useEffect(() => {
    const initializeSchedulingService = async () => {
      try {
        // Start the scheduling service
        await schedulingService.start();

        // Load scheduled posts on component mount
        const loadScheduledPosts = () => {
          const scheduled = schedulingService.getScheduledPosts();
          setScheduledPosts(scheduled);
        };

        // Initial load
        loadScheduledPosts();

        // Set up interval to refresh scheduled posts
        const refreshInterval = setInterval(loadScheduledPosts, 30000); // Every 30 seconds

        return () => {
          clearInterval(refreshInterval);
        };
      } catch (error) {
        console.error('Failed to initialize scheduling service:', error);
      }
    };

    let cleanup;
    initializeSchedulingService().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Enhanced auto-save functionality with better state management
  const handleAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !formData.title?.trim() || autoSaving) {
      return;
    }

    // Track previous state for recovery
    const previousDraftStatus = draftSaveStatus;
    setAutoSaving(true);
    setDraftSaveStatus('saving');

    try {
      const draftData = {
        ...formData,
        id: editingPost?.id,
        author_name: currentUser?.displayName || 'Admin User',
        // Enhanced auto-save metadata
        last_modified: new Date().toISOString(),
        draft_saved_at: new Date().toISOString(),
        draft_version: (editingPost?.draft_version || 0) + 1,
        auto_save: true, // Auto-save flag
        previous_status: editingPost?.status || 'draft',
        save_source: 'auto',
        form_completion: {
          title: !!formData.title?.trim(),
          content: !!formData.content?.trim(),
          excerpt: !!formData.excerpt?.trim(),
          category: !!formData.category?.trim(),
          tags: !!formData.tags?.trim()
        }
      };

      const result = await enhancedApiService.saveDraft(draftData, true); // true for auto-save

      setDraftSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Update editing post with auto-save metadata
      if (editingPost && result.data) {
        setEditingPost(prev => ({
          ...prev,
          ...result.data,
          draft_version: draftData.draft_version,
          form_completion: draftData.form_completion,
          last_auto_save: new Date().toISOString()
        }));
      }

    } catch (error) {
      console.error('Auto-save failed:', error);

      // Graceful error handling for auto-save
      if (error.code === 'network-request-failed') {
        setDraftSaveStatus('offline');
      } else {
        setDraftSaveStatus(previousDraftStatus !== 'saving' ? previousDraftStatus : 'error');
      }
      // Don't show notification for auto-save failures to avoid spam
    } finally {
      setAutoSaving(false);
    }
  }, [formData, editingPost, currentUser, hasUnsavedChanges, autoSaving, draftSaveStatus]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (hasUnsavedChanges && editingPost && formData.title) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [hasUnsavedChanges, editingPost, formData.title, handleAutoSave]);

  // Load posts with enhanced API
  // Set up real-time listener for posts
  useEffect(() => {
    setLoading(true);
    const unsubscribe = blogDataService.listenToPosts((result) => {
      if (result.success) {
        setPosts(result.data);
      } else {
        console.error('Real-time listener error:', result.error);
        showNotification(result.error || 'Failed to sync posts in real-time', 'error');
      }
      setLoading(false);
    }, {
      status: filterStatus !== 'all' ? filterStatus : null,
      limit: 100
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [filterStatus, showNotification]);

  // Show real-time notification helper
  const addRealTimeNotification = useCallback((message) => {
    setRealTimeUpdates(prev => [
      { id: Date.now(), message, timestamp: new Date() },
      ...prev.slice(0, 4) // Keep only last 5 notifications
    ]);
    setShowRealTimeNotification(true);
    setTimeout(() => setShowRealTimeNotification(false), 3000);
  }, []);

  // Enhanced form reset (moved here to avoid temporal dead zone)
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: 'Web Development',
      tags: '',
      featured_image: '',
      status: 'draft'
    });
    setEditingPost(null);
    setImageUpload(null);
    setUploadProgress(0);
    setActiveTab('details');
    setHasUnsavedChanges(false);
    setDraftSaveStatus('saved');
    setLastSaved(null);
    lastFormDataRef.current = null;

    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    // Clear form change timeout
    if (formChangeTimeoutRef.current) {
      clearTimeout(formChangeTimeoutRef.current);
      formChangeTimeoutRef.current = null;
    }
  }, []);

  const loadPosts = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff

    try {
      setLoading(true);

      const postsData = await blogDataService.getPosts({
        status: filterStatus !== 'all' ? filterStatus : null,
        limit: 100,
        page: 1
      });

      setPosts(postsData);

      // Clear any retry notifications on success
      if (retryCount > 0) {
        showNotification('Posts loaded successfully after retry');
      }

    } catch (error) {
      console.error(`Error loading posts (attempt ${retryCount + 1}):`, error);

      let errorMessage = 'Unable to load posts';
      let shouldRetry = false;

      // Categorize errors and determine retry strategy
      if (error.code === 'network-request-failed' || error.name === 'NetworkError') {
        errorMessage = 'Network error - please check your connection';
        shouldRetry = retryCount < maxRetries;
      } else if (error.code === 'unavailable' || error.message?.includes('timeout')) {
        errorMessage = 'Service temporarily unavailable';
        shouldRetry = retryCount < maxRetries;
      } else if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to view posts';
      } else if (error.message) {
        errorMessage = error.message;
        // Retry for generic errors that might be transient
        shouldRetry = retryCount < maxRetries && !error.message.includes('Invalid');
      }

      // Attempt retry with exponential backoff
      if (shouldRetry) {
        showNotification(`${errorMessage}. Retrying in ${Math.ceil(retryDelay / 1000)}s... (${retryCount + 1}/${maxRetries})`);

        setTimeout(() => {
          loadPosts(retryCount + 1);
        }, retryDelay);

        return; // Don't set final error state yet
      }

      // Final error handling
      showNotification(errorMessage);

      // Try to load from cache as fallback
      try {
        const cachedPosts = await blogCachingService?.getCachedPosts?.();
        if (cachedPosts && Array.isArray(cachedPosts) && cachedPosts.length > 0) {
          setPosts(cachedPosts);
          showNotification('Loaded posts from cache due to network issues');
        } else {
          setPosts([]);
        }
      } catch (cacheError) {
        console.warn('Failed to load from cache:', cacheError);
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus, showNotification]);

  // Real-time validation function
  const validateField = useCallback((field, value, allData = formData) => {
    const errors = {};

    switch (field) {
      case 'title':
        if (!value?.trim()) {
          errors.title = 'Title is required';
        } else if (value.trim().length < 3) {
          errors.title = 'Title must be at least 3 characters long';
        } else if (value.trim().length > 200) {
          errors.title = 'Title must be less than 200 characters';
        }
        break;

      case 'excerpt':
        if (!value?.trim()) {
          errors.excerpt = 'Excerpt is required';
        } else if (value.trim().length < 10) {
          errors.excerpt = 'Excerpt must be at least 10 characters long';
        } else if (value.trim().length > 500) {
          errors.excerpt = 'Excerpt must be less than 500 characters';
        }
        break;

      case 'content':
        if (!value?.trim() || value === '<p><br></p>' || value === '<p></p>') {
          errors.content = 'Content is required';
        } else if (value.trim().length < 50) {
          errors.content = 'Content must be at least 50 characters long';
        }
        break;

      case 'category':
        if (!value?.trim()) {
          errors.category = 'Category is required';
        }
        break;

      case 'tags':
        if (value?.trim()) {
          const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
          if (tags.length > 10) {
            errors.tags = 'Maximum 10 tags allowed';
          }
          const invalidTags = tags.filter(tag => tag.length < 2 || tag.length > 30);
          if (invalidTags.length > 0) {
            errors.tags = 'Each tag must be 2-30 characters long';
          }
        }
        break;
    }

    return errors;
  }, [formData]);

  // Validate entire form
  const validateForm = useCallback((data = formData) => {
    setIsValidating(true);

    const allErrors = {};

    ['title', 'excerpt', 'content', 'category', 'tags'].forEach(field => {
      const fieldErrors = validateField(field, data[field], data);
      Object.assign(allErrors, fieldErrors);
    });

    setValidationErrors(allErrors);
    setIsFormValid(Object.keys(allErrors).length === 0);
    setIsValidating(false);

    return allErrors;
  }, [formData, validateField]);

  // Handle form data changes with auto-save triggering and real-time validation
  const handleFormDataChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Real-time validation for the changed field
      setIsValidating(true);
      const fieldErrors = validateField(field, value, newData);
      setValidationErrors(prevErrors => {
        const updatedErrors = { ...prevErrors };
        if (Object.keys(fieldErrors).length > 0) {
          Object.assign(updatedErrors, fieldErrors);
        } else {
          delete updatedErrors[field];
        }

        // Update form validity
        setIsFormValid(Object.keys(updatedErrors).length === 0);
        setIsValidating(false);

        return updatedErrors;
      });

      // Check if data actually changed
      const currentDataStr = JSON.stringify(newData);
      const lastDataStr = JSON.stringify(lastFormDataRef.current);

      if (currentDataStr !== lastDataStr) {
        setHasUnsavedChanges(true);
        setDraftSaveStatus('unsaved');
        lastFormDataRef.current = newData;
      }

      return newData;
    });
  }, [validateField]);

  // Handle image upload with enhanced API
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return null;

    try {
      setUploadProgress(0);

      const response = await enhancedApiService.uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success) {
        return response.data.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadProgress(0);
    }
  }, []);



  // Enhanced form submission with comprehensive validation and error handling
  const handleSubmit = useCallback(async (e, publishImmediately = false) => {
    e.preventDefault();

    // Use the comprehensive validation system
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors);
      showNotification('Please fix the following errors: ' + errorMessages.join(', '), 'error');
      return;
    }

    // Enhanced state management for draft-to-publish transitions
    const previousStatus = editingPost?.status || 'draft';
    const newStatus = publishImmediately ? 'published' : formData.status;
    const isStatusChange = previousStatus !== newStatus;

    setLoading(true);

    // Show progress notification with state transition info
    const actionText = editingPost ? 'Updating' : 'Creating';
    const statusText = publishImmediately ? 'and publishing' : '';
    const transitionText = isStatusChange && previousStatus === 'draft' && newStatus === 'published'
      ? ' (transitioning from draft to published)' : '';
    showNotification(`${actionText} post ${statusText}${transitionText}...`, 'info');

    try {
      let imageUrl = formData.featured_image;

      // Upload image if selected
      if (imageUpload) {
        try {
          imageUrl = await handleImageUpload(imageUpload);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          showNotification('Image upload failed: ' + uploadError.message);
          setLoading(false);
          return;
        }
      }

      const postData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featured_image: imageUrl,
        status: publishImmediately ? 'published' : formData.status,
        author_name: currentUser?.displayName || 'Admin User',
        // Enhanced state tracking for transitions
        previous_status: previousStatus,
        status_changed_at: isStatusChange ? new Date().toISOString() : editingPost?.status_changed_at,
        draft_to_publish_transition: previousStatus === 'draft' && newStatus === 'published',
        last_modified: new Date().toISOString(),
        // Preserve draft metadata during transitions
        draft_saved_at: editingPost?.draft_saved_at,
        draft_version: editingPost?.draft_version || 1
      };

      let response;
      let originalPost = null;

      // Store original post for potential rollback
      if (editingPost) {
        originalPost = posts.find(p => p.id === editingPost.id);

        // Apply optimistic update immediately
        const optimisticUpdates = {
          ...postData,
          updated_at: new Date().toISOString(),
          optimistic: true
        };
        applyOptimisticUpdate(editingPost.id, optimisticUpdates);
      }

      try {
        if (editingPost) {
          // Update existing post
          response = await blogDataService.updatePost(editingPost.id, postData);
        } else {
          // Create new post
          if (publishImmediately) {
            postData.status = 'published';
            postData.published_at = new Date().toISOString();
          }
          response = await blogDataService.createPost(postData);
        }

        if (response?.success) {
          // Enhanced draft cleanup and state management
          if (editingPost?.id) {
            try {
              // Only clear local draft if successfully published
              if (newStatus === 'published') {
                enhancedApiService.clearLocalDraft(editingPost.id);
              }
            } catch (clearError) {
              console.warn('Failed to clear local draft:', clearError);
            }
          }

          // Clear unsaved changes flag and update state
          setHasUnsavedChanges(false);
          setDraftSaveStatus(newStatus === 'published' ? 'published' : 'saved');

          // Track state transition completion
          if (isStatusChange) {
            console.log(`State transition completed: ${previousStatus} → ${newStatus}`);
          }

          // Update with actual server response
          if (editingPost && response.data) {
            setPosts(prevPosts =>
              prevPosts.map(post =>
                post.id === editingPost.id
                  ? { ...response.data, optimistic: false }
                  : post
              )
            );
          } else if (!editingPost && response.data) {
            // Add new post to the list
            setPosts(prevPosts => [response.data, ...prevPosts]);
          }

          resetForm();
          setShowForm(false);

          // Show detailed success message with state transition info
          const actionText = editingPost ? 'updated' : 'created';
          const statusText = publishImmediately ? ' and published' : '';
          const transitionText = isStatusChange && previousStatus === 'draft' && newStatus === 'published'
            ? ' (successfully transitioned from draft to published)' : '';
          const postTitle = formData.title.length > 30 ? formData.title.substring(0, 30) + '...' : formData.title;
          showNotification(`"${postTitle}" ${actionText}${statusText} successfully!${transitionText}`, 'success');

          // Trigger sync with live site if published
          if (newStatus === 'published') {
            blogDataService.triggerSyncWithLiveSite();
          }

          // Enhanced analytics tracking with state transitions
          if (window.gtag) {
            window.gtag('event', editingPost ? 'post_updated' : 'post_created', {
              'event_category': 'Blog Management',
              'event_label': publishImmediately ? 'published' : 'draft',
              'custom_parameters': {
                'status_transition': isStatusChange ? `${previousStatus}_to_${newStatus}` : 'no_change',
                'draft_to_publish': previousStatus === 'draft' && newStatus === 'published'
              }
            });
          }
        } else {
          throw new Error(response?.message || 'Operation failed - please try again');
        }
      } catch (apiError) {
        // Rollback optimistic update on failure
        if (editingPost && originalPost) {
          rollbackOptimisticUpdate(editingPost.id, originalPost);
        }
        throw apiError;
      }
    } catch (error) {
      console.error('Error saving post:', error);

      // Enhanced error handling with specific error types and recovery options
      let errorMessage = 'An unexpected error occurred';
      let canRetry = true;
      let recoveryActions = [];
      let errorType = 'unknown';

      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to perform this action';
        errorType = 'permission';
        canRetry = false;
        recoveryActions = ['Contact administrator for access'];
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error - please check your connection and try again';
        errorType = 'network';
        recoveryActions = ['Check internet connection', 'Try again in a moment'];
      } else if (error.code === 'quota-exceeded') {
        errorMessage = 'Storage quota exceeded - please contact administrator';
        errorType = 'quota';
        canRetry = false;
        recoveryActions = ['Contact administrator to increase quota'];
      } else if (error.message?.includes('duplicate')) {
        errorMessage = 'A post with this title already exists';
        errorType = 'duplicate';
        recoveryActions = ['Change post title', 'Check existing posts'];
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show enhanced notification with recovery options
      showNotification(`Error: ${errorMessage}`, 'error', {
        persistent: errorType === 'permission' || errorType === 'quota',
        actions: canRetry ? [
          {
            label: 'Retry',
            action: () => handleSubmit(e, true)
          },
          {
            label: 'Save as Draft',
            action: () => {
              const draftData = { ...formData, status: 'draft' };
              handleSaveDraft(draftData);
            }
          }
        ] : recoveryActions.map(action => ({
          label: action,
          action: () => console.log('Recovery guidance:', action)
        })),
        duration: canRetry ? 8000 : 12000
      });

      // Attempt draft fallback save if original operation failed
      if (canRetry && formData.status !== 'draft' && errorType !== 'duplicate') {
        try {
          const draftData = { ...formData, status: 'draft' };
          await handleSaveDraft(draftData);
          showNotification('Content saved as draft due to publish error', 'warning', {
            duration: 6000
          });
        } catch (draftError) {
          console.error('Draft fallback failed:', draftError);
          showNotification('Unable to save draft - please copy your content', 'error', {
            persistent: true
          });
        }
      }

      // Enhanced analytics tracking for errors
      if (window.gtag) {
        window.gtag('event', 'post_save_error', {
          'event_category': 'Blog Management',
          'event_label': error.code || 'unknown_error',
          'custom_parameters': {
            'error_type': errorType,
            'can_retry': canRetry,
            'recovery_actions_count': recoveryActions.length,
            'post_status': formData.status,
            'is_edit': !!editingPost
          }
        });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, imageUpload, editingPost, currentUser, handleImageUpload, loadPosts, resetForm, showNotification]);

  // Quick publish function
  const handleQuickPublish = useCallback((e) => {
    handleSubmit(e, true);
  }, [handleSubmit]);

  // Optimistic update helper function
  const applyOptimisticUpdate = useCallback((postId, updates) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, ...updates, optimistic: true }
          : post
      )
    );
  }, []);

  // Rollback optimistic update on failure
  const rollbackOptimisticUpdate = useCallback((postId, originalPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...originalPost, optimistic: false }
          : post
      )
    );
  }, []);

  // Enhanced edit functionality with optimistic updates
  const handleEdit = useCallback((post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'Web Development',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      featured_image: post.featured_image || '',
      status: post.status || 'draft'
    });
    setShowForm(true);
    setActiveTab('details');
    setHasUnsavedChanges(false);
    setDraftSaveStatus('saved');
    setLastSaved(post.updated_at ? new Date(post.updated_at) : null);

    // Store initial form data for comparison
    lastFormDataRef.current = {
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'Web Development',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      featured_image: post.featured_image || '',
      status: post.status || 'draft'
    };
  }, []);

  // Enhanced delete with modal confirmation and optimistic updates
  const handleDeleteClick = useCallback((post) => {
    if (!post?.id) {
      showNotification('Invalid post - cannot delete', 'error');
      return;
    }

    setDeleteModal({ isOpen: true, post });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const { post } = deleteModal;
    if (!post?.id) return;

    const postId = post.id;
    const truncatedTitle = post.title?.length > 50
      ? post.title.substring(0, 50) + '...'
      : post.title || 'Untitled Post';

    try {
      setDeleteLoading(true);

      // Store original post for potential rollback
      const originalPost = posts.find(p => p.id === postId);
      if (!originalPost) {
        throw new Error('Post not found - it may have already been deleted');
      }

      // Apply optimistic update - immediately remove from UI
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      showNotification('Deleting post...', 'info');

      // Use enhanced API for better error handling
      const response = await blogDataService.deletePost(postId);

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to delete post - server error');
      }

      // Clear from local drafts if it exists
      try {
        enhancedApiService.clearLocalDraft(postId);
      } catch (clearError) {
        console.warn('Failed to clear local draft:', clearError);
      }

      showNotification(`"${truncatedTitle}" deleted successfully`, 'success');

      // Analytics tracking
      if (window.gtag) {
        window.gtag('event', 'post_deleted', {
          'event_category': 'Blog Management',
          'event_label': originalPost.status || 'unknown'
        });
      }

    } catch (error) {
      console.error('Error deleting post:', error);

      // Rollback optimistic update on error
      setPosts(prevPosts => {
        const exists = prevPosts.find(p => p.id === postId);
        return exists ? prevPosts : [...prevPosts, originalPost].sort((a, b) =>
          new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
        );
      });

      let errorMessage = 'Failed to delete post';

      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to delete this post';
      } else if (error.code === 'not-found') {
        errorMessage = 'Post not found - it may have already been deleted';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error - please check your connection and try again';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(`Error: ${errorMessage}`, 'error');

      // Analytics tracking for errors
      if (window.gtag) {
        window.gtag('event', 'post_delete_error', {
          'event_category': 'Blog Management',
          'event_label': error.code || 'unknown_error'
        });
      }
    } finally {
      setDeleteLoading(false);
      setDeleteModal({ isOpen: false, post: null });
    }
  }, [deleteModal, posts, showNotification]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModal({ isOpen: false, post: null });
  }, []);

  // Enhanced publish/unpublish toggle with comprehensive validation
  const handleToggleStatus = useCallback(async (post) => {
    if (!post?.id) {
      showNotification('Invalid post data - cannot change status', 'error');
      return;
    }

    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const actionText = newStatus === 'published' ? 'publish' : 'unpublish';
    const truncatedTitle = post.title?.length > 40 ? post.title.substring(0, 40) + '...' : post.title;

    // Pre-publish validation for publishing
    if (newStatus === 'published') {
      const validationErrors = [];

      if (!post.title?.trim() || post.title.trim().length < 3) {
        validationErrors.push('Title must be at least 3 characters');
      }

      if (!post.excerpt?.trim() || post.excerpt.trim().length < 10) {
        validationErrors.push('Excerpt must be at least 10 characters');
      }

      if (!post.content?.trim() || post.content.trim().length < 50) {
        validationErrors.push('Content must be at least 50 characters');
      }

      if (!post.category?.trim()) {
        validationErrors.push('Category is required');
      }

      if (validationErrors.length > 0) {
        showNotification(`Cannot publish: ${validationErrors.join(', ')}`, 'error');
        return;
      }
    }

    const confirmMessage = newStatus === 'published'
      ? `📢 PUBLISH CONFIRMATION\n\nPublish "${truncatedTitle}"?\n\nThis will make the post visible to all visitors on your website.`
      : `📝 UNPUBLISH CONFIRMATION\n\nUnpublish "${truncatedTitle}"?\n\nThis will hide the post from your website visitors.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      showNotification(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ing post...`, 'info');

      const updateData = {
        status: newStatus,
        ...(newStatus === 'published' && {
          published_at: new Date().toISOString(),
          last_modified: new Date().toISOString()
        }),
        ...(newStatus === 'draft' && {
          unpublished_at: new Date().toISOString(),
          last_modified: new Date().toISOString()
        })
      };

      const response = await blogDataService.updatePost(post.id, updateData);

      if (!response?.success) {
        throw new Error(response?.message || `Failed to ${actionText} post - server error`);
      }

      showNotification(`"${truncatedTitle}" ${actionText}ed successfully!`, 'success');

      // Trigger sync with live site if published
      if (newStatus === 'published') {
        blogDataService.triggerSyncWithLiveSite();
      }

      await loadPosts();

      // Analytics tracking
      if (window.gtag) {
        window.gtag('event', `post_${actionText}ed`, {
          'event_category': 'Blog Management',
          'event_label': post.category || 'uncategorized'
        });
      }

    } catch (error) {
      console.error(`Error ${actionText}ing post:`, error);

      let errorMessage = `Failed to ${actionText} post`;

      if (error.code === 'permission-denied') {
        errorMessage = `You do not have permission to ${actionText} this post`;
      } else if (error.code === 'not-found') {
        errorMessage = 'Post not found - it may have been deleted';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error - please check your connection and try again';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(`Error: ${errorMessage}`, 'error');

      // Analytics tracking for errors
      if (window.gtag) {
        window.gtag('event', `post_${actionText}_error`, {
          'event_category': 'Blog Management',
          'event_label': error.code || 'unknown_error'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loadPosts, showNotification]);

  // Handle form field changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    handleFormDataChange(name, value);
  }, [handleFormDataChange]);

  // Handle content change (for ReactQuill)
  const handleContentChange = useCallback((value) => {
    handleFormDataChange('content', value);
  }, [handleFormDataChange]);

  // Handle image selection
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setImageUpload(file);
      setHasUnsavedChanges(true);

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        handleFormDataChange('featured_image', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [handleFormDataChange]);

  // Enhanced manual draft saving with comprehensive validation and state management
  const handleSaveDraft = useCallback(async () => {
    // Basic validation for draft saving
    const validationErrors = [];

    if (!formData.title?.trim()) {
      validationErrors.push('Title is required');
    } else if (formData.title.trim().length < 3) {
      validationErrors.push('Title must be at least 3 characters');
    }

    if (formData.content?.trim() && formData.content.trim().length < 10) {
      validationErrors.push('Content must be at least 10 characters if provided');
    }

    if (validationErrors.length > 0) {
      showNotification(`Cannot save draft: ${validationErrors.join(', ')}`, 'error');
      return;
    }

    // Track draft save state for better UX
    const previousDraftStatus = draftSaveStatus;
    setLoading(true);
    setDraftSaveStatus('saving');

    try {
      showNotification('Saving draft...', 'info');

      const draftData = {
        ...formData,
        id: editingPost?.id,
        status: 'draft',
        author_name: currentUser?.displayName || 'Admin User',
        last_modified: new Date().toISOString(),
        draft_saved_at: new Date().toISOString(),
        // Enhanced draft metadata for state management
        draft_version: (editingPost?.draft_version || 0) + 1,
        auto_save: false, // Manual save
        previous_status: editingPost?.status || 'draft',
        save_source: 'manual',
        form_completion: {
          title: !!formData.title?.trim(),
          content: !!formData.content?.trim(),
          excerpt: !!formData.excerpt?.trim(),
          category: !!formData.category?.trim(),
          tags: !!formData.tags?.trim()
        }
      };

      const result = await enhancedApiService.saveDraft(draftData, false);

      // Enhanced state management after successful save
      setHasUnsavedChanges(false);
      setDraftSaveStatus('saved');
      setLastSaved(new Date());

      // Update editing post and preserve state for seamless transitions
      if (!editingPost && result.data) {
        setEditingPost({
          ...result.data,
          draft_version: draftData.draft_version,
          form_completion: draftData.form_completion
        });
      } else if (editingPost && result.data) {
        setEditingPost(prev => ({
          ...prev,
          ...result.data,
          draft_version: draftData.draft_version,
          form_completion: draftData.form_completion
        }));
      }

      const titlePreview = formData.title.length > 30 ? formData.title.substring(0, 30) + '...' : formData.title;

      // Provide appropriate feedback based on save result
      if (result.source === 'local' && result.queued) {
        showNotification(`Draft "${titlePreview}" saved locally and queued for sync when connection is restored.`, 'warning');
      } else if (result.source === 'local') {
        showNotification(`Draft "${titlePreview}" saved locally.`, 'info');
      } else {
        showNotification(`Draft "${titlePreview}" saved successfully!`, 'success');
      }

      // Analytics tracking
      if (window.gtag) {
        window.gtag('event', 'draft_saved', {
          'event_category': 'Blog Management',
          'event_label': 'manual_save',
          'custom_parameters': {
            'save_source': result.source,
            'queued_for_sync': result.queued || false
          }
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);

      let errorMessage = 'Failed to save draft';
      let fallbackStatus = 'error';

      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to save drafts';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error - draft saved locally, will sync when online';
        fallbackStatus = 'offline'; // Better status for offline saves
      } else if (error.code === 'quota-exceeded') {
        errorMessage = 'Storage quota exceeded - please contact administrator';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showNotification(`Error: ${errorMessage}`, 'error');

      // Graceful fallback - revert to previous status if possible
      setDraftSaveStatus(fallbackStatus === 'offline' ? 'offline' :
        (previousDraftStatus !== 'saving' ? previousDraftStatus : 'error'));

      // Analytics tracking for errors
      if (window.gtag) {
        window.gtag('event', 'draft_save_error', {
          'event_category': 'Blog Management',
          'event_label': error.code || 'unknown_error'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [formData, editingPost, currentUser, showNotification]);

  // Handle draft recovery
  const handleRecoverDraft = useCallback(async (recoveredData) => {
    try {
      setFormData({
        title: recoveredData.title || '',
        content: recoveredData.content || '',
        excerpt: recoveredData.excerpt || '',
        tags: recoveredData.tags || '',
        category: recoveredData.category || '',
        featured_image: recoveredData.featured_image || '',
        slug: recoveredData.slug || '',
        metaTitle: recoveredData.metaTitle || '',
        metaDescription: recoveredData.metaDescription || '',
        metaKeywords: recoveredData.metaKeywords || '',
        canonicalUrl: recoveredData.canonicalUrl || '',
        socialTitle: recoveredData.socialTitle || '',
        socialDescription: recoveredData.socialDescription || '',
        socialImage: recoveredData.socialImage || '',
        publishDate: recoveredData.publishDate || '',
        status: recoveredData.status || 'draft',
        visibility: recoveredData.visibility || 'public',
        allowComments: recoveredData.allowComments !== undefined ? recoveredData.allowComments : true,
        stickyPost: recoveredData.stickyPost || false,
        customFields: recoveredData.customFields || {},
        quality: recoveredData.quality || { score: 0, issues: [], suggestions: [] },
        seo: recoveredData.seo || { score: 0, issues: [], suggestions: [] },
        version: recoveredData.version || 1,
        revisionNotes: recoveredData.revisionNotes || ''
      });

      if (recoveredData.id && recoveredData.id !== 'new') {
        setEditingPost({ ...recoveredData, id: recoveredData.id });
      } else {
        setEditingPost(null);
      }

      setShowForm(true);
      setHasUnsavedChanges(true);
      setShowDraftRecovery(false);

      const titlePreview = recoveredData.title?.length > 30 ?
        recoveredData.title.substring(0, 30) + '...' :
        recoveredData.title || 'Untitled Draft';

      showNotification(`Draft "${titlePreview}" recovered successfully! You can continue editing.`, 'success');

    } catch (error) {
      console.error('Error recovering draft:', error);
      showNotification('Failed to recover draft. Please try again.', 'error');
    }
  }, [showNotification]);

  // Enhanced notification system with different types
  const showEnhancedNotification = useCallback((message, type = 'info', duration = 5000) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };

    // Store notification for potential retry actions
    if (type === 'error') {
      localStorage.setItem('lastError', JSON.stringify(notification));
    }

    showNotification(message, type);

    // Auto-dismiss non-error notifications
    if (type !== 'error') {
      setTimeout(() => {
        // Could implement notification dismissal here
      }, duration);
    }
  }, [showNotification]);

  // Validate post data comprehensively
  const validatePostData = useCallback((data, isPublishing = false) => {
    const errors = [];
    const warnings = [];

    // Title validation
    if (!data.title?.trim()) {
      errors.push('Title is required');
    } else {
      if (data.title.trim().length < 3) errors.push('Title must be at least 3 characters');
      if (data.title.trim().length > 200) errors.push('Title must be less than 200 characters');
      if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(data.title)) warnings.push('Title contains special characters that may affect SEO');
    }

    // Excerpt validation
    if (isPublishing || data.excerpt?.trim()) {
      if (!data.excerpt?.trim()) {
        errors.push('Excerpt is required for publishing');
      } else {
        if (data.excerpt.trim().length < 10) errors.push('Excerpt must be at least 10 characters');
        if (data.excerpt.trim().length > 500) errors.push('Excerpt must be less than 500 characters');
      }
    }

    // Content validation
    if (isPublishing || data.content?.trim()) {
      if (!data.content?.trim() || data.content === '<p><br></p>' || data.content === '<p></p>') {
        errors.push('Content is required for publishing');
      } else {
        if (data.content.trim().length < 50) errors.push('Content must be at least 50 characters');
        const wordCount = data.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        if (wordCount < 10) warnings.push('Content seems very short for a blog post');
        if (wordCount > 5000) warnings.push('Content is very long - consider breaking into multiple posts');
      }
    }

    // Category validation
    if (isPublishing && !data.category?.trim()) {
      errors.push('Category is required for publishing');
    }

    // Tags validation
    if (data.tags?.trim()) {
      const tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tags.length > 10) errors.push('Maximum 10 tags allowed');

      const invalidTags = tags.filter(tag => tag.length < 2 || tag.length > 30);
      if (invalidTags.length > 0) errors.push('Each tag must be 2-30 characters long');

      const duplicateTags = tags.filter((tag, index) => tags.indexOf(tag) !== index);
      if (duplicateTags.length > 0) warnings.push('Duplicate tags detected');
    }

    // SEO validation
    if (isPublishing) {
      if (!data.featured_image) warnings.push('Featured image recommended for better social sharing');
      if (data.title && data.title.length > 60) warnings.push('Title may be too long for search results');
      if (data.excerpt && data.excerpt.length > 160) warnings.push('Excerpt may be too long for meta description');
    }

    return { errors, warnings };
  }, []);

  // Generate automatic excerpt from content
  const generateExcerpt = useCallback((content, maxLength = 160) => {
    if (!content) return '';

    // Remove HTML tags
    const textContent = content.replace(/<[^>]*>/g, '');

    // Clean up whitespace
    const cleanText = textContent.replace(/\s+/g, ' ').trim();

    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    // Find the last complete sentence within the limit
    const truncated = cleanText.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSentence > maxLength * 0.7) {
      return cleanText.substring(0, lastSentence + 1);
    } else if (lastSpace > maxLength * 0.8) {
      return cleanText.substring(0, lastSpace) + '...';
    } else {
      return truncated + '...';
    }
  }, []);

  // Auto-generate excerpt when content changes
  const handleAutoExcerpt = useCallback(() => {
    if (!formData.excerpt?.trim() && formData.content?.trim()) {
      const autoExcerpt = generateExcerpt(formData.content);
      if (autoExcerpt) {
        handleFormDataChange('excerpt', autoExcerpt);
        showNotification('Auto-generated excerpt from content', 'info');
      }
    }
  }, [formData.content, formData.excerpt, generateExcerpt, handleFormDataChange, showNotification]);


  // Get status badge color
  const getStatusBadgeColor = useCallback((status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Form handlers
  const handleCancelForm = useCallback(() => {
    resetForm();
    setShowForm(false);
  }, [resetForm]);

  // Restore a deleted post
  const handleRestore = useCallback(async (postId) => {
    if (!postId) {
      showNotification('Invalid post ID');
      return;
    }

    if (window.confirm('Are you sure you want to restore this post? This will move it back to Drafts.')) {
      try {
        const response = await enhancedApiService.updatePost(postId, { status: 'draft' });

        if (!response?.success) {
          throw new Error(response?.message || 'Failed to restore post');
        }

        await loadPosts();
        showNotification('Post restored successfully');
      } catch (error) {
        console.error('Error restoring post:', error);
        showNotification('Error restoring post: ' + (error.message || 'Unknown error'));
      }
    }
  }, [loadPosts, showNotification]);

  // Permanently delete a post
  const handlePermanentDelete = useCallback(async (postId) => {
    if (!postId) {
      showNotification('Invalid post ID');
      return;
    }

    if (window.confirm('This will permanently delete the post and it cannot be recovered. Are you absolutely sure?')) {
      try {
        const response = await enhancedApiService.deletePost(postId);

        if (!response?.success) {
          throw new Error(response?.message || 'Failed to permanently delete post');
        }

        await loadPosts();
        showNotification('Post permanently deleted');
      } catch (error) {
        console.error('Error permanently deleting post:', error);
        showNotification('Error permanently deleting post: ' + (error.message || 'Unknown error'));
      }
    }
  }, [loadPosts, showNotification]);

  // Workflow-related functions
  const handleOpenWorkflow = useCallback((post) => {
    setWorkflowPost(post);
    setShowWorkflow(true);
  }, []);

  const handleCloseWorkflow = useCallback(() => {
    setShowWorkflow(false);
    setWorkflowPost(null);
  }, []);

  const handleWorkflowStatusChange = useCallback(async (postId, newStatus, options = {}) => {
    setWorkflowLoading(true);
    try {
      let response;

      if (newStatus === 'scheduled' && options.scheduledTime) {
        // Schedule the post
        response = await schedulingService.schedulePost(postId, options.scheduledTime, {
          user: currentUser?.displayName || 'Admin User',
          workflowHistory: options.workflowHistory,
          ...options
        });

        if (response.success) {
          showNotification(`Post scheduled for ${new Date(options.scheduledTime).toLocaleString()}`, 'success');

          // Refresh scheduled posts
          const scheduled = schedulingService.getScheduledPosts();
          setScheduledPosts(scheduled);
        }
      } else {
        // Regular status update
        const updateData = {
          status: newStatus,
          last_modified: new Date().toISOString(),
          workflow_history: options.workflowHistory || []
        };

        if (newStatus === 'published') {
          updateData.published_at = new Date().toISOString();
        }

        response = await enhancedApiService.updatePost(postId, updateData);
      }

      if (response?.success) {
        // Refresh posts list
        await loadPosts();

        // Update workflow post if it's the same one
        if (workflowPost?.id === postId) {
          const updatedPost = posts.find(p => p.id === postId);
          if (updatedPost) {
            setWorkflowPost(updatedPost);
          }
        }

        showNotification(`Post status updated to ${newStatus}`, 'success');
      } else {
        throw new Error(response?.message || 'Failed to update post status');
      }
    } catch (error) {
      console.error('Error updating workflow status:', error);
      showNotification(`Error updating status: ${error.message}`, 'error');
    } finally {
      setWorkflowLoading(false);
    }
  }, [currentUser, workflowPost, posts, loadPosts, showNotification]);

  const handleSchedulePost = useCallback(async (postId, scheduledTime, options = {}) => {
    try {
      const response = await schedulingService.schedulePost(postId, scheduledTime, {
        user: currentUser?.displayName || 'Admin User',
        ...options
      });

      if (response.success) {
        showNotification(`Post scheduled for ${new Date(scheduledTime).toLocaleString()}`, 'success');

        // Refresh posts and scheduled posts
        await loadPosts();
        const scheduled = schedulingService.getScheduledPosts();
        setScheduledPosts(scheduled);

        return response;
      } else {
        throw new Error('Failed to schedule post');
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
      showNotification(`Error scheduling post: ${error.message}`, 'error');
      throw error;
    }
  }, [currentUser, loadPosts, showNotification]);

  const handleCancelScheduledPost = useCallback(async (postId) => {
    try {
      const response = await schedulingService.cancelScheduledPost(postId);

      if (response.success) {
        showNotification('Scheduled publication cancelled', 'success');

        // Refresh posts and scheduled posts
        await loadPosts();
        const scheduled = schedulingService.getScheduledPosts();
        setScheduledPosts(scheduled);
      } else {
        throw new Error('Failed to cancel scheduled post');
      }
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      showNotification(`Error cancelling schedule: ${error.message}`, 'error');
    }
  }, [loadPosts, showNotification]);

  // Fullscreen scroll/overflow fix
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (formChangeTimeoutRef.current) {
        clearTimeout(formChangeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <BlogErrorBoundary>
      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        {/* Connection Status */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border transition-all duration-300 ${isConnected
            ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-white/10 text-emerald-600'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-600'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isConnected ? 'System Live' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* Professional Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 dark:border-white/5 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1">
              Production Console
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Content Management System
              </p>
              <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <div className="flex items-center gap-2">
                <span className="status-indicator status-online" />
                <span className="text-[11px] text-neutral-400 font-medium">Real-time sync active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Hub */}
            <div className="flex p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-4 py-1.5 rounded-md transition-all text-xs font-semibold flex items-center gap-2 ${filterStatus === filter.value
                    ? 'bg-white dark:bg-neutral-800 shadow-sm text-brand-600 dark:text-brand-400'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                >
                  {filter.label}
                  <span className={`text-[10px] opacity-60`}>
                    {posts.filter(post => filter.value === 'all' || post.status === filter.value).length}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} />
              <span>New Publication</span>
            </button>
          </div>
        </div>

        {/* Enhanced Create/Edit Form */}
        {showForm && (
          <EnhancedBlogEditor
            formData={formData}
            setFormData={setFormData}
            editingPost={editingPost}
            onSave={handleSubmit}
            onCancel={resetForm}
            onSaveDraft={handleSaveDraft}
            hasUnsavedChanges={hasUnsavedChanges}
            autoSaving={autoSaving}
            draftSaveStatus={draftSaveStatus}
            lastSaved={lastSaved}
            validationErrors={validationErrors}
            isValidating={isValidating}
            versionHistory={versionHistory}
            cacheStatus={cacheStatus}
            userPermissions={userPermissions}
            blogSession={blogSession}
          />
        )}

        {/* Posts List */}
        <div className="space-y-4">
          <BlogLoadingState
            loading={loading && !showForm}
            error={authError}
            onRetry={() => {
              clearError();
              loadPosts();
            }}
            message="Loading production queue..."
            timeout={8000}
          >
            {posts.length === 0 ? (
              <div className="pro-card py-24 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-neutral-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No publications found</h3>
                <p className="text-sm text-neutral-500">
                  {filterStatus === 'all'
                    ? "Start your production queue by creating a new post."
                    : `No ${filterStatus} publications matched your filter.`
                  }
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 gap-4">
                  {posts.map((post) => (
                    <PostItem
                      key={post.id}
                      post={post}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onToggleStatus={handleToggleStatus}
                      onRestore={handleRestore}
                      onPermanentDelete={handlePermanentDelete}
                      onOpenWorkflow={handleOpenWorkflow}
                      getStatusBadgeColor={getStatusBadgeColor}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </BlogLoadingState>
        </div>

        {/* Modals */}
        {showWorkflow && workflowPost && (
          <PublishingWorkflow
            post={workflowPost}
            isOpen={showWorkflow}
            onClose={handleCloseWorkflow}
            onStatusChange={handleWorkflowStatusChange}
            onSchedule={handleSchedulePost}
            onCancelSchedule={handleCancelScheduledPost}
            scheduledPosts={scheduledPosts}
            loading={workflowLoading}
            currentUser={currentUser}
          />
        )}

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          postTitle={deleteModal.post?.title}
          loading={deleteLoading}
        />

        <DraftRecoveryModal
          isOpen={showDraftRecovery}
          onClose={() => setShowDraftRecovery(false)}
          onRecover={handleRecoverDraft}
        />
      </div>
    </BlogErrorBoundary>
  );
});

// Production Post Item
const PostItem = React.memo(function PostItem({
  post,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenWorkflow
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="pro-card p-4 group flex items-center gap-6"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-white/5">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="text-neutral-300 dark:text-neutral-600" size={24} />
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${post.status === 'published'
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
            }`}>
            {post.status}
          </span>
          <span className="text-[11px] text-neutral-400 font-medium">
            {post.category || 'Uncategorized'}
          </span>
          {post.status === 'published' && <span className="status-indicator status-online scale-75" />}
        </div>

        <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate group-hover:text-brand-600 transition-colors">
          {post.title}
        </h3>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 grayscale opacity-60">
            <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
              <User size={10} className="text-neutral-500" />
            </div>
            <span className="text-[11px] text-neutral-500 font-medium">{post.author_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock size={12} />
            <span className="text-[11px] font-medium">
              {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Eye size={12} />
            <span className="text-[11px] font-medium">{post.analytics?.views || 0}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
        <button
          onClick={() => onEdit(post)}
          className="p-2 text-neutral-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-all"
          title="Edit"
        >
          <Edit size={16} />
        </button>

        <button
          onClick={() => onOpenWorkflow(post)}
          className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
          title="Workflow"
        >
          <Workflow size={16} />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 dark:bg-white/10 mx-1" />

        <button
          onClick={() => onToggleStatus(post)}
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg transition-all"
          title={post.status === 'published' ? 'Archive' : 'Publish'}
        >
          {post.status === 'published' ? <EyeOff size={16} /> : <Send size={16} />}
        </button>

        <button
          onClick={() => onDelete(post)}
          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
});

export default BlogManager;