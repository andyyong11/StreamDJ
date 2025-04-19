// Requiring module
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');
const trackRoutes = require('./src/routes/trackRoutes');
const streamRoutes = require('./src/routes/streamRoutes');

// Import middleware
const authenticateToken = require('./src/middleware/authenticateToken');

// Import services
const StreamKeyService = require('./src/services/streamKeyService');

// Creating express object
const app = express();
const httpServer = createServer(app);

// Define port
const PORT = process.env.PORT || 5001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  schema: 'public'
});

// Make db available to middleware
app.locals.db = pool;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// JSON parsing error handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

// Middleware
app.use(bodyParser.json());

// Serve HLS media files
app.use('/live', express.static(path.join(__dirname, 'media', 'live'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.m3u8')) {
      res.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filepath.endsWith('.ts')) {
      res.set('Content-Type', 'video/mp2t');
    }
  }
}));

// Initialize services
const streamKeyService = new StreamKeyService(pool);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes(pool, streamKeyService));
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/playlists', authenticateToken, playlistRoutes);
app.use('/api/tracks', trackRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
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
    res.status(404).json({ error: 'Route not found' });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  httpServer.close(() => {
    pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  httpServer.close(() => {
    pool.end();
    process.exit(0);
  });
}); 