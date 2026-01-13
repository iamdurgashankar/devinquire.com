/**
 * OAuth Login Buttons Component
 * Provides Google and GitHub login buttons with security features
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import oauthService from '../services/oauthService';
import { validateOAuthConfig } from '../config/oauth';

// SVG Icons for OAuth providers
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const OAuthButtons = ({ className = '', disabled = false, onError = () => {} }) => {
  const [loading, setLoading] = useState({ google: false, github: false });
  const [errors, setErrors] = useState({});
  const [configValid, setConfigValid] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    // Validate OAuth configuration on component mount
    const validation = validateOAuthConfig();
    setConfigValid(validation.valid);
    
    if (!validation.valid) {
      onError('OAuth configuration is incomplete. Please check your environment variables.');
    }
  }, [onError]);

  const handleOAuthLogin = async (provider) => {
    if (disabled || loading[provider] || rateLimited) return;

    try {
      setLoading(prev => ({ ...prev, [provider]: true }));
      setErrors(prev => ({ ...prev, [provider]: null }));

      // Rate limiting check
      const lastAttempt = localStorage.getItem(`oauth_last_attempt_${provider}`);
      if (lastAttempt) {
        const timeDiff = Date.now() - parseInt(lastAttempt);
        const minInterval = 3000; // 3 seconds between attempts
        
        if (timeDiff < minInterval) {
          throw new Error('Please wait a moment before trying again');
        }
      }

      // Store attempt timestamp
      localStorage.setItem(`oauth_last_attempt_${provider}`, Date.now().toString());

      // Initiate OAuth flow
      if (provider === 'google') {
        await oauthService.initiateGoogleAuth();
      } else if (provider === 'github') {
        await oauthService.initiateGitHubAuth();
      }
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      
      const errorMessage = error.message || `Failed to authenticate with ${provider}`;
      setErrors(prev => ({ ...prev, [provider]: errorMessage }));
      onError(errorMessage);

      // Implement rate limiting on error
      if (error.message.includes('rate') || error.message.includes('limit')) {
        setRateLimited(true);
        setTimeout(() => setRateLimited(false), 60000); // 1 minute timeout
      }
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const getButtonClass = (provider, baseClass = '') => {
    const isLoading = loading[provider];
    const hasError = errors[provider];
    
    let classes = `
      w-full flex items-center justify-center px-4 py-3 border rounded-lg font-medium 
      transition-all duration-200 transform hover:scale-105 active:scale-95
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${baseClass}
    `;

    if (isLoading) {
      classes += ' animate-pulse';
    }

    if (hasError) {
      classes += ' border-red-300 bg-red-50 text-red-700';
    }

    return classes;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {!configValid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Configuration Required</p>
            <p className="text-sm">OAuth providers are not properly configured. Please check your environment variables.</p>
          </div>
        </motion.div>
      )}

      {rateLimited && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Rate Limited</p>
            <p className="text-sm">Too many attempts. Please wait a moment before trying again.</p>
          </div>
        </motion.div>
      )}

      {/* Google OAuth Button */}
      <motion.button
        whileHover={{ scale: disabled || loading.google ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading.google ? 1 : 0.98 }}
        type="button"
        onClick={() => handleOAuthLogin('google')}
        disabled={disabled || loading.google || !configValid || rateLimited}
        className={getButtonClass('google', 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500')}
      >
        {loading.google ? (
          <RefreshCw className="w-5 h-5 animate-spin mr-3" />
        ) : (
          <GoogleIcon />
        )}
        <span className="ml-3">
          {loading.google ? 'Connecting to Google...' : 'Continue with Google'}
        </span>
      </motion.button>

      {errors.google && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm"
        >
          {errors.google}
        </motion.div>
      )}

      {/* GitHub OAuth Button */}
      <motion.button
        whileHover={{ scale: disabled || loading.github ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading.github ? 1 : 0.98 }}
        type="button"
        onClick={() => handleOAuthLogin('github')}
        disabled={disabled || loading.github || !configValid || rateLimited}
        className={getButtonClass('github', 'border-gray-800 bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500')}
      >
        {loading.github ? (
          <RefreshCw className="w-5 h-5 animate-spin mr-3" />
        ) : (
          <GitHubIcon />
        )}
        <span className="ml-3">
          {loading.github ? 'Connecting to GitHub...' : 'Continue with GitHub'}
        </span>
      </motion.button>

      {errors.github && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm"
        >
          {errors.github}
        </motion.div>
      )}

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-gray-500 pt-2"
      >
        <p>
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-700">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
        </p>
        <p className="mt-1">
          We only request access to your email and basic profile information.
        </p>
      </motion.div>
    </div>
  );
};

export default OAuthButtons;