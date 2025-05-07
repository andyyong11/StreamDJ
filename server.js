// Requiring modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const path = require('path'); // ✅ Added to resolve static file path
const dbConfig = require('./src/db/config');

const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const pgp = require('pg-promise')();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const winston = require('winston');
const db = require('./src/db/config');

// Import middleware
const { standardLimiter, authLimiter, uiLimiter } = require('./src/middleware/rateLimiter');
const authenticateToken = require('./src/middleware/authenticateToken');

// Import services
const StreamKeyService = require('./src/services/streamKeyService');
const nms = require('./src/services/streamServer');

require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');
const publicPlaylistRoutes = require('./src/routes/publicPlaylistRoutes');
const trackRoutes = require('./src/routes/trackRoutes');
const albumRoutes = require('./src/routes/albumRoutes');
const trendingRoutes = require('./src/routes/trendingRoutes');
const recommendRoutes = require('./src/routes/recommendRoutes');
const streamRoutes = require('./src/routes/streamRoutes');

// Define port
const PORT = process.env.PORT || 5001;

// Constants for file paths
const MEDIA_PATH = path.join(__dirname, 'media');
const NORMALIZED_MEDIA_PATH = MEDIA_PATH.replace(/\\/g, '/');
const UPLOADS_PATH = path.join(__dirname, 'uploads');
const ALBUM_COVERS_PATH = path.join(__dirname, 'uploads/album_covers');
const COVERS_PATH = path.join(__dirname, 'uploads/covers');
const PROFILES_PATH = path.join(__dirname, 'uploads/profiles');
const BANNERS_PATH = path.join(__dirname, 'uploads/banners');

// Create upload directories if they don't exist
[UPLOADS_PATH, ALBUM_COVERS_PATH, COVERS_PATH, PROFILES_PATH, BANNERS_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');
const trackRoutes = require('./src/routes/trackRoutes');

const trendingRoutes = require('./src/routes/trendingRoutes');
const recommendRoutes = require('./src/routes/recommendRoutes');
const libraryRoutes = require('./src/routes/libraryRoutes');

const streamRoutes = require('./src/routes/streamRoutes');


// Import middleware
const authenticateToken = require('./src/middleware/authenticateToken');

// Import services
const StreamKeyService = require('./src/services/streamKeyService');
const nms = require('./src/services/streamServer');

// Creating express object
const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

// Apply CORS middleware before other middleware
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json());

// Enable ETag caching for improved performance and reduced requests
app.set('etag', 'strong');

// Apply different rate limiters based on route
// Apply more strict limits to auth routes
app.use('/api/auth', authLimiter);

// Apply UI-friendly limits to UI-focused and public routes that are fetched on initial load
app.use('/api/tracks', uiLimiter);
app.use('/api/trending', uiLimiter);
app.use('/api/recommendations', uiLimiter);
app.use('/api/public-playlists', uiLimiter);

// Apply standard limits to authenticated or less frequently accessed API routes
app.use('/api/users', standardLimiter);
app.use('/api/albums', standardLimiter);
app.use('/api/playlists', standardLimiter);
app.use('/api/streams', standardLimiter);

// Static file serving - updated for better path handling
app.use('/uploads', (req, res, next) => {
  // Decode URL components to fix encoding issues
  req.url = decodeURIComponent(req.url);
  next();
}, express.static(UPLOADS_PATH));

app.use('/uploads/album_covers', (req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
}, express.static(ALBUM_COVERS_PATH));

app.use('/uploads/covers', (req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
}, express.static(COVERS_PATH));

app.use('/uploads/profiles', (req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
}, express.static(PROFILES_PATH));

app.use('/uploads/banners', (req, res, next) => {
  req.url = decodeURIComponent(req.url);
  next();
}, express.static(BANNERS_PATH));

// Add 404 handler for image files to debug missing files
app.use('/uploads', (req, res, next) => {
  const extension = path.extname(req.url).toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  
  if (imageExtensions.includes(extension)) {
    logger.info(`Image not found: ${req.method} ${req.originalUrl} -> ${req.url}`);
    return res.status(404).send('Image not found');
  }
  next();
});

