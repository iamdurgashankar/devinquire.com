import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import cleanupAdminData from '../utils/cleanupAdminData';

export default function AdminDataCleanup() {
  const [cleanupStatus, setCleanupStatus] = useState('idle'); // 'idle', 'cleaning', 'success', 'error'
  const [cleanupResult, setCleanupResult] = useState(null);

  const handleCleanup = async () => {
    setCleanupStatus('cleaning');
    setCleanupResult(null);

    try {
      const result = cleanupAdminData();
      setCleanupResult(result);
      
      if (result.success) {
        setCleanupStatus('success');
        // Reload page after 2 seconds to ensure all state is cleared
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setCleanupStatus('error');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      setCleanupResult({ success: false, error: error.message });
      setCleanupStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (cleanupStatus) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'cleaning': return 'text-blue-600';
      default: return 'text-neutral-600';
    }
  };

  const getStatusIcon = () => {
    switch (cleanupStatus) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'cleaning': return (
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      );
      default: return <Trash2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Trash2 className="w-6 h-6 text-red-600" />
        <h2 className="text-xl font-semibold text-neutral-800">Admin Data Cleanup</h2>
      </div>
      
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">Warning</h3>
              <p className="text-sm text-yellow-700">
                This will remove all admin-related data including:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
                <li>Local storage admin data</li>
                <li>Session storage data</li>
                <li>Admin authentication tokens</li>
                <li>Firebase IndexedDB stores</li>
                <li>Admin setup results</li>
              </ul>
            </div>
          </div>
        </div>

        {cleanupResult && (
          <div className={`border rounded-lg p-4 ${
            cleanupResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {getStatusIcon()}
              <div>
                <h3 className={`font-medium mb-1 ${
                  cleanupResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {cleanupResult.success ? 'Cleanup Successful' : 'Cleanup Failed'}
                </h3>
                <p className={`text-sm ${
                  cleanupResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {cleanupResult.message || cleanupResult.error}
                </p>
                {cleanupResult.clearedItems && (
                  <ul className="text-sm text-green-700 mt-2 ml-4 list-disc">
                    {cleanupResult.clearedItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
                {cleanupResult.success && (
                  <p className="text-sm text-green-600 mt-2 italic">
                    Page will reload in 2 seconds to complete cleanup...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleCleanup}
          disabled={cleanupStatus === 'cleaning'}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {getStatusIcon()}
          <span className={getStatusColor()}>
            {cleanupStatus === 'cleaning' ? 'Cleaning Up...' : 'Clean Up Admin Data'}
          </span>
        </button>
      </div>
    </div>
  );
}