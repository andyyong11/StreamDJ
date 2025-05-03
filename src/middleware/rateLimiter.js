const rateLimit = require('express-rate-limit');

// Create a standard limiter for most API routes
const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after a minute',
  skipSuccessfulRequests: false, // Count all requests against the rate limit
});

// Create a more lenient limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  skipSuccessfulRequests: false,
});

// More lenient limiter for common UI operations
const uiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // Increased from 200 to 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after a minute',
  skipSuccessfulRequests: true, // Skip successful requests
  // Add settings to handle burst requests better
  keyGenerator: (req) => {
    // Use IP + user ID if available for more granular rate limiting
    return req.user ? `${req.ip}-${req.user.id}` : req.ip;
  },
  // Skip rate limiting for GET requests with If-None-Match header (cached requests)
  skip: (req) => {
    return req.method === 'GET' && req.headers['if-none-match'];
  }
});

module.exports = {
  standardLimiter,
  authLimiter,
  uiLimiter,
}; 