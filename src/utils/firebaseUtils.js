/**
 * Firebase utility functions with timeout handling
 */

/**
 * Wraps Firebase operations with timeout to prevent infinite loading
 * @param {Promise} firebaseOperation - The Firebase operation promise
 * @param {number} timeout - Timeout in milliseconds (default: 8000)
 * @returns {Promise} Promise that resolves with data or rejects with timeout
 */
export const withTimeout = (firebaseOperation, timeout = 8000) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Firebase operation timeout')), timeout)
  );
  
  return Promise.race([firebaseOperation, timeoutPromise]);
};

/**
 * Safely executes Firebase operations with error handling and timeout
 * @param {Function} operation - Function that returns a Firebase promise
 * @param {Object} options - Configuration options
 * @returns {Promise} Promise that resolves with data or null on error
 */
export const safeFirebaseOperation = async (operation, options = {}) => {
  const { timeout = 8000, fallbackValue = null, logErrors = true } = options;
  
  try {
    const result = await withTimeout(operation(), timeout);
    return result;
  } catch (error) {
    if (logErrors) {
      console.warn('Firebase operation failed:', error.message);
    }
    return fallbackValue;
  }
};

/**
 * Creates a loading state manager for Firebase operations
 * @param {Function} setLoading - State setter for loading
 * @returns {Object} Object with methods to handle loading states
 */
export const createLoadingManager = (setLoading) => {
  let timeoutId = null;
  
  const startLoading = () => {
    setLoading(true);
    // Fallback timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      console.warn('Loading timeout reached, stopping loading state');
      setLoading(false);
    }, 10000);
  };
  
  const stopLoading = () => {
    setLoading(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return { startLoading, stopLoading };
};