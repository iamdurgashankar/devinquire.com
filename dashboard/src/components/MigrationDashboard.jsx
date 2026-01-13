import React, { useState, useEffect } from 'react';
import dataMigrationService from '../services/dataMigrationService';
import { isFirebaseConfigured } from '../config/firebase';

export default function MigrationDashboard() {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [options, setOptions] = useState({
    migrateUsers: true,
    migratePosts: true,
    migratePages: true,
    migrateSettings: true,
    createBackup: true
  });

  useEffect(() => {
    // Initialize migration status
    setMigrationStatus(dataMigrationService.getMigrationStatus());
  }, []);

  const addLog = (message, type = 'info') => {
    const log = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, log]);
  };

  const runMigration = async () => {
    try {
      setIsRunning(true);
      setLogs([]);
      dataMigrationService.resetMigrationStatus();
      
      addLog('🚀 Starting Firebase migration...', 'info');
      
      // Override console.log to capture migration logs
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        addLog(args.join(' '), 'info');
        originalConsoleLog(...args);
      };

      const originalConsoleError = console.error;
      console.error = (...args) => {
        addLog(args.join(' '), 'error');
        originalConsoleError(...args);
      };

      const result = await dataMigrationService.runFullMigration(options);
      
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;

      if (result.success) {
        addLog('✅ Migration completed successfully!', 'success');
      } else {
        addLog(`❌ Migration failed: ${result.error}`, 'error');
      }

      setMigrationStatus(result.status);
    } catch (error) {
      addLog(`❌ Migration error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = () => {
    dataMigrationService.exportMigrationReport();
    addLog('📄 Migration report exported', 'info');
  };

  const testFirebaseConnection = async () => {
    try {
      addLog('🔍 Testing Firebase connection...', 'info');
      const isConfigured = isFirebaseConfigured();
      
      if (isConfigured) {
        addLog('✅ Firebase is configured and ready', 'success');
      } else {
        addLog('❌ Firebase is not configured. Please check your environment variables.', 'error');
      }
    } catch (error) {
      addLog(`❌ Firebase connection test failed: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="bg-neutral-900 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Firebase Not Configured</h2>
            <p className="mb-4">
              Firebase is not configured. Please set up your Firebase environment variables before running the migration.
            </p>
            <p className="text-sm">
              Required environment variables:
              <br />• REACT_APP_FIREBASE_API_KEY
              <br />• REACT_APP_FIREBASE_AUTH_DOMAIN
              <br />• REACT_APP_FIREBASE_PROJECT_ID
              <br />• REACT_APP_FIREBASE_STORAGE_BUCKET
              <br />• REACT_APP_FIREBASE_MESSAGING_SENDER_ID
              <br />• REACT_APP_FIREBASE_APP_ID
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Backend Migration Dashboard
          </h1>
          <p className="text-neutral-400">
            Migrate your data from PHP/SQLite backend to Firebase
          </p>
        </div>

        {/* Firebase Status */}
        <div className="bg-neutral-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Firebase Status</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-400">Firebase Connected</span>
            </div>
            <button
              onClick={testFirebaseConnection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>

        {/* Migration Options */}
        <div className="bg-neutral-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Migration Options</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(options).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-2 text-neutral-300">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  disabled={isRunning}
                  className="rounded bg-neutral-700 border-neutral-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Migration Controls */}
        <div className="bg-neutral-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Migration Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runMigration}
              disabled={isRunning}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors font-medium"
            >
              {isRunning ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running Migration...</span>
                </div>
              ) : (
                'Start Migration'
              )}
            </button>
            
            <button
              onClick={exportReport}
              disabled={!migrationStatus}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors font-medium"
            >
              Export Report
            </button>
            
            <button
              onClick={clearLogs}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Migration Status */}
        {migrationStatus && (
          <div className="bg-neutral-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Migration Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(migrationStatus).map(([key, status]) => {
                if (typeof status !== 'object' || !status.hasOwnProperty('total')) return null;
                
                const percentage = status.total > 0 ? (status.migrated / status.total) * 100 : 0;
                const hasErrors = status.errors && status.errors.length > 0;
                
                return (
                  <div key={key} className="bg-neutral-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide mb-2">
                      {key}
                    </h3>
                    <div className="text-2xl font-bold text-white mb-2">
                      {status.migrated}/{status.total}
                    </div>
                    <div className="w-full bg-neutral-600 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          hasErrors ? 'bg-red-500' : percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    {hasErrors && (
                      <p className="text-sm text-red-400">
                        {status.errors.length} error(s)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Migration Logs */}
        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Migration Logs</h2>
            <span className="text-sm text-neutral-400">
              {logs.length} entries
            </span>
          </div>
          <div className="bg-neutral-900 rounded-lg p-4 h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">
                No logs yet. Start a migration to see progress.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 text-sm ${
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'success'
                        ? 'text-green-400'
                        : 'text-neutral-300'
                    }`}
                  >
                    <span className="text-neutral-500 font-mono text-xs mt-0.5">
                      {log.timestamp}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-neutral-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Migration Help</h2>
          <div className="text-neutral-300 space-y-4">
            <div>
              <h3 className="font-medium text-white mb-2">Before You Start:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ensure Firebase is properly configured with environment variables</li>
                <li>Make sure you have admin access to both PHP and Firebase backends</li>
                <li>Consider running a test migration on a small dataset first</li>
                <li>Create a backup of your current data (will be done automatically)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">Migration Process:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Users are migrated first as they're required for posts and pages</li>
                <li>Posts and pages are migrated with proper author associations</li>
                <li>Settings are migrated to maintain application configuration</li>
                <li>All data is processed in batches to avoid rate limiting</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">After Migration:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Verify all data has been migrated correctly</li>
                <li>Test authentication and user functionality</li>
                <li>Update your application configuration to use Firebase</li>
                <li>Consider decommissioning the PHP backend</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}