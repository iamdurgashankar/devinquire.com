import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useRBAC } from '../../services/rbacService';
import EditorDashboard from './editor/EditorDashboard';
import BlogManager from './editor/BlogManager';
import ClientRequests from './editor/ClientRequests';
import ContentEditor from './editor/ContentEditor';
import NotificationCenter from '../common/NotificationCenter';
import PortalSwitcher from '../common/PortalSwitcher';
import MainLayout from '../layout/MainLayout';
import { LayoutDashboard, FileText, Inbox, Edit3 } from 'lucide-react';

const EditorPortal = () => {
  const { currentUser, clearUserData } = useRBAC();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUserData();
    navigate('/login');
  };

  const navigationItems = [
    { path: '', label: 'Dashboard', icon: LayoutDashboard },
    { path: 'blog', label: 'Blog Manager', icon: FileText },
    { path: 'requests', label: 'Client Requests', icon: Inbox },
    { path: 'content', label: 'Content Editor', icon: Edit3 }
  ];

  return (
    <MainLayout
      navigationItems={navigationItems}
      user={currentUser}
      onLogout={handleLogout}
      title="Editor Portal"
    >
      <div className="mb-6 flex justify-end gap-4">
        <PortalSwitcher />
        <NotificationCenter />
      </div>

      <Routes>
        <Route path="/" element={<EditorDashboard />} />
        <Route path="/blog/*" element={<BlogManager />} />
        <Route path="/requests/*" element={<ClientRequests />} />
        <Route path="/content/*" element={<ContentEditor />} />
      </Routes>
    </MainLayout>
  );
};

export default EditorPortal;