import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BlogManager from './BlogManager';
import UserProfile from './UserProfile';
import DashboardStats from './DashboardStats';
import UserManager from './UserManager';
import NotificationManager from './NotificationManager';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Puzzle, 
  Bell, 
  User,
  LogOut,
  Menu
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Background orbs are already handled in JSX below
  // Removed problematic useEffect that was causing appendChild errors

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
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, color: 'from-[#4169e1] to-[#6366f1]' },
    { id: 'blog', name: 'Blog Management', icon: FileText, color: 'from-green-400 to-emerald-400' },
    ...(currentUser && currentUser.role === 'admin' ? [
      { id: 'users', name: 'User Management', icon: Users, color: 'from-[#9c27b0] to-[#8b5cf6]' },
      { id: 'pagebuilder', name: 'Page Builder', icon: Puzzle, color: 'from-orange-400 to-red-400' },
    ] : []),
    { id: 'notifications', name: 'Notifications', icon: Bell, color: 'from-yellow-400 to-orange-400' },
    { id: 'profile', name: 'Profile', icon: User, color: 'from-[#4169e1] via-[#6366f1] to-[#9c27b0]' }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#4169e1]/5 to-[#9c27b0]/10 relative overflow-hidden">
      {/* Modern floating elements with enhanced animations */}
      <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] bg-gradient-to-br from-[#4169e1]/20 via-[#6366f1]/15 to-[#9c27b0]/10 rounded-full blur-3xl opacity-60 z-0 animate-blob1" />
      <div className="absolute bottom-0 right-0 w-[32rem] h-[32rem] bg-gradient-to-tr from-[#4169e1]/20 via-[#6366f1]/15 to-[#9c27b0]/10 rounded-full blur-3xl opacity-50 z-0 animate-blob2" />
      <div className="absolute top-1/2 left-1/3 w-[20rem] h-[20rem] bg-gradient-to-br from-emerald-400/20 via-teal-300/15 to-cyan-200/10 rounded-full blur-2xl opacity-40 z-0 animate-blob3" />
      <div className="absolute top-16 right-1/4 w-[16rem] h-[16rem] bg-gradient-to-tr from-amber-400/20 via-orange-300/15 to-red-200/10 rounded-full blur-2xl opacity-35 z-0 animate-blob4" />
      <div className="absolute bottom-24 left-1/4 w-[24rem] h-[24rem] bg-gradient-to-br from-[#4169e1]/20 via-[#6366f1]/15 to-[#9c27b0]/10 rounded-full blur-2xl opacity-45 z-0 animate-blob5" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-30 z-0" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'%3E%3C/circle%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}} />
      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/30 backdrop-blur-2xl border-r border-white/40 shadow-2xl transition-all duration-300 ease-in-out flex flex-col`} style={{height: '100vh'}}>
          {/* Sidebar Header (sticky) */}
          <div className="sticky top-0 z-20 flex items-center justify-between h-20 px-6 border-b border-white/30 bg-white/50 backdrop-blur-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4169e1] via-[#6366f1] to-[#9c27b0] rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                <div className="relative z-10 flex items-center justify-center text-white font-bold text-sm">
                   <span className="text-white/80 mr-0.5 text-xs">&#123;</span>
                   <span className="text-white font-bold">DI</span>
                   <span className="text-white/80 ml-0.5 text-xs">&#125;</span>
                 </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">DevInquire</h1>
                <p className="text-xs text-gray-500 font-medium">Admin Dashboard</p>
              </div>
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
          <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto min-h-0">
            {tabs.map((tab) => (
              tab.id === 'pagebuilder' ? (
                <Link
                  key={tab.id}
                  to="/page-builder"
                  className={`group w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-md ${
                    window.location.pathname === '/page-builder'
                      ? 'bg-gradient-to-r from-white/50 to-white/30 text-gray-900 shadow-xl border border-white/60 scale-[1.02]'
                      : 'text-gray-700 hover:bg-white/25 hover:text-gray-900 hover:shadow-lg'
                  }`}
                >
                  <motion.div 
                    className={`relative overflow-hidden rounded-lg p-2 transition-all duration-300 ${
                      window.location.pathname === '/page-builder' ? 'text-[#4169e1]' : 'text-gray-600 group-hover:text-[#4169e1]'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                    />
                    <motion.div 
                      className="relative z-10"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <tab.icon className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                  <span className="font-semibold text-sm tracking-wide">{tab.name}</span>
                  {window.location.pathname === '/page-builder' && (
                    <div className="ml-auto w-2 h-2 bg-[#4169e1] rounded-full animate-pulse"></div>
                  )}
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabChange(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`group w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-md ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-white/50 to-white/30 text-gray-900 shadow-xl border border-white/60 scale-[1.02]'
                      : 'text-gray-700 hover:bg-white/25 hover:text-gray-900 hover:shadow-lg'
                  }`}
                >
                  <motion.div 
                    className={`relative overflow-hidden rounded-lg p-2 transition-all duration-300 ${
                      activeTab === tab.id ? 'text-[#4169e1]' : 'text-gray-600 group-hover:text-[#4169e1]'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                    />
                    <motion.div 
                      className="relative z-10"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <tab.icon className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                  <span className="font-semibold text-sm tracking-wide">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="ml-auto w-2 h-2 bg-[#4169e1] rounded-full animate-pulse"></div>
                  )}
                </button>
              )
            ))}
          </nav>
          {/* Sidebar Footer (sticky) */}
          <div className="sticky bottom-0 z-20 p-6 border-t border-white/30 bg-white/50 backdrop-blur-xl">
            <div className="flex items-center space-x-4 mb-4 p-3 rounded-2xl bg-white/30 backdrop-blur-sm">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4169e1] via-[#6366f1] to-[#9c27b0] rounded-2xl flex items-center justify-center text-white font-bold shadow-xl">
                  {currentUser?.displayName?.charAt(0) || 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{currentUser?.displayName || 'Admin User'}</p>
                <p className="text-xs text-gray-500 font-medium">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl transition-all duration-300 shadow-xl backdrop-blur-sm transform hover:scale-[1.02] group"
            >
              <motion.div 
                className="mr-3 relative overflow-hidden rounded-lg p-1"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="relative z-10"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <LogOut className="w-5 h-5" />
                </motion.div>
              </motion.div>
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Enhanced Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-6 bg-white/50 backdrop-blur-2xl border-b border-white/40 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#4169e1] via-[#6366f1] to-[#9c27b0] rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                <div className="relative z-10 flex items-center justify-center text-white font-bold text-xs">
                   <span className="text-white/80 mr-0.5 text-[10px]">&#123;</span>
                   <span className="text-white font-bold text-xs">DI</span>
                   <span className="text-white/80 ml-0.5 text-[10px]">&#125;</span>
                 </div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">DevInquire</h1>
                <p className="text-xs text-gray-500 font-medium">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-300 shadow-lg transform hover:scale-105 group"
            >
              <motion.div 
                className="text-gray-700 group-hover:text-[#4169e1] transition-colors duration-300"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              </motion.div>
            </button>
          </div>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            {/* Enhanced Content Area */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-2">
                <motion.div 
                  className="relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-200/30"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className={`text-2xl bg-gradient-to-r ${tabs.find(tab => tab.id === activeTab)?.color} bg-clip-text text-transparent`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon, { className: "w-8 h-8" })}
                  </motion.div>
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {tabs.find(tab => tab.id === activeTab)?.name}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">Manage your {tabs.find(tab => tab.id === activeTab)?.name.toLowerCase()}</p>
                </div>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>
            <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-8 transition-all duration-300 overflow-y-auto custom-scrollbar max-h-[calc(100vh-12rem)]">
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