const express = require('express');
const router = express.Router();
const { liveStreamModel } = require('../db/models');
const { auth } = require('../middleware/auth');

// Get all active streams
router.get('/', async (req, res) => {
    try {
        const streams = await liveStreamModel.getActive();
        res.json(streams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get stream by ID
router.get('/:id', async (req, res) => {
    try {
        const stream = await liveStreamModel.getById(req.params.id);
        res.json(stream);
    } catch (error) {
        res.status(404).json({ error: 'Stream not found' });
    }
});

// Start a new stream (requires authentication)
router.post('/', auth, async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.id;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const stream = await liveStreamModel.create(userId, title, description);
        res.status(201).json(stream);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End a stream (requires authentication)
router.post('/:id/end', auth, async (req, res) => {
    try {
        const streamId = req.params.id;
        const userId = req.user.id;
        
        const result = await liveStreamModel.end(streamId, userId);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Stream not found or already ended' });
        }
        
        res.json({ success: true, message: 'Stream ended successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update viewer count (could be called by WebSocket server)
router.put('/:id/viewers', auth, async (req, res) => {
    try {
        const { count } = req.body;
        const streamId = req.params.id;
        
        await liveStreamModel.updateViewerCount(streamId, count);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 