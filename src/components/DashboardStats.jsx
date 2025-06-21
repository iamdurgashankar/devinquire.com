import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    recentPosts: 0,
    categories: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        console.error('Failed to load stats:', response.message);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts,
      icon: '📝',
      color: 'bg-blue-500',
      description: 'All published posts'
    },
    {
      title: 'Recent Posts',
      value: stats.recentPosts,
      icon: '🆕',
      color: 'bg-green-500',
      description: 'Posts from last 7 days'
    },
    {
      title: 'Categories',
      value: Object.keys(stats.categories).length,
      icon: '🏷️',
      color: 'bg-purple-500',
      description: 'Active categories'
    },
    {
      title: 'Total Views',
      value: '2.4K',
      icon: '👁️',
      color: 'bg-orange-500',
      description: 'Estimated views'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts by Category</h3>
          <div className="space-y-4">
            {Object.entries(stats.categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(count / stats.totalPosts) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((post) => (
                <div key={post.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()} • {post.category}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-colors duration-200 group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                <span className="text-blue-600 text-xl">✏️</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Create Post</p>
                <p className="text-sm text-gray-500">Write a new blog post</p>
              </div>
            </div>
          </button>
          
          <button className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-colors duration-200 group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                <span className="text-green-600 text-xl">📊</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-500">Check performance</p>
              </div>
            </div>
          </button>
          
          <button className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 text-left transition-colors duration-200 group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                <span className="text-purple-600 text-xl">⚙️</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Settings</p>
                <p className="text-sm text-gray-500">Manage preferences</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 