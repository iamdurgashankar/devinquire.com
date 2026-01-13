import React from 'react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';

export default function Dashboard() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  React.useEffect(() => {
    console.log('Dashboard - currentUser:', currentUser);
    console.log('Dashboard - loading:', loading);
    console.log('Dashboard - localStorage userData:', localStorage.getItem('userData'));
    console.log('Dashboard - localStorage authMethod:', localStorage.getItem('authMethod'));
  }, [currentUser, loading]);

  // If user is not logged in and not loading, redirect to login
  React.useEffect(() => {
    if (!loading && !currentUser) {
      console.log('Dashboard - No currentUser and not loading, redirecting to login');
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  // Show loading state while authentication is being verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, don't render anything while redirecting
  if (!currentUser) {
    return null;
  }

  // If user is logged in, show the original dashboard
  return <AdminDashboard />;
}