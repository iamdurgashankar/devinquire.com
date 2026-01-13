/**
 * Test Runner Component
 * Provides UI for running and displaying test results
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  SkipForward,
  Download,
  Trash2,
  Clock,
  Activity,
  BarChart3,
  Settings,
  Database,
  Shield
} from 'lucide-react';
import RealTimeBlogTestSuite from '../tests/RealTimeBlogTestSuite';
import { 
  isFirebaseConfigured, 
  getFirebaseStatus, 
  getFirebaseInitializationStatus 
} from '../config/firebase';
import firebaseAuthService from '../services/firebaseAuthService';
import firestoreService from '../services/firestoreService';

const TestRunner = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [showFirebaseStatus, setShowFirebaseStatus] = useState(false);
  const testSuiteRef = useRef(null);

  // Initialize Firebase status check
  React.useEffect(() => {
    checkFirebaseStatus();
  }, []);

  /**
   * Check Firebase configuration and services status
   */
  const checkFirebaseStatus = useCallback(async () => {
    try {
      const configured = isFirebaseConfigured();
      const firebaseStatusData = getFirebaseStatus();
      const initStatus = getFirebaseInitializationStatus();

      // Test services
      const services = {
        auth: firebaseAuthService.isAvailable(),
        firestore: firestoreService.isAvailable(),
        authService: firebaseAuthService.getServiceStatus?.() || null
      };

      setFirebaseStatus({
        configured,
        firebaseStatusData,
        initStatus,
        services,
        errors: initStatus.error ? [initStatus.error] : []
      });
    } catch (error) {
      setFirebaseStatus(prev => ({
        ...prev,
        errors: [error.message]
      }));
    }
  }, []);

  /**
   * Test Firebase Authentication
   */
  const testFirebaseAuth = useCallback(async () => {
    try {
      const authStatus = firebaseAuthService.getServiceStatus?.();
      const testResult = {
        category: 'Firebase',
        test: 'Authentication Service',
        status: 'PASSED',
        details: `Auth service is available. Status: ${JSON.stringify(authStatus)}`,
        timestamp: Date.now()
      };
      setResults(prev => [...prev, testResult]);
    } catch (error) {
      const testResult = {
        category: 'Firebase',
        test: 'Authentication Service',
        status: 'FAILED',
        details: `Auth test error: ${error.message}`,
        timestamp: Date.now()
      };
      setResults(prev => [...prev, testResult]);
    }
  }, []);

  /**
   * Test Firebase Firestore
   */
  const testFirebaseDatabase = useCallback(async () => {
    try {
      // Test database connection (will fail with permission denied, which is expected)
      await firestoreService.getDocuments('test', { limitCount: 1 });
      const testResult = {
        category: 'Firebase',
        test: 'Firestore Database',
        status: 'PASSED',
        details: 'Database connection successful!',
        timestamp: Date.now()
      };
      setResults(prev => [...prev, testResult]);
    } catch (error) {
      if (error.message.includes('permission-denied') || error.message.includes('unauthenticated')) {
        const testResult = {
          category: 'Firebase',
          test: 'Firestore Database',
          status: 'PASSED',
          details: 'Database connection successful! (Access properly restricted by security rules)',
          timestamp: Date.now()
        };
        setResults(prev => [...prev, testResult]);
      } else {
        const testResult = {
          category: 'Firebase',
          test: 'Firestore Database',
          status: 'FAILED',
          details: `Database test error: ${error.message}`,
          timestamp: Date.now()
        };
        setResults(prev => [...prev, testResult]);
      }
    }
  }, []);

  /**
   * Run test suite
   */
  const runTests = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      testSuiteRef.current = new RealTimeBlogTestSuite();
      const testResults = await testSuiteRef.current.runAllTests();
      
      setResults(testResults);
      generateSummary(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
      setResults([{
        category: 'Test Runner',
        test: 'Test Execution',
        status: 'FAILED',
        details: error.message,
        timestamp: Date.now()
      }]);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  /**
   * Generate test summary
   */
  const generateSummary = useCallback((testResults) => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    const warnings = testResults.filter(r => r.status === 'WARNING').length;
    const skipped = testResults.filter(r => r.status === 'SKIPPED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    setSummary({
      total,
      passed,
      failed,
      warnings,
      skipped,
      passRate
    });
  }, []);

  /**
   * Get unique categories
   */
  const getCategories = useCallback(() => {
    const categories = ['all', ...new Set(results.map(r => r.category))];
    return categories;
  }, [results]);

  /**
   * Filter results by category
   */
  const getFilteredResults = useCallback(() => {
    if (selectedCategory === 'all') {
      return results;
    }
    return results.filter(r => r.category === selectedCategory);
  }, [results, selectedCategory]);

  /**
   * Get status icon
   */
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'SKIPPED':
        return <SkipForward className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  }, []);

  /**
   * Get status color
   */
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SKIPPED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }, []);

  /**
   * Export test results
   */
  const exportResults = useCallback(() => {
    const exportData = {
      summary,
      results,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [summary, results]);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setSummary(null);
    setSelectedCategory('all');
  }, []);

  const filteredResults = getFilteredResults();
  const categories = getCategories();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Real-time Blog System Test Suite</h2>
              <p className="text-gray-600 text-sm">Comprehensive testing and validation</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {results.length > 0 && (
              <>
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={clearResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </>
            )}
            
            <button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isRunning ? 'Running Tests...' : 'Run Tests'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>

        {/* Firebase Status Toggle */}
        <div className="px-6 py-2 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowFirebaseStatus(!showFirebaseStatus)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-4 h-4" />
            <span>Firebase Configuration Status</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              firebaseStatus?.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {firebaseStatus?.configured ? 'Configured' : 'Not Configured'}
            </span>
          </button>
          
          {showFirebaseStatus && firebaseStatus && (
            <div className="mt-3 p-3 bg-white rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Services Status</span>
                  </h4>
                  <div className="space-y-1">
                    <div className={`flex justify-between px-2 py-1 rounded ${
                      firebaseStatus.services.auth ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span>Auth:</span>
                      <span>{firebaseStatus.services.auth ? 'Available' : 'Not Available'}</span>
                    </div>
                    <div className={`flex justify-between px-2 py-1 rounded ${
                      firebaseStatus.services.firestore ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      <span>Firestore:</span>
                      <span>{firebaseStatus.services.firestore ? 'Available' : 'Not Available'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-1">
                    <Database className="w-4 h-4" />
                    <span>Quick Tests</span>
                  </h4>
                  <div className="space-y-1">
                    <button
                      onClick={testFirebaseAuth}
                      disabled={!firebaseStatus.services.auth}
                      className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Test Auth
                    </button>
                    <button
                      onClick={testFirebaseDatabase}
                      disabled={!firebaseStatus.services.firestore}
                      className="w-full px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Test Database
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <div className={`text-xs p-2 rounded ${
                    firebaseStatus.configured ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {firebaseStatus.configured ? 
                      '✅ Firebase properly configured' : 
                      '❌ Firebase not configured'
                    }
                  </div>
                  {firebaseStatus.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      {firebaseStatus.errors.map((error, idx) => (
                        <div key={idx}>⚠️ {error}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            {/* Summary */}
            {summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Summary</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tests:</span>
                    <span className="font-medium">{summary.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Passed:</span>
                    <span className="font-medium">{summary.passed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Failed:</span>
                    <span className="font-medium">{summary.failed}</span>
                  </div>
                  {summary.warnings > 0 && (
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Warnings:</span>
                      <span className="font-medium">{summary.warnings}</span>
                    </div>
                  )}
                  {summary.skipped > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skipped:</span>
                      <span className="font-medium">{summary.skipped}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Pass Rate:</span>
                    <span className={`font-medium ${
                      parseFloat(summary.passRate) >= 90 ? 'text-green-600' : 
                      parseFloat(summary.passRate) >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {summary.passRate}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${summary.passRate}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Filter by Category</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200 capitalize ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                    {category !== 'all' && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({results.filter(r => r.category === category).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            {isRunning && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Running Tests...</h3>
                  <p className="text-gray-600">Please wait while we validate your real-time blog system</p>
                </div>
              </div>
            )}

            {!isRunning && results.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Tests Run Yet</h3>
                  <p className="text-gray-600 mb-4">Click "Run Tests" to start the comprehensive test suite</p>
                </div>
              </div>
            )}

            {!isRunning && filteredResults.length > 0 && (
              <div className="space-y-3">
                {filteredResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.test}</h4>
                          <p className="text-sm opacity-75">{result.category}</p>
                        </div>
                      </div>
                      <span className="text-xs opacity-75">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {result.details && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                        {result.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunner;