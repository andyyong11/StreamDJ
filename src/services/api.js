import axios from 'axios';
import { API_BASE_URL, DEFAULT_TIMEOUT } from '../config/apiConfig';

// Create a simpler axios instance with proper defaults
const instance = axios.create({
  baseURL: API_BASE_URL, // Using relative URL to avoid CORS
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add CORS support
  withCredentials: true,
  // Add max content size for request headers
  maxContentLength: 2000000, // 2MB
  maxBodyLength: 2000000, // 2MB
});

// Request cache to prevent duplicate requests
const requestCache = new Map();

// Cache timeout in milliseconds (15 minutes - increased from 10)
const CACHE_TIMEOUT = 15 * 60 * 1000;

// Rate limiting parameters
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // Increased from 3000ms to 5000ms (5 seconds)
const RATE_LIMIT_STATUS = 429;

// Circuit breaker parameters
const CIRCUIT_OPEN_DURATION = 60000; // Increased from 30 seconds to 60 seconds
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
  // Add random jitter of +/- 50% to delay time (increased from 30%)
  const jitterFactor = 0.5 + Math.random(); // 0.5 to 1.5
  return Math.floor(delay * jitterFactor);
};

// Delay function for retry logic
const delay = (ms) => new Promise(resolve => setTimeout(resolve, getJitter(ms)));

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

// Group similar requests to avoid hammering the same endpoints
const activeEndpoints = new Set();
const endpointQueue = new Map();

// Process queued requests for an endpoint
const processEndpointQueue = async (endpoint) => {
  if (!endpointQueue.has(endpoint)) return;
  
  const queue = endpointQueue.get(endpoint);
  if (queue.length === 0) {
    endpointQueue.delete(endpoint);
    activeEndpoints.delete(endpoint);
    return;
  }
  
  const { config, resolve, reject } = queue.shift();
  
  try {
    const response = await instance(config);
    resolve(response);
  } catch (error) {
    reject(error);
  } finally {
    // Wait a short period before processing the next request to this endpoint
    setTimeout(() => {
      processEndpointQueue(endpoint);
    }, getJitter(300)); // ~300ms between requests to same endpoint
  }
};

// Queue a request for a specific endpoint
const queueRequest = (endpoint, config) => {
  return new Promise((resolve, reject) => {
    if (!endpointQueue.has(endpoint)) {
      endpointQueue.set(endpoint, []);
    }
    
    endpointQueue.get(endpoint).push({ config, resolve, reject });
    
    if (!activeEndpoints.has(endpoint)) {
      activeEndpoints.add(endpoint);
      processEndpointQueue(endpoint);
    }
  });
};

// Create a safe request function
const safeRequest = async (config, retryCount = 0) => {
  try {
    // Clone the config to avoid mutation issues
    const safeConfig = { ...config };
    
    // Debug logging
    console.log('Making API request:', {
      url: safeConfig.url,
      method: safeConfig.method || 'GET',
      hasData: !!safeConfig.data
    });
    
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

    // Fix endpoint URLs - ensure they have the /api prefix if needed
    if (safeConfig.url && !safeConfig.url.startsWith('/api') && 
        !safeConfig.url.startsWith('http') && 
        !safeConfig.url.startsWith('/uploads')) {
      const oldUrl = safeConfig.url;
      safeConfig.url = `/api${safeConfig.url.startsWith('/') ? '' : '/'}${safeConfig.url}`;
      console.log(`Rewriting URL: ${oldUrl} -> ${safeConfig.url}`);
    }
    
    // Remove localhost prefix if it's still present in any URL
    if (safeConfig.url && safeConfig.url.includes('http://localhost:5001')) {
      const oldUrl = safeConfig.url;
      safeConfig.url = safeConfig.url.replace('http://localhost:5001', '');
      console.log(`Removing localhost prefix: ${oldUrl} -> ${safeConfig.url}`);
    }
    
    // Ensure URLs don't have double /api prefixes
    if (safeConfig.url && safeConfig.url.includes('/api/api/')) {
      const oldUrl = safeConfig.url;
      safeConfig.url = safeConfig.url.replace('/api/api/', '/api/');
      console.log(`Fixed double API prefix: ${oldUrl} -> ${safeConfig.url}`);
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
          // Extract endpoint pattern for queue management
          const endpoint = safeConfig.url.split('?')[0];
          
          // Make the request through the queue system
          const response = await queueRequest(endpoint, safeConfig);
          
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
    
    // For non-GET requests, just make the request (still using queue for rate control)
    const endpoint = safeConfig.url.split('?')[0];
    return await queueRequest(endpoint, safeConfig);
    
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