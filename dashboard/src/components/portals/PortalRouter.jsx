import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useRBAC } from '../../services/rbacService';
import ClientPortal from './ClientPortal';
import EditorPortal from './EditorPortal';
import AdminPortal from './AdminPortal';

const PortalRouter = () => {
  const { currentUser, currentRole, getDemoRole } = useRBAC();

  // Check for demo role first
  const demoData = getDemoRole();
  const effectiveRole = demoData?.role || currentRole || currentUser?.role;

  if (!currentUser && !demoData) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route 
        path="/client/*" 
        element={<ClientPortal />} 
      />
      <Route 
        path="/editor/*" 
        element={<EditorPortal />} 
      />
      <Route 
        path="/admin/*" 
        element={<AdminPortal />} 
      />
      <Route 
        path="/" 
        element={
          <Navigate 
            to={`/${(effectiveRole || 'client').toLowerCase()}`} 
            replace 
          />
        } 
      />
    </Routes>
  );
};

export default PortalRouter;