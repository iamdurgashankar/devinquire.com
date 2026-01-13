import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useRBAC } from '../../services/rbacService';
import AdminDashboard from './admin/AdminDashboard';
import UserManagement from './admin/UserManagement';
import TaskManagement from './admin/TaskManagement';
import SystemSettings from './admin/SystemSettings';
import AuditLogs from './admin/AuditLogs';
import NotificationCenter from '../common/NotificationCenter';
import PortalSwitcher from '../common/PortalSwitcher';
import MainLayout from '../layout/MainLayout';
import { LayoutDashboard, Users, CheckSquare, Settings, ClipboardList } from 'lucide-react';

const AdminPortal = () => {
  const { currentUser, clearUserData } = useRBAC();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUserData();
    navigate('/login');
  };

  const navigationItems = [
    { path: '', label: 'Dashboard', icon: LayoutDashboard },
    { path: 'users', label: 'User Management', icon: Users },
    { path: 'tasks', label: 'Task Management', icon: CheckSquare },
    { path: 'settings', label: 'Settings', icon: Settings },
    { path: 'audit', label: 'Audit Logs', icon: ClipboardList }
  ];

  return (
    <MainLayout
      navigationItems={navigationItems}
      user={currentUser}
      onLogout={handleLogout}
      title="Admin Portal"
    >
      <div className="mb-6 flex justify-end gap-4">
        <PortalSwitcher />
        <NotificationCenter />
      </div>

      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/users/*" element={<UserManagement />} />
        <Route path="/tasks/*" element={<TaskManagement />} />
        <Route path="/settings/*" element={<SystemSettings />} />
        <Route path="/audit/*" element={<AuditLogs />} />
      </Routes>
    </MainLayout>
  );
};

export default AdminPortal;