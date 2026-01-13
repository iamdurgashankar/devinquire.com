/**
 * OAuth Callback Handlers
 * Handle OAuth authentication callbacks from Google and GitHub
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/EnhancedAuthContext';
import oauthService from '../services/oauthService';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

// Google OAuth Callback Component
export const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing Google authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    handleGoogleCallback();
  }, []);

  const handleGoogleCallback = async () => {
    try {
      setStatus('processing');
      setMessage('Verifying Google authentication...');

      const params = {
        code: searchParams.get('code'),
        state: searchParams.get('state'),
        error: searchParams.get('error'),
        error_description: searchParams.get('error_description'),
      };

      // Check for OAuth errors
      if (params.error) {
        throw new Error(params.error_description || params.error);
      }

      // Handle OAuth callback
      const result = await oauthService.handleCallback('google', params);

      if (result.success) {
        // Update auth context with user data
        const user = {
          id: result.user.providerId,
          email: result.user.email,
          displayName: result.user.name,
          photoURL: result.user.avatar,
          role: 'user', // Default role, can be updated by backend
          provider: 'google',
          verified: result.user.verified,
        };

        setCurrentUser(user);
        setStatus('success');
        setMessage('Successfully authenticated with Google!');

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      setStatus('error');
      setError(error.message);
      setMessage('Google authentication failed');

      // Redirect to login page after error
      setTimeout(() => {
        navigate('/login', { 
          replace: true,
          state: { error: error.message }
        });
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`max-w-md w-full mx-4 p-8 rounded-2xl border-2 shadow-lg ${getStatusColor()}`}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            {getStatusIcon()}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            Google Authentication
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-700 mb-6"
          >
            {message}
          </motion.p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4"
            >
              <p className="font-medium">Error Details:</p>
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center space-x-2 text-sm text-gray-600"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// GitHub OAuth Callback Component
export const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing GitHub authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    handleGitHubCallback();
  }, []);

  const handleGitHubCallback = async () => {
    try {
      setStatus('processing');
      setMessage('Verifying GitHub authentication...');

      const params = {
        code: searchParams.get('code'),
        state: searchParams.get('state'),
        error: searchParams.get('error'),
        error_description: searchParams.get('error_description'),
      };

      // Check for OAuth errors
      if (params.error) {
        throw new Error(params.error_description || params.error);
      }

      // Handle OAuth callback
      const result = await oauthService.handleCallback('github', params);

      if (result.success) {
        // Update auth context with user data
        const user = {
          id: result.user.providerId,
          email: result.user.email,
          displayName: result.user.name || result.user.username,
          photoURL: result.user.avatar,
          role: 'user', // Default role, can be updated by backend
          provider: 'github',
          verified: result.user.verified,
          username: result.user.username,
        };

        setCurrentUser(user);
        setStatus('success');
        setMessage('Successfully authenticated with GitHub!');

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      setStatus('error');
      setError(error.message);
      setMessage('GitHub authentication failed');

      // Redirect to login page after error
      setTimeout(() => {
        navigate('/login', { 
          replace: true,
          state: { error: error.message }
        });
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="w-8 h-8 animate-spin text-gray-700" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'border-gray-200 bg-gray-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`max-w-md w-full mx-4 p-8 rounded-2xl border-2 shadow-lg ${getStatusColor()}`}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            {getStatusIcon()}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            GitHub Authentication
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-700 mb-6"
          >
            {message}
          </motion.p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4"
            >
              <p className="font-medium">Error Details:</p>
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center space-x-2 text-sm text-gray-600"
            >
              <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};