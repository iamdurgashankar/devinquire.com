import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BlogManager from './BlogManager';
import UserProfile from './UserProfile';
import DashboardStats from './DashboardStats';
import UserManager from './UserManager';
import NotificationManager from './NotificationManager';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // If switching to blog tab, don't show create form by default
    if (tab !== 'blog') {
      setShowCreateForm(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create-post':
        setActiveTab('blog');
        setShowCreateForm(true);
        break;
      case 'manage-users':
        setActiveTab('users');
        break;
      case 'view-profile':
        setActiveTab('profile');
        break;
      default:
        setActiveTab('dashboard');
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'blog', name: 'Blog Management', icon: '📝' },
    // Only show User Management for admin
    ...(currentUser && currentUser.role === 'admin' ? [
      { id: 'users', name: 'User Management', icon: '👤' }
    ] : []),
    { id: 'notifications', name: 'Notifications', icon: '📧' },
    { id: 'profile', name: 'Profile', icon: '👤' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats onTabChange={(tab) => {
          if (tab === 'blog') {
            setShowCreateForm(true);
          }
          handleTabChange(tab);
        }} />;
      case 'blog':
        return <BlogManager showCreateForm={showCreateForm} />;
      case 'users':
        // Only render UserManager for admin
        return currentUser && currentUser.role === 'admin' ? <UserManager /> : null;
      case 'notifications':
        return <NotificationManager />;
      case 'profile':
        return <UserProfile />;
      default:
        return <DashboardStats onTabChange={(tab) => {
          if (tab === 'blog') {
            setShowCreateForm(true);
          }
          handleTabChange(tab);
        }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  D
                </div>
                <span className="text-lg font-semibold text-gray-900">DevInquire Admin</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabChange(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

            {/* Sidebar Footer with User Info and Logout */}
            <div className="p-4 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {currentUser?.displayName?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{currentUser?.displayName || 'Admin User'}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Mobile Menu Button */}
          <div className="lg:hidden p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
} 