// Test database connection route
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result[0].now
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Database connection with retry logic
const createPool = async (retries = 5) => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    schema: 'public'
  });

  try {
    console.log('Attempting to connect to database with:', {
      host: process.env.DB_HOST, 
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      // Password hidden for security
    });
    
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');
    
    // Create a pg-promise wrapper for models that need it
    const dbConnection = pgp({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    return { pool, db: dbConnection };
  } catch (err) {
    logger.error('Database connection error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    if (retries === 0) {
      logger.error('Failed to connect to database after multiple retries', err);
      throw err;
    }
    logger.warn(`Database connection failed, retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return createPool(retries - 1);
  }
};

// Initialize database connection
let pool;
let dbConnection;
let streamKeyService;

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/streams', (req, res, next) => {
  if (!pool || !streamKeyService) {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
  streamRoutes(pool, streamKeyService)(req, res, next);
});
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/public-playlists', publicPlaylistRoutes);
// Allow public access to playlists routes without authentication
app.use('/api/playlists', playlistRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/library', libraryRoutes);

// Initialize database and services
const initializeDatabase = async () => {
  try {
    const { pool: createdPool, db: createdDb } = await createPool();
    pool = createdPool;
    dbConnection = createdDb;
    app.locals.db = dbConnection; // Use pg-promise for models
    streamKeyService = new StreamKeyService(dbConnection); // Use pg-promise for streamKeyService
    logger.info('Database and services initialized successfully');
  } catch (err) {
    logger.error('Fatal: Could not initialize database and services', err);
    process.exit(1);
  }
};

// Serve HLS media files
app.use('/live', express.static(path.join(NORMALIZED_MEDIA_PATH, 'live'), {
  setHeaders: (res, filepath) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (filepath.endsWith('.m3u8')) {
      res.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filepath.endsWith('.ts')) {
      res.set('Content-Type', 'video/mp2t');
    }
  }
}));

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8
});

// Make io accessible to route handlers
app.set('io', io);

// Socket connection handling with rate limiting
const socketLimiter = new Map();
const chatRooms = new Map(); // Track users in chat rooms
const streamViewers = new Map(); // Track viewers per stream
const userStreams = new Map(); // Track which stream each user is viewing
const viewerDisconnectTimers = new Map(); // Track disconnect timers for viewers
const viewerActionDebounce = new Map(); // Prevent rapid action fluctuations 

io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  const now = Date.now();
  const anonymousId = socket.handshake.auth?.anonymousId;
  
  // Store the anonymousId on the socket for future reference
  if (anonymousId) {
    socket.anonymousId = anonymousId;
    logger.info('Client connected with anonymousId', { socketId: socket.id, anonymousId, ip });
  } else {
    logger.info('Client connected without anonymousId', { socketId: socket.id, ip });
  }
  
  if (socketLimiter.has(ip)) {
    const lastConnection = socketLimiter.get(ip);
    if (now - lastConnection < 1000) { // 1 second cooldown
      socket.disconnect();
      return;
    }
  }
  
  socketLimiter.set(ip, now);

  // Handler functions for viewer tracking
  const getViewerId = (socket) => {
    // Return anonymousId if available, otherwise use socket.id
    return socket.anonymousId || socket.id;
  };

  // Helper function to prevent rapid actions
  const isActionDebounced = (actionKey, debounceTimeMs = 1000) => {
    const now = Date.now();
    if (viewerActionDebounce.has(actionKey)) {
      const lastActionTime = viewerActionDebounce.get(actionKey);
      if (now - lastActionTime < debounceTimeMs) {
        return true; // Action is debounced
      }
    }
    viewerActionDebounce.set(actionKey, now);
    return false; // Action is not debounced
  };


  const removeViewerFromStream = (viewerId, streamId) => {
    const streamIdStr = streamId.toString();
    const debounceKey = `remove:${viewerId}:${streamIdStr}`;
    
    // Clear any existing disconnect timer
    if (viewerDisconnectTimers.has(viewerId)) {
      clearTimeout(viewerDisconnectTimers.get(viewerId));
      viewerDisconnectTimers.delete(viewerId);
    }
    
    // Don't allow rapid remove actions
    if (isActionDebounced(debounceKey)) {
      logger.info(`Debounced remove action for viewer ${viewerId} from stream ${streamIdStr}`);
      return;
    }
    
    // Set a timeout to remove the viewer after a delay
    // This prevents removing viewers during short disconnections
    const disconnectTimer = setTimeout(() => {
      if (streamViewers.has(streamIdStr)) {
        const wasRemoved = streamViewers.get(streamIdStr).delete(viewerId);
        
        if (wasRemoved) {
          const newCount = streamViewers.get(streamIdStr).size;
          logger.info(`Viewer ${viewerId} removed from stream ${streamIdStr}, new count: ${newCount}`);
          
          // Broadcast the new count to all viewers
          io.to(`stream_viewers:${streamIdStr}`).emit('viewer_count_update', {
            streamId: streamIdStr,
            count: newCount // Exact count, no minimum
          });
          
          // Update the database
          updateStreamListenerCount(streamIdStr, newCount);
        }
      }
      
      viewerDisconnectTimers.delete(viewerId);
    }, 5000); // 5 second delay before removing viewer
    
    viewerDisconnectTimers.set(viewerId, disconnectTimer);
  };

  const addViewerToStream = (viewerId, streamIdStr) => {
    const debounceKey = `add:${viewerId}:${streamIdStr}`;
    
    // Cancel any pending removal
    if (viewerDisconnectTimers.has(viewerId)) {
      clearTimeout(viewerDisconnectTimers.get(viewerId));
      viewerDisconnectTimers.delete(viewerId);
    }
    
    // Don't allow rapid add actions
    if (isActionDebounced(debounceKey)) {
      logger.info(`Debounced add action for viewer ${viewerId} to stream ${streamIdStr}`);
      return;
    }
    
    // Create set for this stream if it doesn't exist
    if (!streamViewers.has(streamIdStr)) {
      streamViewers.set(streamIdStr, new Set());
    }
    
    // Add the viewer if they're not already there
    const viewerAdded = !streamViewers.get(streamIdStr).has(viewerId);
    streamViewers.get(streamIdStr).add(viewerId);
    userStreams.set(viewerId, streamIdStr);
    
    if (viewerAdded) {
      const newCount = streamViewers.get(streamIdStr).size;
      logger.info(`Viewer ${viewerId} added to stream ${streamIdStr}, new count: ${newCount}`);
      
      // Broadcast the new count
      io.to(`stream_viewers:${streamIdStr}`).emit('viewer_count_update', {
        streamId: streamIdStr,
        count: newCount // Show exact count, no minimum
      });
      
      // Update the database
      updateStreamListenerCount(streamIdStr, newCount);
    }
  };

  // Handle joining a stream chat room
  socket.on('join_stream', ({ streamId }) => {
    logger.info('User joined stream chat', { socketId: socket.id, streamId });
    socket.join(`stream:${streamId}`);
    
    // Track the user in this room
    if (!chatRooms.has(`stream:${streamId}`)) {
      chatRooms.set(`stream:${streamId}`, new Set());
    }
    chatRooms.get(`stream:${streamId}`).add(socket.id);
  });

  // Handle leaving a stream chat room
  socket.on('leave_stream', ({ streamId }) => {
    logger.info('User left stream chat', { socketId: socket.id, streamId });
    socket.leave(`stream:${streamId}`);
    
    // Remove user from room tracking
    if (chatRooms.has(`stream:${streamId}`)) {
      chatRooms.get(`stream:${streamId}`).delete(socket.id);
    }
  });

  // Handle viewer joining stream (for viewer count)
  socket.on('join_stream_viewers', ({ streamId, anonymousId }) => {
    if (!streamId) return;
    
    const streamIdStr = streamId.toString();
    const viewerId = anonymousId || socket.anonymousId || socket.id;
    
    logger.info('User joined stream viewers tracking', { 
      socketId: socket.id, 
      viewerId,
      streamId: streamIdStr 
    });
    
    socket.join(`stream_viewers:${streamIdStr}`);
    
    // If we already have viewer data for this stream, send it immediately
    const currentCount = streamViewers.has(streamIdStr) 
      ? streamViewers.get(streamIdStr).size 
      : 0;
      
    // Send the exact count (no minimum value enforced)
    const exactCount = currentCount;
    
    // Send an immediate update to this specific socket only
    socket.emit('viewer_count_update', {
      streamId: streamIdStr,
      count: exactCount
    });
    
    // Also add this viewer to the stream if not already tracked
    // This ensures they get counted properly
    if (!streamViewers.has(streamIdStr) || !streamViewers.get(streamIdStr).has(viewerId)) {
      addViewerToStream(viewerId, streamIdStr);
    }
    
    logger.info(`Sent current viewer count of ${exactCount} for stream ${streamIdStr} to socket ${socket.id}`);
  });

  // Track when a user starts viewing a stream
  socket.on('viewer_joined', ({ streamId, anonymousId }) => {
    if (!streamId) return;
    
    const streamIdStr = streamId.toString();
    const viewerId = anonymousId || socket.anonymousId || socket.id;
    
    logger.info('Viewer joined stream', { 
      socketId: socket.id, 
      viewerId,
      streamId: streamIdStr 
    });
    
    // Remove user from any previous stream they were viewing
    if (userStreams.has(viewerId) && userStreams.get(viewerId) !== streamIdStr) {
      const previousStreamId = userStreams.get(viewerId);
      removeViewerFromStream(viewerId, previousStreamId);
    }
    
    // Add the viewer to this stream
    addViewerToStream(viewerId, streamIdStr);
  });
  
  // Track when a user stops viewing a stream
  socket.on('viewer_left', ({ streamId, anonymousId }) => {
    if (!streamId) return;
    
    const streamIdStr = streamId.toString();
    const viewerId = anonymousId || socket.anonymousId || socket.id;
    
    logger.info('Viewer left stream', { 
      socketId: socket.id, 
      viewerId,
      streamId: streamIdStr 
    });
    
    // Remove user from stream viewers
    removeViewerFromStream(viewerId, streamIdStr);
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    logger.info('Chat message received', { 
      socketId: socket.id, 
      streamId: messageData.streamId,
      username: messageData.username
    });
    
    // Broadcast the message to everyone in the stream chat
    io.to(`stream:${messageData.streamId}`).emit('chat_message', messageData);
  });

  socket.on('disconnect', () => {
    const viewerId = socket.anonymousId || socket.id;
    logger.info('Client disconnected', { socketId: socket.id, viewerId, ip });
    
    // Handle viewer disconnecting from a stream
    if (userStreams.has(viewerId)) {
      const streamId = userStreams.get(viewerId);
      removeViewerFromStream(viewerId, streamId);
    }
    
    // Remove user from all chat rooms
    chatRooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        // Extract streamId from roomId (format: 'stream:123')
        const streamId = roomId.split(':')[1];
        // Notify other users that someone left
        socket.to(roomId).emit('user_left', { 
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

// Track the last update time and value for each stream to prevent database churn
const lastDbUpdates = new Map();

// Helper function to update listener count in database
async function updateStreamListenerCount(streamId, count) {
  try {
    if (!pool) return;
    
    // Convert streamId to string and ensure count is a number
    const streamIdStr = streamId.toString();
    const viewerCount = parseInt(count, 10) || 0;
    
    // Use the exact count - no longer enforcing a minimum of 1
    const finalCount = viewerCount;
    
    // Check if we need to update the database
    // If the last update was recent with the same count, skip the DB update
    const updateKey = `${streamIdStr}:${finalCount}`;
    const now = Date.now();
    
    if (lastDbUpdates.has(streamIdStr)) {
      const { time, value } = lastDbUpdates.get(streamIdStr);
      // Only update if the count changed or it's been more than 10 seconds
      if (value === finalCount && now - time < 10000) {
        logger.debug(`Skipped redundant DB update for stream ${streamIdStr}, count: ${finalCount}`);
        return;
      }
    }
    
    // Update the database using node-postgres pool
    await pool.query(
      `UPDATE public."LiveStream" 
       SET "ListenerCount" = $1 
       WHERE "LiveStreamID" = $2 AND "Status" = 'active'`,
      [finalCount, streamIdStr]
    );
    
    // Record this update
    lastDbUpdates.set(streamIdStr, { time: now, value: finalCount });
    
    logger.info(`Updated stream ${streamIdStr} listener count to ${finalCount}`);
  } catch (error) {
    logger.error('Error updating listener count:', error);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Route not found' });
});

// Cleanup on server shutdown
const cleanup = async () => {
  logger.info('Shutting down...');
  try {
    await new Promise((resolve) => httpServer.close(resolve));
    if (pool) await pool.end();
    logger.info('Cleanup completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Error during cleanup', err);
    process.exit(1);
  }
};

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  // Initialize database after server starts
  initializeDatabase();
  // Start media server
  try {
    if (!nms.nmsCore) {
      nms.run();
      logger.info('Media Server started successfully');
    }
  } catch (err) {
    logger.error('Failed to start Media Server:', err);
  }
});

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  // Initialize database after server starts
  initializeDatabase();
  // Start media server
  try {
    if (!nms.nmsCore) {
      nms.run();
      logger.info('Media Server started successfully');
    }
  } catch (err) {
    logger.error('Failed to start Media Server:', err);
  }
});
