import React, { useState } from 'react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import AdminService from '../services/adminService';
import BlogManager from './BlogManager';
import UserProfile from './UserProfile';
import DashboardStats from './DashboardStats';
import UserManager from './UserManager';
import NotificationManager from './NotificationManager';
import TaskManager from './TaskManager';
import Sidebar from './layout/Sidebar';
import TopBar from './layout/TopBar';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  FileText,
  Users,
  Bell,
  User,
  CheckSquare,
  Shield,
  Activity,
  Plus
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    if (tab !== 'blog') {
      setShowCreateForm(false);
    }
  };

  const isAdminUser = currentUser && currentUser.role === 'admin';

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, isActive: activeTab === 'dashboard', onClick: () => handleTabChange('dashboard') },
    { id: 'blog', name: 'Blog Management', icon: FileText, isActive: activeTab === 'blog', onClick: () => handleTabChange('blog') },
    { id: 'tasks', name: 'Task Management', icon: CheckSquare, isActive: activeTab === 'tasks', onClick: () => handleTabChange('tasks') },
    ...(isAdminUser ? [
      { id: 'users', name: 'User Management', icon: Users, isActive: activeTab === 'users', onClick: () => handleTabChange('users') },
    ] : []),
    { id: 'notifications', name: 'Notifications', icon: Bell, isActive: activeTab === 'notifications', onClick: () => handleTabChange('notifications') },
    { id: 'profile', name: 'Profile', icon: User, isActive: activeTab === 'profile', onClick: () => handleTabChange('profile') }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats onTabChange={(tab) => {
          if (tab === 'blog') setShowCreateForm(true);
          handleTabChange(tab);
        }} />;
      case 'blog':
        return <BlogManager showCreateForm={showCreateForm} />;
      case 'tasks':
        return <TaskManager />;
      case 'users':
        return isAdminUser ? <UserManager /> : null;
      case 'notifications':
        return <NotificationManager />;
      case 'profile':
        return <UserProfile />;
      default:
        return <DashboardStats onTabChange={handleTabChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        navigationItems={tabs}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <TopBar
          user={currentUser}
          onSearch={(v) => console.log('Searching:', v)}
          onProfileClick={() => handleTabChange('profile')}
          onNotificationClick={() => handleTabChange('notifications')}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay (if added later) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface-950/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}