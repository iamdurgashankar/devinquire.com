import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';
import analyticsService from '../services/analyticsService';
import blogDataService from '../services/blogDataService';
import userService from '../services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart as CustomLineChart, BarChart as CustomBarChart, DonutChart, AreaChart } from './charts';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { USER_ROLES } from '../services/rbacService';
import {
  FileText,
  Clock,
  Users,
  AlertCircle,
  Plus,
  UserPlus,
  User,
  Edit3,
  Activity,
  BarChart3,
  TrendingUp,
  Eye,
  Calendar,
  Settings,
  Shield,
  Database,
  Globe,
  Zap,
  Target,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BookOpen,
  UserCheck,
  MessageSquare,
  Star,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  ExternalLink
} from 'lucide-react';

// Add CSS animation for real-time updates
const styles = `
  @keyframes fadeInSlide {
    0% {
      opacity: 0;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('dashboard-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="glass-card max-w-2xl w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl">&times;</button>
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardStats({ onTabChange }) {
  console.log('🚀 DashboardStats component mounted');

  // Authentication and role-based access
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || USER_ROLES.USER;

  // Role-based analytics permissions
  const canViewFullAnalytics = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(userRole);
  const canViewUserManagement = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.MODERATOR].includes(userRole);
  const canViewSystemMetrics = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(userRole);

  const [stats, setStats] = useState({
    totalPosts: 0,
    recentPosts: 0,
    totalViews: '0',
    totalUsers: 0,
    pendingUsers: 0,
    categories: {},
    recentActivity: []
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [modal, setModal] = useState({ open: false, title: '', content: null });
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'analytics', 'features'
  const [analyticsData, setAnalyticsData] = useState({
    views: {
      weeklyViews: [120, 150, 180, 200, 170, 220, 250],
      totalViews: 1290,
      avgDailyViews: 184,
      growthRate: 15.2,
      peakDay: 'Sunday'
    },
    engagement: {
      engagementRate: 78.5,
      avgSessionTime: 245,
      bounceRate: 32.1,
      returnVisitors: 52.3,
      activeUsers: 89
    },
    performance: {
      topPosts: [],
      categoryPerformance: {},
      totalContent: 0,
      publishedThisWeek: 0,
      avgViewsPerPost: 0
    },
    trends: {
      monthlyGrowth: 15.2,
      userGrowth: 12.1,
      contentGrowth: 18.7,
      predictions: { nextMonth: 17.2, nextQuarter: 22.5 }
    },
    lastUpdated: null
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [realTimeListenerId, setRealTimeListenerId] = useState(null);

  // Enhanced cache management
  const cacheRef = useRef(new Map());
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for more frequent updates
  const STALE_WHILE_REVALIDATE_DURATION = 10 * 60 * 1000; // 10 minutes stale data acceptable
  const retryTimeoutRef = useRef(null);
  const backgroundRefreshRef = useRef(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refresh data when coming back online if needed
      if (lastFetch && Date.now() - lastFetch > CACHE_DURATION) {
        // Will be handled by loadStats function
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lastFetch, CACHE_DURATION]);

  // Initial data load
  useEffect(() => {
    console.log('🔥 useEffect triggered - calling loadStats(true)');
    loadStats(true);
    loadAnalyticsData(true);
  }, []);

  // Setup real-time analytics listener
  useEffect(() => {
    if (activeView === 'analytics' && !realTimeListenerId) {
      const listenerId = analyticsService.setupRealTimeListener((newData) => {
        console.log('📊 Real-time analytics update received');
        setAnalyticsData(newData);
      });
      setRealTimeListenerId(listenerId);
    }

    return () => {
      if (realTimeListenerId) {
        analyticsService.removeRealTimeListener(realTimeListenerId);
        setRealTimeListenerId(null);
      }
    };
  }, [activeView, realTimeListenerId]);

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [stats.recentActivity]);

  // Cache management functions
  const getCachedData = useCallback((key) => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key, data) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const shouldRefreshData = useCallback(() => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  }, [lastFetch]);

  const loadStats = useCallback(async (isInitial = false) => {
    console.log('🔄 Loading stats...', { isInitial, initialLoading, refreshing });

    // Check cache first
    const cachedStats = getCachedData('dashboardStats');
    const now = Date.now();
    const cacheAge = lastFetch ? now - lastFetch : Infinity;

    // Stale-while-revalidate strategy
    if (!isInitial && cachedStats) {
      if (cacheAge < CACHE_DURATION) {
        console.log('✅ Using fresh cached dashboard stats');
        setStats(cachedStats);
        return;
      } else if (cacheAge < STALE_WHILE_REVALIDATE_DURATION) {
        console.log('📊 Using stale cache, refreshing in background');
        setStats(cachedStats); // Show stale data immediately

        // Refresh in background without showing loading state
        if (!backgroundRefreshRef.current) {
          backgroundRefreshRef.current = refreshInBackground();
        }
        return;
      }
    }

    if (isInitial) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      console.log('🔄 Loading fresh dashboard stats...');

      // Add timeout to prevent hanging (increased to 15 seconds for optimized queries)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
      );

      const response = await Promise.race([
        apiService.getDashboardStats(),
        timeoutPromise
      ]);

      console.log('✅ API response:', response);

      if (response.success) {
        setStats(response.data);
        setCachedData('dashboardStats', response.data);
        setLastFetch(Date.now());
        setError(null);
        console.log('✅ Stats loaded successfully');
      } else {
        throw new Error(response.error || 'Failed to load dashboard stats');
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      setError(`Failed to load dashboard data: ${error.message}`);

      // Use cached data if available during error
      if (cachedStats) {
        console.log('📋 Using cached data due to error');
        setStats(cachedStats);
      } else {
        // Set fallback stats to prevent infinite loading
        const fallbackStats = {
          totalPosts: 12,
          recentPosts: 8,
          totalViews: "1,234",
          totalUsers: 25,
          pendingUsers: 3,
          categories: { "Technology": 5, "Lifestyle": 3, "Business": 4 },
          recentActivity: [
            { id: 1, title: "Sample Post 1", created_at: new Date().toISOString(), status: "published", views: 45 },
            { id: 2, title: "Sample Post 2", created_at: new Date().toISOString(), status: "draft", views: 12 }
          ],
        };

        console.log('🔄 Using fallback stats:', fallbackStats);
        setStats(fallbackStats);
      }

      // Retry logic for network errors
      if (error.name === 'NetworkError' || error.message.includes('fetch') || error.message.includes('timeout')) {
        scheduleRetry(isInitial);
      }
    } finally {
      console.log('🏁 Loading complete, clearing loading states');
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
      console.log('loadStats completed');
    }
  }, [getCachedData, setCachedData, lastFetch]);

  // Load analytics data with real-time updates
  const loadAnalyticsData = useCallback(async (isInitial = false) => {
    console.log('📊 Loading analytics data...', { isInitial });

    if (isInitial) {
      setAnalyticsLoading(true);
    }

    setAnalyticsError(null);

    try {
      const result = await analyticsService.getAnalyticsData();

      if (result.success) {
        setAnalyticsData({
          ...result.data,
          lastUpdated: Date.now()
        });
        console.log('✅ Analytics data loaded successfully');
      } else {
        throw new Error(result.error || 'Failed to load analytics data');
      }
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      setAnalyticsError(`Failed to load analytics: ${error.message}`);
    } finally {
      if (isInitial) {
        setAnalyticsLoading(false);
      }
    }
  }, []);

  // Real-time analytics refresh
  const refreshAnalyticsData = useCallback(async () => {
    if (activeView !== 'analytics') return;

    try {
      console.log('🔄 Refreshing analytics data in background...');
      const result = await analyticsService.getAnalyticsData();

      if (result.success) {
        setAnalyticsData(prevData => ({
          ...result.data,
          lastUpdated: Date.now()
        }));
        console.log('✅ Analytics data refreshed');
      }
    } catch (error) {
      console.warn('⚠️ Analytics refresh failed:', error.message);
    }
  }, [activeView]);

  // Background refresh function
  const refreshInBackground = useCallback(async () => {
    try {
      console.log('🔄 Background refresh started');
      const response = await apiService.getDashboardStats();

      if (response.success) {
        setStats(response.data);
        setCachedData('dashboardStats', response.data);
        setLastFetch(Date.now());
        console.log('✅ Background refresh completed');
      }
    } catch (error) {
      console.warn('⚠️ Background refresh failed:', error.message);
    } finally {
      backgroundRefreshRef.current = null;
    }
  }, [setCachedData]);

  const scheduleRetry = useCallback((isInitial = false, attempt = 1) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    const MAX_RETRIES = 3;
    if (attempt > MAX_RETRIES) {
      console.warn('❌ Max retries reached, giving up');
      return;
    }

    // Exponential backoff: 2s, 4s, 8s
    const baseDelay = isInitial ? 2000 : 4000;
    const retryDelay = baseDelay * Math.pow(2, attempt - 1);

    console.log(`🔄 Scheduling retry ${attempt}/${MAX_RETRIES} in ${retryDelay}ms`);

    retryTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Retry attempt ${attempt}/${MAX_RETRIES}`);
      if (isOnline) {
        loadStats(isInitial).catch(() => {
          scheduleRetry(isInitial, attempt + 1);
        });
      }
    }, retryDelay);
  }, [loadStats, isOnline]);

  const handleManualRefresh = useCallback(() => {
    if (!refreshing && isOnline) {
      // Clear cache to force fresh data
      cacheRef.current.delete('dashboardStats');
      loadStats(false);
      if (activeView === 'analytics') {
        loadAnalyticsData(false);
      }
    }
  }, [refreshing, isOnline, loadStats, loadAnalyticsData, activeView]);

  // Handle online status changes and refresh data when needed
  useEffect(() => {
    if (isOnline && shouldRefreshData()) {
      loadStats(false);
    }
  }, [isOnline, shouldRefreshData, loadStats]);

  // Real-time listener for posts and users to update counts
  useEffect(() => {
    console.log('📡 Setting up real-time stats listeners...');

    // Listen to posts for total count and recent activity
    const unsubscribePosts = blogDataService.listenToPosts((result) => {
      if (result.success) {
        console.log('📝 Real-time posts update for stats');
        const posts = result.data;
        const publishedCount = posts.filter(p => p.status === 'published').length;

        setStats(prev => ({
          ...prev,
          totalPosts: posts.length,
          recentPosts: publishedCount,
          recentActivity: posts.slice(0, 5).map(p => ({
            id: p.id,
            title: p.title,
            created_at: p.metadata?.createdAt || p.publishedAt,
            status: p.status,
            views: p.analytics?.views || 0
          }))
        }));
      }
    }, { limit: 100 });

    // Listen to users for total and pending counts
    const unsubscribeUsers = userService.listenToUsers((result) => {
      if (result.success) {
        console.log('👤 Real-time users update for stats');
        const users = result.data;
        const pendingCount = users.filter(u => u.status === 'pending').length;

        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          pendingUsers: pendingCount
        }));
      }
    }, { limit: 100 });

    return () => {
      if (typeof unsubscribePosts === 'function') unsubscribePosts();
      if (typeof unsubscribeUsers === 'function') unsubscribeUsers();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (backgroundRefreshRef.current) {
        backgroundRefreshRef.current = null;
      }
    };
  }, []);

  const handleQuickAction = (action) => {
    if (onTabChange) {
      onTabChange(action);
    }
  };

  // Modal handlers for stat cards
  const handleShowTotalPosts = async () => {
    setModal({ open: true, title: 'All Posts', content: <div>Loading...</div> });
    try {
      const res = await apiService.getPosts(1, 1000);
      if (res.success && res.data && res.data.posts) {
        setModal({
          open: true,
          title: 'All Posts',
          content: (
            <ul className="divide-y divide-gray-200">
              {res.data.posts.map(post => (
                <li key={post.id} className="py-2">
                  <span className="font-semibold">{post.title}</span> <span className="text-xs text-gray-500">({post.status})</span>
                </li>
              ))}
            </ul>
          )
        });
      } else {
        setModal({ open: true, title: 'All Posts', content: <div>No posts found.</div> });
      }
    } catch (e) {
      setModal({ open: true, title: 'All Posts', content: <div>Error loading posts.</div> });
    }
  };
  const handleShowRecentPosts = async () => {
    setModal({ open: true, title: 'Recent Posts', content: <div>Loading...</div> });
    try {
      const res = await apiService.getPosts(1, 10, null, 'published');
      if (res.success && res.data && res.data.posts) {
        setModal({
          open: true,
          title: 'Recent Posts',
          content: (
            <ul className="divide-y divide-gray-200">
              {res.data.posts.map(post => (
                <li key={post.id} className="py-2">
                  <span className="font-semibold">{post.title}</span> <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )
        });
      } else {
        setModal({ open: true, title: 'Recent Posts', content: <div>No recent posts found.</div> });
      }
    } catch (e) {
      setModal({ open: true, title: 'Recent Posts', content: <div>Error loading recent posts.</div> });
    }
  };
  const handleShowTotalUsers = async () => {
    setModal({ open: true, title: 'All Users', content: <div>Loading...</div> });
    try {
      const res = await apiService.getAllUsers();
      if (res.success && res.allUsers) {
        setModal({
          open: true,
          title: 'All Users',
          content: (
            <ul className="divide-y divide-gray-200">
              {res.allUsers.map(user => (
                <li key={user.id} className="py-2">
                  <span className="font-semibold">{user.name}</span> <span className="text-xs text-gray-500">({user.email}, {user.role})</span>
                </li>
              ))}
            </ul>
          )
        });
      } else {
        setModal({ open: true, title: 'All Users', content: <div>No users found.</div> });
      }
    } catch (e) {
      setModal({ open: true, title: 'All Users', content: <div>Error loading users.</div> });
    }
  };
  const handleShowPendingUsers = async () => {
    setModal({ open: true, title: 'Pending Users', content: <div>Loading...</div> });
    try {
      const res = await apiService.getPendingUsers();
      if (res.success && res.data) {
        setModal({
          open: true,
          title: 'Pending Users',
          content: (
            <ul className="divide-y divide-gray-200">
              {res.data.map(user => (
                <li key={user.id} className="py-2">
                  <span className="font-semibold">{user.name}</span> <span className="text-xs text-gray-500">({user.email}, {user.role})</span>
                </li>
              ))}
            </ul>
          )
        });
      } else {
        setModal({ open: true, title: 'Pending Users', content: <div>No pending users found.</div> });
      }
    } catch (e) {
      setModal({ open: true, title: 'Pending Users', content: <div>Error loading pending users.</div> });
    }
  };

  // Show loading only on initial load
  if (initialLoading) {
    return (
      <div className="p-6">
        <div className="flex flex-col justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-blue-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Feature overview data
  const features = [
    {
      id: 'content',
      name: 'Content Management',
      description: 'Create, edit, and manage blog posts with rich text editor',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      stats: { posts: stats.totalPosts, recent: stats.recentPosts },
      action: () => handleQuickAction('blog')
    },
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: UserCheck,
      color: 'from-green-500 to-emerald-500',
      stats: { total: stats.totalUsers, pending: stats.pendingUsers },
      action: () => handleQuickAction('users')
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Configure application settings and preferences',
      icon: Settings,
      color: 'from-orange-500 to-red-500',
      stats: { active: true, secure: true },
      action: () => handleQuickAction('profile')
    }
  ];

  const renderFeatureOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            className="bg-white/60 backdrop-blur-lg border border-white/40 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
            onClick={feature.action}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Click to access</span>
              <div className="flex items-center space-x-2">
                {feature.id === 'content' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {feature.stats.posts} posts
                  </span>
                )}
                {feature.id === 'users' && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {feature.stats.total} users
                  </span>
                )}
                {feature.id === 'analytics' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                    +{feature.stats.growth}% growth
                  </span>
                )}
                {feature.id === 'settings' && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-8 pb-20 max-w-[1600px] mx-auto">
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.title}>
        {modal.content}
      </Modal>

      {/* Professional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1">
            Dashboard Overview
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="status-indicator status-online" />
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Systems Operational</span>
            </div>
            {lastFetch && (
              <span className="text-[11px] text-neutral-400 font-medium">
                Last sync: {new Date(lastFetch).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
            {[
              { id: 'overview', name: 'Overview', icon: Layers },
              { id: 'features', name: 'Features', icon: Zap }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all text-xs font-semibold ${activeView === tab.id
                  ? 'bg-white dark:bg-neutral-800 shadow-sm text-brand-600 dark:text-brand-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                <tab.icon size={14} />
                {tab.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={`p-2 rounded-lg border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all ${refreshing ? 'animate-spin' : 'active:scale-95'}`}
          >
            <RefreshCw size={16} className="text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </div>

      {activeView === 'overview' && (
        <div className="space-y-8">
          {/* Main Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Stat: Total Posts */}
            <motion.div
              whileHover={{ y: -2 }}
              onClick={handleShowTotalPosts}
              className="pro-card p-6 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg">
                  <FileText className="text-brand-600 dark:text-brand-400" size={20} />
                </div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                  +12%
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Total Posts</p>
              <div className="flex flex-col">
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {stats.totalPosts}
                </h3>
              </div>
            </motion.div>

            {/* Stat: Active Users */}
            <motion.div
              whileHover={{ y: -2 }}
              onClick={handleShowTotalUsers}
              className="pro-card p-6 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                  <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
                </div>
                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                  Active
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {stats.totalUsers}
              </h3>
            </motion.div>

            {/* Stat: Pending Approval */}
            <motion.div
              whileHover={{ y: -2 }}
              onClick={handleShowPendingUsers}
              className="pro-card p-6 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                  <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                </div>
                {stats.pendingUsers > 0 && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <p className="text-sm font-medium text-neutral-500 mb-1">Pending Approvals</p>
              <h3 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {stats.pendingUsers}
              </h3>
            </motion.div>

            {/* Stat: Engagement */}
            <motion.div
              whileHover={{ y: -2 }}
              className="pro-card p-6 bg-neutral-900 dark:bg-neutral-800 text-white border-none"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <TrendingUp className="text-brand-400" size={20} />
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-400 mb-1">Total Views</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {stats.totalViews}
              </h3>
            </motion.div>
          </div>

          {/* Detailed Analytics & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Engagement Chart */}
            <div className="lg:col-span-2 pro-card p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Engagement Overview</h3>
                  <p className="text-xs text-neutral-500">Weekly content views performance</p>
                </div>
                <select className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border-none rounded-md px-3 py-1.5 focus:ring-0">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-64">
                <AreaChart
                  data={analyticsData.views.weeklyViews}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  color="var(--brand-600)"
                />
              </div>
            </div>

            {/* Recent Activity Log */}
            <div className="pro-card flex flex-col">
              <div className="p-6 border-b border-neutral-100 dark:border-white/5">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Activity Log</h3>
                <p className="text-xs text-neutral-500">Real-time platform events</p>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[400px] p-6 space-y-6">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex gap-3 relative group">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <Activity size={12} className="text-neutral-500" />
                        </div>
                        {idx !== stats.recentActivity.length - 1 && (
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-neutral-200 dark:bg-neutral-800" />
                        )}
                      </div>
                      <div className="flex-1 mt-1">
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${activity.status === 'published' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
                            }`}>
                            {activity.status}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium tracking-tight">
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <Activity size={24} className="mb-2" />
                    <p className="text-xs font-medium">No recent activity</p>
                  </div>
                )}
              </div>
              <button className="p-4 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-neutral-50 dark:hover:bg-white/5 border-t border-neutral-100 dark:border-white/5 transition-colors">
                View All Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {activeView === 'features' && renderFeatureOverview()}
    </div>
  );
}
