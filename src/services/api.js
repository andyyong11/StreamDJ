import axios from 'axios';

// Create a simpler axios instance with proper defaults
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request cache to prevent duplicate requests
const requestCache = new Map();

// Cache timeout in milliseconds (10 minutes - increased from 5)
const CACHE_TIMEOUT = 10 * 60 * 1000;

// Rate limiting parameters
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // Increased from 1000ms to 2000ms (2 seconds)
const RATE_LIMIT_STATUS = 429;

// Circuit breaker parameters
const CIRCUIT_OPEN_DURATION = 5000; // 5 seconds
const circuitBreakers = new Map();

// Pending requests queue to prevent duplicate in-flight requests
const pendingRequests = new Map();

// Helper function to generate a cache key
const getCacheKey = (method, url, params, data) => {
  try {
    return `${method || 'GET'}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
  } catch (error) {
    console.error('Error generating cache key:', error);
    return `${Date.now()}`;
  }
};

// Helper function to add "jitter" to delay times to prevent request stampedes
const getJitter = (delay) => {
  // Add random jitter of +/- 20% to delay time
  const jitterFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
  return Math.floor(delay * jitterFactor);
};

// Delay function for retry logic
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if a cached response is still valid
const isCacheValid = (timestamp) => {
  return (Date.now() - timestamp) < CACHE_TIMEOUT;
};

// Check if circuit breaker is open for a specific URL pattern
const isCircuitOpen = (url) => {
  // Look for circuit breakers that match this URL pattern
  for (const [pattern, breakerInfo] of circuitBreakers.entries()) {
    if (url.includes(pattern) && breakerInfo.openUntil > Date.now()) {
      console.log(`Circuit breaker open for ${pattern} until ${new Date(breakerInfo.openUntil).toISOString()}`);
      return true;
    }
  }
  return false;
};

// Open a circuit breaker for a specific URL pattern
const openCircuitBreaker = (url) => {
  // Extract base pattern (e.g., /api/tracks, /api/albums)
  const pattern = url.split('/').slice(0, 3).join('/');
  const openUntil = Date.now() + CIRCUIT_OPEN_DURATION;
  circuitBreakers.set(pattern, { openUntil });
  console.warn(`Circuit breaker opened for ${pattern} until ${new Date(openUntil).toISOString()}`);
};

// Create a safe request function
const safeRequest = async (config, retryCount = 0) => {
  try {
    // Clone the config to avoid mutation issues
    const safeConfig = { ...config };
    
    // Ensure method is always defined and uppercase
    safeConfig.method = (safeConfig.method || 'GET').toUpperCase();
    
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      safeConfig.headers = {
        ...safeConfig.headers,
        Authorization: `Bearer ${token}`
      };
    }
    
    // Generate request key
    const requestKey = getCacheKey(
      safeConfig.method, 
      safeConfig.url, 
      safeConfig.params, 
      safeConfig.data
    );
    
    // Check if circuit breaker is open for this URL
    if (isCircuitOpen(safeConfig.url)) {
      console.log(`Circuit breaker active for ${safeConfig.url}, using cached data if available`);
      
      // For GET requests, return cached data if available
      if (safeConfig.method === 'GET') {
        const cachedResponse = requestCache.get(requestKey);
        if (cachedResponse) {
          console.log('Circuit open - returning cached response for:', safeConfig.url);
          return cachedResponse.data;
        }
      }
      
      // If no cached data and circuit is open, throw a rate limit error
      throw {
        response: {
          status: RATE_LIMIT_STATUS,
          data: { message: 'Rate limit circuit breaker active' }
        }
      };
    }
    
    // For GET requests, check cache first
    if (safeConfig.method === 'GET') {
      // Check if we have a cached response
      const cachedResponse = requestCache.get(requestKey);
      if (cachedResponse && isCacheValid(cachedResponse.timestamp)) {
        console.log('Using cached response for:', safeConfig.url);
        return cachedResponse.data;
      }
      
      // Check if there's already a pending request for this exact query
      if (pendingRequests.has(requestKey)) {
        console.log('Reusing pending request for:', safeConfig.url);
        return pendingRequests.get(requestKey);
      }
      
      // Create a promise for this request and store it
      const requestPromise = (async () => {
        try {
          // Make the request
          const response = await instance(safeConfig);
          
          // Cache the response
          requestCache.set(requestKey, {
            data: response,
            timestamp: Date.now()
          });
          
          // Remove from pending requests
          pendingRequests.delete(requestKey);
          
          return response;
        } catch (error) {
          // If rate limited, open circuit breaker
          if (error.response && error.response.status === RATE_LIMIT_STATUS) {
            openCircuitBreaker(safeConfig.url);
          }
          
          // Remove from pending requests
          pendingRequests.delete(requestKey);
          throw error;
        }
      })();
      
      // Store the promise
      pendingRequests.set(requestKey, requestPromise);
      
      // Return the promise
      return requestPromise;
    }
    
    // For non-GET requests, just make the request
    return await instance(safeConfig);
    
  } catch (error) {
    // Handle rate limiting with exponential backoff
    if (error.response && error.response.status === RATE_LIMIT_STATUS) {
      // If we haven't exceeded max retries, try again
      if (retryCount < MAX_RETRIES) {
        // Calculate delay with exponential backoff and jitter
        const baseDelay = RETRY_DELAY_MS * (2 ** retryCount);
        const jitteredDelay = getJitter(baseDelay);
        
        console.warn(`Rate limited for ${config.url}. Retrying in ${jitteredDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        // Wait with exponential backoff and jitter
        await delay(jitteredDelay);
        
        // Try again with incremented retry count
        return safeRequest(config, retryCount + 1);
      } else {
        // We've exceeded max retries, open circuit breaker
        openCircuitBreaker(config.url);
        
        // For GET requests, return cached data if available (even if expired)
        if (config.method === 'GET' || config.method.toUpperCase() === 'GET') {
          const requestKey = getCacheKey(
            config.method, 
            config.url, 
            config.params, 
            config.data
          );
          
          const cachedResponse = requestCache.get(requestKey);
          if (cachedResponse) {
            console.log('Using expired cached data after rate limit:', config.url);
            return cachedResponse.data;
          }
        }
      }
    }
    
    console.error('API Error:', error);
    throw error;
  }
};

// Create API object with safe method wrappers
const api = {
  get: (url, config = {}) => {
    return safeRequest({
      url,
      method: 'GET',
      ...config
    });
  },
  
  post: (url, data, config = {}) => {
    return safeRequest({
      url,
      method: 'POST',
      data,
      ...config
    });
  },
  
  put: (url, data, config = {}) => {
    return safeRequest({
      url,
      method: 'PUT',
      data,
      ...config
    });
  },
  
  delete: (url, config = {}) => {
    return safeRequest({
      url,
      method: 'DELETE',
      ...config
    });
  },
  
  // Manual cache control methods
  clearCache: () => {
    requestCache.clear();
  },
  
  clearCacheFor: (url) => {
    for (const [key, value] of requestCache.entries()) {
      if (key.includes(url)) {
        requestCache.delete(key);
      }
    }
  },
  
  // Reset circuit breakers
  resetCircuitBreakers: () => {
    circuitBreakers.clear();
  }
};

export default api; 