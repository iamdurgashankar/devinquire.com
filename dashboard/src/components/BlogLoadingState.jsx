import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const BlogLoadingState = ({
  loading = false,
  error = null,
  onRetry = null,
  timeout = 10000, // 10 seconds default timeout
  message = 'Loading...',
  children,
  showNetworkStatus = true
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setHasTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [loading, timeout]);

  const handleRetry = () => {
    setHasTimedOut(false);
    setRetryCount(prev => prev + 1);
    if (onRetry) {
      onRetry();
    }
  };

  // Show error state
  if (error && !loading) {
    const isNetworkError = !isOnline || error.message?.includes('fetch') || error.message?.includes('network');

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-10 max-w-sm w-full text-center border-red-500/20 bg-red-500/5"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            {isNetworkError ? (
              <WifiOff className="w-8 h-8 text-red-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>

          <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2 font-display">
            {isNetworkError ? 'Network Disconnected' : 'System Error'}
          </h3>

          <p className="text-sm font-medium text-surface-500 mb-8 leading-relaxed">
            {isNetworkError
              ? 'Lost connection to DevInquire cloud. Please check your network and retry.'
              : error.message || 'An unexpected error occurred while fetching your data.'}
          </p>

          {onRetry && (
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className={`premium-button-primary w-full flex items-center justify-center gap-3 py-3 ${retryCount >= 3 ? 'opacity-50 grayscale cursor-not-allowed' : ''
                }`}
            >
              <RefreshCw className={`w-4 h-4 ${retryCount > 0 ? 'animate-spin' : ''}`} />
              <span className="uppercase tracking-widest text-[10px] font-bold">
                {retryCount >= 3 ? 'Max Retries Reached' : `Retry Connection ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
              </span>
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // Show timeout state
  if (hasTimedOut && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-card p-10 max-w-sm w-full text-center border-amber-500/20 bg-amber-500/5"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>

          <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2 font-display">
            Still Syncing...
          </h3>

          <p className="text-sm font-medium text-surface-500 mb-8 leading-relaxed">
            This request is taking longer than expected. We're still trying to sync your data.
          </p>

          {onRetry && (
            <button
              onClick={handleRetry}
              className="premium-button-secondary w-full flex items-center justify-center gap-3 py-3"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="uppercase tracking-widest text-[10px] font-bold">Try Refreshing</span>
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="text-center relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-t-2 border-r-2 border-brand-500 rounded-full mx-auto mb-8 shadow-premium"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 font-display tracking-tight">
              {message}
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-brand-500 rounded-full"
                  />
                ))}
              </div>
              {showNetworkStatus && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full border border-surface-200 dark:border-surface-700 shadow-sm">
                  {isOnline ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Live</span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">Offline</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show content when not loading and no error
  return children;
};

export default BlogLoadingState;