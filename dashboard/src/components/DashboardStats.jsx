import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  Users, 
  AlertCircle, 
  Plus, 
  UserPlus, 
  User, 
  Edit3,
  Activity
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
  const [stats, setStats] = useState({
    totalPosts: 0,
    recentPosts: 0,
    totalViews: '0',
    totalUsers: 0,
    pendingUsers: 0,
    categories: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', content: null });

  useEffect(() => {
    let interval;
    const fetchStats = async () => {
      await loadStats();
    };
    fetchStats();
    interval = setInterval(fetchStats, 5000); // Poll every 5 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [stats.recentActivity]);

  const loadStats = async () => {
    try {
      const response = await apiService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Modal open={modal.open} onClose={() => setModal({ ...modal, open: false })} title={modal.title}>
        {modal.content}
      </Modal>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your site.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Posts */}
        <div className="bg-gradient-to-r from-blue-400/60 to-purple-400/60 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6 text-white/90 transition-all duration-300 cursor-pointer" onClick={handleShowTotalPosts} title="View all posts">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold">{stats.totalPosts}</p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <FileText className="w-6 h-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-gradient-to-r from-green-400/60 to-blue-400/60 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6 text-white/90 transition-all duration-300 cursor-pointer" onClick={handleShowRecentPosts} title="View recent posts">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Recent Posts</p>
              <p className="text-3xl font-bold">{stats.recentPosts}</p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Clock className="w-6 h-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-gradient-to-r from-purple-400/60 to-blue-400/60 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6 text-white/90 transition-all duration-300 cursor-pointer" onClick={handleShowTotalUsers} title="View all users">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="w-6 h-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Pending Users */}
        <div className="bg-gradient-to-r from-pink-400/60 to-purple-400/60 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl p-6 text-white/90 transition-all duration-300 cursor-pointer" onClick={handleShowPendingUsers} title="View pending users">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Pending Users</p>
              <p className="text-3xl font-bold">{stats.pendingUsers}</p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <AlertCircle className="w-6 h-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => handleQuickAction('blog')}
          className="bg-white/40 backdrop-blur-lg border border-white/30 rounded-2xl p-6 hover:shadow-2xl transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-blue-100/60 rounded-lg flex items-center justify-center group-hover:bg-blue-200/80 transition-colors duration-200 shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="text-blue-600"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Plus className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors duration-200">Create Post</h3>
              <p className="text-sm text-blue-700/80">Add a new blog post</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleQuickAction('users')}
          className="bg-white/40 backdrop-blur-lg border border-white/30 rounded-2xl p-6 hover:shadow-2xl transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-green-100/60 rounded-lg flex items-center justify-center group-hover:bg-green-200/80 transition-colors duration-200 shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="text-green-600"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <UserPlus className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 group-hover:text-green-600 transition-colors duration-200">Manage Users</h3>
              <p className="text-sm text-blue-700/80">Approve pending users</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleQuickAction('profile')}
          className="bg-white/40 backdrop-blur-lg border border-white/30 rounded-2xl p-6 hover:shadow-2xl transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-purple-100/60 rounded-lg flex items-center justify-center group-hover:bg-purple-200/80 transition-colors duration-200 shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="text-purple-600"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <User className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 group-hover:text-purple-600 transition-colors duration-200">View Profile</h3>
              <p className="text-sm text-blue-700/80">Update your profile</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleQuickAction('blog')}
          className="bg-white/40 backdrop-blur-lg border border-white/30 rounded-2xl p-6 hover:shadow-2xl transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-orange-100/60 rounded-lg flex items-center justify-center group-hover:bg-orange-200/80 transition-colors duration-200 shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="text-orange-600"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Edit3 className="w-6 h-6" />
              </motion.div>
            </motion.div>
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 group-hover:text-orange-600 transition-colors duration-200">Manage Posts</h3>
              <p className="text-sm text-blue-700/80">Edit existing posts</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30">
        <div className="px-6 py-4 border-b border-white/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-900">Recent Activity</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-700/80">
                Live • Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          {((stats.recentActivity || []).length === 0) ? (
            <div className="text-center py-8">
              <div className="mx-auto">
                <Activity className="h-12 w-12 text-blue-400/60 mx-auto" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-blue-900">No recent activity</h3>
              <p className="mt-1 text-sm text-blue-700/80">
                Activity will appear here as users interact with the dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(stats.recentActivity || []).map((post, index) => (
                <div 
                  key={post.id} 
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-gray-100"
                  style={{
                    animation: index === 0 ? 'fadeInSlide 0.5s ease-out' : 'none'
                  }}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="p-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{post.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()} • {post.views} views
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}