import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BlogManager from './BlogManager';
import UserProfile from './UserProfile';
import DashboardStats from './DashboardStats';
import UserManager from './UserManager';
import NotificationManager from './NotificationManager';
import { Link } from 'react-router-dom';

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
    ...(currentUser && currentUser.role === 'admin' ? [
      { id: 'users', name: 'User Management', icon: '👤' },
      { id: 'pagebuilder', name: 'Page Builder', icon: '🧩' },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100/60 via-purple-100/60 to-white/80 relative overflow-hidden">
      {/* Enhanced animated glassy blobs for liquid effect */}
      {/* Blobs use custom keyframes for more organic movement */}
      <div className="absolute -top-32 -left-32 w-[36rem] h-[36rem] bg-gradient-to-br from-blue-400/40 via-purple-400/30 to-pink-300/20 rounded-full blur-3xl opacity-70 z-0 animate-blob1" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-tr from-purple-400/40 via-blue-300/30 to-pink-200/20 rounded-full blur-3xl opacity-60 z-0 animate-blob2" />
      <div className="absolute top-1/2 left-1/3 w-[18rem] h-[18rem] bg-gradient-to-br from-pink-400/40 via-purple-300/30 to-blue-200/20 rounded-full blur-2xl opacity-50 z-0 animate-blob3" />
      <div className="absolute top-10 right-1/4 w-[14rem] h-[14rem] bg-gradient-to-tr from-blue-300/40 via-purple-200/30 to-pink-100/20 rounded-full blur-2xl opacity-40 z-0 animate-blob4" />
      <div className="absolute bottom-20 left-1/4 w-[20rem] h-[20rem] bg-gradient-to-br from-purple-300/40 via-blue-200/30 to-pink-200/20 rounded-full blur-2xl opacity-50 z-0 animate-blob5" />
      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div className={`flex-shrink-0 bg-white/30 backdrop-blur-xl border-r border-white/30 shadow-2xl min-w-max flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`} style={{height: '100vh'}}>
          {/* Sidebar Header (sticky) */}
          <div className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b border-white/30 bg-white/40 backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                D
              </div>
              <span className="text-lg font-semibold text-gray-900 drop-shadow">DevInquire Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-white/40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Navigation Tabs (scrollable) */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
            {tabs.map((tab) => (
              tab.id === 'pagebuilder' ? (
                <Link
                  key={tab.id}
                  to="/admin/page-builder"
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group backdrop-blur-md ${
                    window.location.pathname === '/admin/page-builder'
                      ? 'bg-gradient-to-r from-blue-200/60 to-purple-200/60 text-blue-800 border-r-4 border-blue-500/80 shadow-lg'
                      : 'text-gray-700 hover:bg-white/40 hover:text-blue-700'
                  }`}
                >
                  <span className="text-xl drop-shadow-sm">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                  {window.location.pathname === '/admin/page-builder' && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabChange(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group backdrop-blur-md ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-200/60 to-purple-200/60 text-blue-800 border-r-4 border-blue-500/80 shadow-lg'
                      : 'text-gray-700 hover:bg-white/40 hover:text-blue-700'
                  }`}
                >
                  <span className="text-xl drop-shadow-sm">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              )
            ))}
          </nav>
          {/* Sidebar Footer (sticky) */}
          <div className="sticky bottom-0 z-20 p-4 border-t border-white/30 bg-white/40 backdrop-blur-xl">
            <div className="bg-gradient-to-r from-blue-200/60 to-purple-200/60 rounded-lg p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {currentUser?.displayName?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 drop-shadow">{currentUser?.displayName || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-400/80 to-pink-500/80 hover:from-red-500 hover:to-pink-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0 h-screen overflow-y-auto">
          {/* Mobile Menu Button */}
          <div className="lg:hidden p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-white/40"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            {/* Content */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden transition-all duration-300">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
} 