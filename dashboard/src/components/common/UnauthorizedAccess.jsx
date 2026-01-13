import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRBAC } from '../../services/rbacService';

const UnauthorizedAccess = () => {
  const navigate = useNavigate();
  const { hasPermission } = useRBAC();

  const handleGoBack = () => {
    // Redirect to appropriate portal based on permissions
    if (hasPermission('admin:access')) {
      navigate('/admin');
    } else if (hasPermission('editor:access')) {
      navigate('/editor');
    } else if (hasPermission('client:access')) {
      navigate('/client');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg 
              className="h-8 w-8 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Access Denied
        </h2>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this portal. Please contact your administrator if you believe this is an error.
        </p>
        
        <button
          onClick={handleGoBack}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          Go to My Portal
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedAccess;