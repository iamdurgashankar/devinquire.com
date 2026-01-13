import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  FileText,
  AlertCircle,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Server,
  TrendingUp,
  Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const { currentUser } = useRBAC();
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    pendingRequests: 0,
    systemHealth: 'good'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      setSystemStats({
        totalUsers: 156,
        activeUsers: 89,
        totalPosts: 342,
        pendingRequests: 23,
        systemHealth: 'good'
      });

      setRecentActivity([
        {
          id: 1,
          type: 'user_registration',
          message: 'New user registered: john.doe@example.com',
          timestamp: '2024-01-15T10:30:00Z',
          severity: 'info'
        },
        {
          id: 2,
          type: 'post_published',
          message: 'Post "Advanced React Patterns" published by Jane Writer',
          timestamp: '2024-01-15T09:45:00Z',
          severity: 'success'
        },
        {
          id: 3,
          type: 'request_submitted',
          message: 'Client request submitted for website updates',
          timestamp: '2024-01-15T09:15:00Z',
          severity: 'warning'
        },
        {
          id: 4,
          type: 'system_alert',
          message: 'High memory usage detected on server',
          timestamp: '2024-01-15T08:30:00Z',
          severity: 'error'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 relative overflow-hidden group hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300`}
    >
      <div className={`absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
        <Icon size={100} className={`text-${color}-500`} />
      </div>

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-${color}-50/50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-4`}>
          <Icon size={24} />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
      </div>
    </motion.div>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration': return UserPlus;
      case 'post_published': return CheckCircle;
      case 'request_submitted': return AlertCircle;
      case 'system_alert': return AlertTriangle;
      default: return Activity;
    }
  };

  const getActivityColor = (severity) => {
    switch (severity) {
      case 'success': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'warning': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
      case 'error': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400';
      default: return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">System overview and management</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <Server size={18} />
            <span>Server Status: {systemStats.systemHealth.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={systemStats.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={systemStats.activeUsers}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Total Posts"
          value={systemStats.totalPosts}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Pending Requests"
          value={systemStats.pendingRequests}
          icon={AlertCircle}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.severity);

              return (
                <div key={activity.id} className="p-6 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions or Charts could go here */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Performance</h2>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6">
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                <p>Performance Chart Placeholder</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
