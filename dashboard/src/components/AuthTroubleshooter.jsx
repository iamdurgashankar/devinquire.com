import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Key, User, Settings, Shield, Info } from 'lucide-react';
import { useAuth } from '../contexts/EnhancedAuthContext';
import { isFirebaseConfigured } from '../config/firebase';
import createAdminUser from '../utils/createAdminUser';

const AuthTroubleshooter = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [adminCreationStatus, setAdminCreationStatus] = useState('idle');
  const { currentUser, signInWithEmail } = useAuth();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = {
      firebaseConfig: false,
      authService: false,
      adminUser: false,
      networkConnection: false,
      issues: [],
      recommendations: []
    };

    try {
      // Check Firebase Configuration
      results.firebaseConfig = isFirebaseConfigured();
      if (!results.firebaseConfig) {
        results.issues.push('Firebase is not properly configured');
        results.recommendations.push('Set up Firebase environment variables in .env file');
      }

      // Check Network Connection
      try {
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
        results.networkConnection = true;
      } catch {
        results.networkConnection = false;
        results.issues.push('Network connectivity issues detected');
        results.recommendations.push('Check your internet connection');
      }

      // Test Admin User Creation
      try {
        const adminResult = await createAdminUser();
        results.adminUser = true;
        results.adminUserDetails = adminResult;
      } catch (error) {
        results.adminUser = false;
        results.issues.push(`Admin user creation failed: ${error.message}`);
        results.recommendations.push('Try creating admin user manually or check Firebase setup');
      }

      // Auth Service Check
      results.authService = results.firebaseConfig && results.networkConnection;

    } catch (error) {
      results.issues.push(`Diagnostic error: ${error.message}`);
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const testAdminLogin = async () => {
    setAdminCreationStatus('testing');
    try {
      await signInWithEmail('admin@devinquire.com', '8763155488@Sipu');
      setAdminCreationStatus('success');
    } catch (error) {
      setAdminCreationStatus('error');
      console.error('Admin login test failed:', error);
    }
  };

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === false) return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusColor = (status) => {
    if (status === true) return 'text-green-600';
    if (status === false) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/30 to-purple-50/30 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Authentication Troubleshooter</h1>
          <p className="text-neutral-600">Diagnose and resolve credential validation issues</p>
        </div>

        {/* Current User Status */}
        {currentUser && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Currently Authenticated</p>
                <p className="text-green-600">{currentUser.email} ({currentUser.role || 'user'})</p>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-800">System Diagnostics</h2>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Run Diagnostics</span>
                </>
              )}
            </button>
          </div>

          {/* Diagnostic Results */}
          {diagnostics && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                  {getStatusIcon(diagnostics.firebaseConfig)}
                  <div>
                    <p className="font-medium">Firebase Configuration</p>
                    <p className={`text-sm ${getStatusColor(diagnostics.firebaseConfig)}`}>
                      {diagnostics.firebaseConfig ? 'Properly configured' : 'Configuration missing'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                  {getStatusIcon(diagnostics.networkConnection)}
                  <div>
                    <p className="font-medium">Network Connection</p>
                    <p className={`text-sm ${getStatusColor(diagnostics.networkConnection)}`}>
                      {diagnostics.networkConnection ? 'Connected' : 'Connection issues'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                  {getStatusIcon(diagnostics.authService)}
                  <div>
                    <p className="font-medium">Authentication Service</p>
                    <p className={`text-sm ${getStatusColor(diagnostics.authService)}`}>
                      {diagnostics.authService ? 'Available' : 'Service unavailable'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                  {getStatusIcon(diagnostics.adminUser)}
                  <div>
                    <p className="font-medium">Admin User</p>
                    <p className={`text-sm ${getStatusColor(diagnostics.adminUser)}`}>
                      {diagnostics.adminUser ? 'Created successfully' : 'Creation failed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Issues Found */}
              {diagnostics.issues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    Issues Found
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                    {diagnostics.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {diagnostics.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Recommendations
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                    {diagnostics.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Common Solutions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4">Common Solutions</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-neutral-800">"Invalid Credential" Error</h3>
              <p className="text-neutral-600 text-sm mt-1">
                This usually means the email/password combination is incorrect or the user doesn't exist.
              </p>
              <div className="mt-2">
                <button
                  onClick={testAdminLogin}
                  disabled={adminCreationStatus === 'testing'}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Test Admin Login
                </button>
                {adminCreationStatus === 'testing' && (
                  <span className="ml-2 text-sm text-blue-600">Testing...</span>
                )}
                {adminCreationStatus === 'success' && (
                  <span className="ml-2 text-sm text-green-600">✓ Login successful</span>
                )}
                {adminCreationStatus === 'error' && (
                  <span className="ml-2 text-sm text-red-600">✗ Login failed</span>
                )}
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-neutral-800">Create Admin User</h3>
              <p className="text-neutral-600 text-sm mt-1">
                Navigate to <code className="bg-neutral-100 px-1 rounded">/admin-setup</code> to create the admin user.
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-medium text-neutral-800">Firebase Configuration</h3>
              <p className="text-neutral-600 text-sm mt-1">
                Ensure all Firebase environment variables are set in your <code className="bg-neutral-100 px-1 rounded">.env</code> file.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium text-neutral-800">Network Issues</h3>
              <p className="text-neutral-600 text-sm mt-1">
                Check your internet connection and firewall settings. Firebase requires outbound HTTPS access.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Credentials */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2 text-blue-600" />
            Admin Credentials
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <div className="bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-600 font-mono">
                  admin@devinquire.com
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                <div className="bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-600 font-mono">
                  8763155488@Sipu
                </div>
              </div>
            </div>
            <p className="text-yellow-700 text-sm mt-3">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Use these credentials only after creating the admin user via the admin setup page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTroubleshooter;