import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useRBAC } from '../../services/rbacService';
import ClientDashboard from './client/ClientDashboard';
import ProjectProgress from './client/ProjectProgress';
import RequestManager from './client/RequestManager';
import ClientProfile from './client/ClientProfile';
import NotificationCenter from '../common/NotificationCenter';
import PortalSwitcher from '../common/PortalSwitcher';
import MainLayout from '../layout/MainLayout';
import { LayoutDashboard, TrendingUp, FileText, User } from 'lucide-react';

const ClientPortal = () => {
  const { currentUser, clearUserData } = useRBAC();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUserData();
    navigate('/login');
  };

  const navigationItems = [
    { path: '', label: 'Dashboard', icon: LayoutDashboard },
    { path: 'progress', label: 'Project Progress', icon: TrendingUp },
    { path: 'requests', label: 'My Requests', icon: FileText },
    { path: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <MainLayout
      navigationItems={navigationItems}
      user={currentUser}
      onLogout={handleLogout}
      title="Client Portal"
    >
      <div className="mb-6 flex justify-end gap-4">
        <PortalSwitcher />
        <NotificationCenter />
      </div>

      <Routes>
        <Route path="/" element={<ClientDashboard />} />
        <Route path="/progress/*" element={<ProjectProgress />} />
        <Route path="/requests/*" element={<RequestManager />} />
        <Route path="/profile/*" element={<ClientProfile />} />
      </Routes>
    </MainLayout>
  );
};

export default ClientPortal;