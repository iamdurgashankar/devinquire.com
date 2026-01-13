import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRBAC } from '../../services/rbacService';

const PortalSwitcher = () => {
  const { currentUser, setUserRole } = useRBAC();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const portals = [
    {
      id: 'client',
      name: 'Client Portal',
      description: 'Submit and track requests',
      icon: '👤',
      role: 'CLIENT',
      path: '/client',
      color: 'bg-blue-500'
    },
    {
      id: 'editor',
      name: 'Editor Portal',
      description: 'Review and edit content',
      icon: '✏️',
      role: 'EDITOR',
      path: '/editor',
      color: 'bg-green-500'
    },
    {
      id: 'admin',
      name: 'Admin Portal',
      description: 'System management and oversight',
      icon: '⚙️',
      role: 'ADMIN',
      path: '/admin',
      color: 'bg-red-500'
    }
  ];

  const handlePortalSwitch = (portal) => {
    // Simulate role switching for demonstration
    setUserRole(portal.role);
    navigate(portal.path);
    setIsOpen(false);
  };

  const getCurrentPortal = () => {
    const currentPath = window.location.pathname;
    return portals.find(portal => currentPath.startsWith(portal.path)) || portals[0];
  };

  const currentPortal = getCurrentPortal();

  return (
    <div className="relative">
      {/* Portal Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">{currentPortal.icon}</span>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">{currentPortal.name}</div>
          <div className="text-xs text-gray-500">{currentUser?.role || 'Demo Mode'}</div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Switch Portal</h3>
            <p className="text-xs text-gray-500 mt-1">
              Experience different user roles and portal views
            </p>
          </div>
          
          <div className="p-2">
            {portals.map((portal) => (
              <button
                key={portal.id}
                onClick={() => handlePortalSwitch(portal)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                  currentPortal.id === portal.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <div className={`w-10 h-10 ${portal.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                  {portal.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">{portal.name}</div>
                  <div className="text-xs text-gray-500">{portal.description}</div>
                  <div className="text-xs text-blue-600 mt-1">Role: {portal.role}</div>
                </div>
                {currentPortal.id === portal.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600">
              <strong>Demo Instructions:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Click any portal to switch roles and views</li>
                <li>• Each portal has different features and permissions</li>
                <li>• Admin Portal includes the Task Management section</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default PortalSwitcher;