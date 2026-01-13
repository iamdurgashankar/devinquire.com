import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion } from 'framer-motion';
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  Users,
  Plus,
  Settings,
  BarChart,
  Edit3,
  TrendingUp,
  FileEdit,
  Files
} from 'lucide-react';

const EditorDashboard = () => {
  const { currentUser } = useRBAC();
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    pendingRequests: 0,
    completedRequests: 0,
    activeClients: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = () => {
      setLoading(true);
      // Mock data - replace with actual API calls
      setTimeout(() => {
        setStats({
          totalPosts: 24,
          publishedPosts: 18,
          draftPosts: 6,
          pendingRequests: 5,
          completedRequests: 12,
          activeClients: 8
        });

        setRecentActivity([
          { id: 1, type: 'post', action: 'Published', title: 'New Marketing Strategy', time: '2 hours ago' },
          { id: 2, type: 'request', action: 'Received', title: 'Update request from Client A', time: '4 hours ago' },
          { id: 3, type: 'post', action: 'Created', title: 'Product Launch Guide', time: '1 day ago' },
          { id: 4, type: 'request', action: 'Completed', title: 'Content revision for Client B', time: '2 days ago' }
        ]);
        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 relative overflow-hidden group hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
        <Icon size={100} className={`text-${color}-500`} />
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-4 ring-1 ring-${color}-100 dark:ring-${color}-900/30`}>
          <Icon size={24} />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
      </div>
    </motion.div>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'post': return FileText;
      case 'request': return Send;
      default: return Files;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'Published': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
      case 'Received': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20';
      case 'Created': return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20';
      case 'Completed': return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 dark:border-indigo-900 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {currentUser?.displayName || 'Editor'}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Here's an overview of your content and client activities.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors"
        >
          <Plus size={20} />
          <span className="font-medium">Create New Post</span>
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Published Posts"
          value={stats.publishedPosts}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Draft Posts"
          value={stats.draftPosts}
          icon={FileEdit}
          color="amber"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Completed Requests"
          value={stats.completedRequests}
          icon={CheckCircle}
          color="teal"
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          icon={Users}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
            <div className="p-6 border-b border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">View All</button>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 group"
                      >
                        <div className={`p-3 rounded-xl ${getActivityColor(activity.action)} shrink-0`}>
                          <ActivityIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              <span className="font-bold">{activity.action}</span> {activity.title}
                            </p>
                            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{activity.time}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Type: <span className="capitalize">{activity.type}</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200/60 dark:border-slate-600/60 rounded-xl transition-all group"
            >
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white">Manage Content</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">View and edit posts</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-100 dark:border-slate-600 rounded-xl transition-all group"
            >
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Send size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white">Client Requests</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">5 pending requests</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-700/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-slate-200/60 dark:border-slate-600/60 rounded-xl transition-all group"
            >
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <BarChart size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white">Content Analytics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">View performance</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full p-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-100 dark:border-slate-600 rounded-xl transition-all group"
            >
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Settings size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900 dark:text-white">Settings</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Preferences & Profile</p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EditorDashboard;