const express = require('express');
const router = express.Router();
const { trackModel } = require('../db/models');
const { auth } = require('../middleware/auth');

// Get all tracks
router.get('/', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const tracks = await trackModel.getAll(parseInt(limit), parseInt(offset));
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search tracks
router.get('/search', async (req, res) => {
    try {
        const { query, limit = 10, offset = 0 } = req.query;
        const tracks = await trackModel.search(query, parseInt(limit), parseInt(offset));
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tracks by artist
router.get('/artist/:artist', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const tracks = await trackModel.getByArtist(
            req.params.artist,
            parseInt(limit),
            parseInt(offset)
        );
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get track by ID
router.get('/:id', async (req, res) => {
    try {
        const track = await trackModel.getById(req.params.id);
        res.json(track);
    } catch (error) {
        res.status(404).json({ error: 'Track not found' });
    }
});

// Get track usage statistics
router.get('/:id/usage', async (req, res) => {
    try {
        const usage = await trackModel.getTrackUsage(req.params.id);
        res.json(usage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload a new track (requires authentication)
router.post('/', auth, async (req, res) => {
    try {
        const { title, genre, duration, filePath, coverArt } = req.body;
        const userId = req.user.id;
        
        if (!title || !genre || !duration || !filePath) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const track = await trackModel.create(userId, title, genre, duration, filePath, coverArt);
        res.status(201).json(track);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Like a track (requires authentication)
router.post('/:id/like', auth, async (req, res) => {
    try {
        const trackId = req.params.id;
        const userId = req.user.id;
        
        await trackModel.like(userId, trackId);
        res.json({ success: true, message: 'Track liked' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Unlike a track (requires authentication)
router.delete('/:id/like', auth, async (req, res) => {
    try {
        const trackId = req.params.id;
        const userId = req.user.id;
        
        await trackModel.unlike(userId, trackId);
        res.json({ success: true, message: 'Track unliked' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record a play for a track (requires authentication)
router.post('/:id/play', auth, async (req, res) => {
    try {
        const trackId = req.params.id;
        const userId = req.user.id;
        
        await trackModel.recordPlay(userId, trackId);
        res.json({ success: true, message: 'Play recorded' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a track (requires authentication and ownership)
router.delete('/:id', auth, async (req, res) => {
    try {
        const trackId = req.params.id;
        const userId = req.user.id;
        
        // Check if user owns the track
        const track = await trackModel.getById(trackId);
        if (track.UserID !== userId) {
            return res.status(403).json({ error: 'You can only delete your own tracks' });
        }
        
        await trackModel.delete(trackId);
        res.json({ success: true, message: 'Track deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 