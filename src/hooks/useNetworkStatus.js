import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasNetworkError, setHasNetworkError] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasNetworkError(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasNetworkError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setNetworkError = (error) => {
    if (error?.code === 'auth/network-request-failed' || 
        error?.message?.includes('network') ||
        error?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
      setHasNetworkError(true);
      return true;
    }
    return false;
  };

  return {
    isOnline,
    hasNetworkError,
    setNetworkError,
    clearNetworkError: () => setHasNetworkError(false)
  };
} 