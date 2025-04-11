const express = require('express');
const router = express.Router();
const { userModel, playlistModel, trackModel } = require('../db/models');

// Get all users
router.get('/', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const users = await userModel.list(parseInt(limit), parseInt(offset));
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await userModel.getById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's playlists
router.get('/:id/playlists', async (req, res) => {
    try {
        const playlists = await playlistModel.getByUserId(req.params.id);
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's liked tracks
router.get('/:id/liked-tracks', async (req, res) => {
    try {
        const tracks = await trackModel.getLikedByUserId(req.params.id);
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's recent tracks
router.get('/:id/recent-tracks', async (req, res) => {
    try {
        const tracks = await trackModel.getRecentByUserId(req.params.id);
        res.json(tracks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 