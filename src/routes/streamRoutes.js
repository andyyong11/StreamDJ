const express = require('express');
const router = express.Router();
const { streamModel } = require('../db/models');
const { auth } = require('../middleware/auth');

// Public routes - no authentication required
// Get all active streams
router.get('/', async (req, res) => {
    try {
        const streams = await streamModel.getActive();
        res.json(streams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get stream by ID
router.get('/:id', async (req, res) => {
    try {
        const stream = await streamModel.getById(req.params.id);
        res.json(stream);
    } catch (error) {
        res.status(404).json({ error: 'Stream not found' });
    }
});

// Protected routes - authentication required
// Start a new stream
router.post('/', auth, async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.id;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const stream = await streamModel.create(userId, title, description);
        res.status(201).json(stream);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End a stream
router.post('/:id/end', auth, async (req, res) => {
    try {
        const streamId = req.params.id;
        const userId = req.user.id;
        
        const result = await streamModel.end(streamId, userId);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Stream not found or already ended' });
        }
        
        res.json({ success: true, message: 'Stream ended successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat functionality
router.post('/:id/chat', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const streamId = req.params.id;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const chatMessage = await streamModel.addChatMessage(streamId, userId, message);
        res.status(201).json(chatMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get chat messages for a stream
router.get('/:id/chat', async (req, res) => {
    try {
        const streamId = req.params.id;
        const messages = await streamModel.getChatMessages(streamId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 