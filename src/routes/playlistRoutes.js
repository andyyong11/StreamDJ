const express = require('express');
const router = express.Router();
const { playlistModel } = require('../db/models');

// Get all playlists
router.get('/', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const playlists = await playlistModel.listPublic(parseInt(limit), parseInt(offset));
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's playlists
router.get('/user/:userId', async (req, res) => {
    try {
        const playlists = await playlistModel.getByUserId(req.params.userId);
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get playlist by ID
router.get('/:id', async (req, res) => {
    try {
        const playlist = await playlistModel.getById(req.params.id);
        res.json(playlist);
    } catch (error) {
        res.status(404).json({ error: 'Playlist not found' });
    }
});

// Create new playlist
router.post('/', async (req, res) => {
    try {
        const { name, userId, isPublic } = req.body;
        const newPlaylist = await playlistModel.create(name, userId, isPublic);
        res.status(201).json(newPlaylist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update playlist
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const updatedPlaylist = await playlistModel.update(req.params.id, updates);
        res.json(updatedPlaylist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete playlist
router.delete('/:id', async (req, res) => {
    try {
        await playlistModel.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add track to playlist
router.post('/:id/tracks', async (req, res) => {
    try {
        const { trackId, position } = req.body;
        const result = await playlistModel.addTrack(req.params.id, trackId, position);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Remove track from playlist
router.delete('/:id/tracks/:trackId', async (req, res) => {
    try {
        await playlistModel.removeTrack(req.params.id, req.params.trackId);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router; 