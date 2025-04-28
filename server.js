// Requiring modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // ✅ Added to resolve static file path
const db = require('./src/db/config');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const playlistRoutes = require('./src/routes/playlistRoutes');
const trackRoutes = require('./src/routes/trackRoutes');
const trendingRoutes = require('./src/routes/trendingRoutes');
const recommendRoutes = require('./src/routes/recommendRoutes');

// Import middleware
const { auth } = require('./src/middleware/auth');

// Creating express object
const app = express();

// Make db available to middleware
app.locals.db = db;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // React app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// Middleware
app.use(bodyParser.json());

// Serve uploaded audio and cover images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Basic route
app.get('/', (req, res) => {
    res.send('StreamDJ API is running');
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', auth, userRoutes);
app.use('/api/playlists', auth, playlistRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/recommendations', recommendRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Port Number
const PORT = process.env.PORT || 5001;

// Server Setup
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
