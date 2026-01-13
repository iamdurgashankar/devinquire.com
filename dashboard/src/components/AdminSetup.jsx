import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Key, CheckCircle, AlertCircle, Settings, Trash2 } from 'lucide-react';
import createAdminUser from '../utils/createAdminUser';
import cleanupAdminData from '../utils/cleanupAdminData';
import { useAuth } from '../contexts/EnhancedAuthContext';

const AdminSetup = () => {
  const [setupStatus, setSetupStatus] = useState('idle'); // idle, creating, success, error
  const [setupResult, setSetupResult] = useState(null);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: 'admin@devinquire.com',
    password: '8763155488Sipu@',
    confirmPassword: '8763155488Sipu@'
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // Strong password: at least 8 chars, uppercase, lowercase, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreateAdmin = async (e) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors below');
      return;
    }
    setSetupStatus('creating');
    setError(null);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Admin user creation timed out after 30 seconds')), 30000);
      });
      
      const createUserPromise = createAdminUser({
        email: formData.email,
        password: formData.password
      });
      
      const result = await Promise.race([createUserPromise, timeoutPromise]);
      setSetupResult(result);
      setSetupStatus('success');
      setError(null);
      
      // Log success for debugging
      console.log('Admin user creation result:', result);
    } catch (err) {
      console.error('Admin creation error:', err);
      setError(err.message || 'Failed to create admin user');
      setSetupStatus('error');
    }
  };

  const handleCleanupData = async () => {
    try {
      const result = cleanupAdminData();
      if (result.success) {
        setSetupResult(null);
        setSetupStatus('idle');
        setError(null);
        console.log('✅ Admin data cleaned up successfully');
        // Reload page to ensure complete cleanup
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const getStatusIcon = () => {
    switch (setupStatus) {
      case 'creating':
        return (
          <motion.div 
            className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Shield className="w-8 h-8 text-blue-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (setupStatus) {
      case 'creating':
        return 'Creating admin user...';
      case 'success':
        return setupResult?.existing 
          ? 'Admin user already exists and is properly configured!' 
          : 'Admin user created successfully!';
      case 'error':
        return `Error: ${error}`;
      default:
        return 'Ready to create admin user';
    }
  };

  const getStatusColor = () => {
    switch (setupStatus) {
      case 'creating':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-neutral-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary/5 to-accent/10 flex items-center justify-center p-6">
      <motion.div 
        className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/50 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Admin Setup</h1>
          <p className="text-neutral-600">Configure administrative access for DevInquire Dashboard</p>
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Currently logged in as:</p>
                <p className="text-blue-600">{currentUser.email} ({currentUser.role || 'user'})</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin User Configuration */}
        <div className="space-y-6">
          <div className="bg-neutral-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Admin User Configuration
            </h2>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.email ? 'border-red-500 bg-red-50' : 'border-neutral-300 bg-white'
                    }`}
                    placeholder="Enter admin email"
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                  <div className="bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-600">
                    System Administrator
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.password ? 'border-red-500 bg-red-50' : 'border-neutral-300 bg-white'
                    }`}
                    placeholder="Enter password"
                  />
                  {validationErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-neutral-300 bg-white'
                    }`}
                    placeholder="Confirm password"
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </form>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Password Requirements</p>
                  <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character (@$!%*?&)</li>
                  </ul>
                  <p className="text-yellow-600 text-xs mt-2">
                    Please change the password after first login for security.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Display */}
            <div className="flex items-center space-x-3 mb-6">
              {getStatusIcon()}
              <span className={`font-medium ${getStatusColor()}`}>
                {getStatusMessage()}
              </span>
            </div>

            {/* Success Details */}
            {setupStatus === 'success' && setupResult && (
              <div className={`border rounded-lg p-4 mb-6 ${
                setupResult.note ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}>
                <h3 className={`font-medium mb-2 ${
                  setupResult.note ? 'text-yellow-800' : 'text-green-800'
                }`}>Setup Complete!</h3>
                <div className={`text-sm space-y-1 ${
                  setupResult.note ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  <p>• User ID: {setupResult.uid}</p>
                  <p>• Email: {setupResult.email}</p>
                  <p>• Status: {setupResult.existing ? 'Updated existing user' : 'Created new user'}</p>
                  {setupResult.note && (
                    <p className="text-yellow-600 text-xs mt-2 italic">• {setupResult.note}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                onClick={handleCreateAdmin}
                disabled={setupStatus === 'creating'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {setupStatus === 'creating' ? (
                  <>
                    <motion.div 
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Creating Admin User...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Create/Update Admin User</span>
                  </>
                )}
              </button>
              
              {/* Cleanup Button */}
              {(setupStatus === 'success' || setupStatus === 'error') && (
                <button
                  onClick={handleCleanupData}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-2 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Setup Data</span>
                </button>
              )}
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-neutral-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-3">Admin Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Full Dashboard Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>User Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Blog Management</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Page Builder Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>System Settings</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>All Permissions (*)</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          {setupStatus === 'success' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Navigate to the login page</li>
                <li>Sign in with admin@devinquire.com</li>
                <li>Use the default password provided above</li>
                <li>Change your password in the profile settings</li>
                <li>Access all admin features from the dashboard</li>
              </ol>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSetup;