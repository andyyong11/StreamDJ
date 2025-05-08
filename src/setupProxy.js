const { createProxyMiddleware } = require('http-proxy-middleware');

// Server URL - we use hardcoded value here because we can't use ES6 imports in this file
const SERVER_URL = 'http://localhost:5001';

module.exports = function(app) {
  console.log('Setting up proxy middleware...');
  
  // Define route patterns that should be proxied to the backend API
  const routesToProxy = [
    '^/trending',
    '^/recommendations',
    '^/albums',
    '^/tracks',
    '^/playlists',
    '^/streams',
    '^/users',
    '^/library'
  ];
  
  // Create a single middleware to handle all API requests
  const apiMiddleware = createProxyMiddleware({
    target: SERVER_URL,
    changeOrigin: true,
    secure: false,
    logLevel: 'info',
    pathRewrite: (path, req) => {
      // Don't rewrite paths that already include /api
      if (path.startsWith('/api/')) {
        console.log(`Proxying API request: ${req.method} ${path} -> ${SERVER_URL}${path}`);
        return path;
      }
      
      // Add /api prefix to paths that don't have it
      const newPath = `/api${path}`;
      console.log(`Rewriting path: ${req.method} ${path} -> ${newPath}`);
      return newPath;
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.writeHead(500, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ message: 'Proxy Error', error: err.message }));
    }
  });
  
  // Apply the middleware to /api path
  app.use('/api', apiMiddleware);
  
  // Apply the middleware to all other routes that should be proxied
  routesToProxy.forEach(pattern => {
    app.use(new RegExp(pattern), apiMiddleware);
  });
  
  // Proxy media files
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: SERVER_URL,
      changeOrigin: true,
      secure: false,
      logLevel: 'info',
    })
  );
  
  // Proxy sample images
  app.use(
    ['/sample1.jpg', '/sample2.jpg', '/sample3.jpg'],
    createProxyMiddleware({
      target: SERVER_URL,
      changeOrigin: true,
      secure: false,
      logLevel: 'info',
    })
  );
}; 