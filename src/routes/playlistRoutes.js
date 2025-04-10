const express = require('express');
const router = express.Router();
const { playlistModel, trackModel } = require('../db/models');
const { auth } = require('../middleware/auth');
const db = require('../db/config');

// Get all public playlists
router.get('/', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const playlists = await playlistModel.getPublic(parseInt(limit), parseInt(offset));
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

// Create a new playlist (requires authentication)
router.post('/', auth, async (req, res) => {
    try {
        const { title, isPublic = true } = req.body;
        const userId = req.user.id;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const playlist = await playlistModel.create(userId, title, isPublic);
        res.status(201).json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get playlist tracks
router.get('/:id/tracks', async (req, res) => {
    try {
        const { id } = req.params;
        const playlist = await playlistModel.getById(id);
        
        // Query to get tracks in this playlist
        const tracks = await db.any(`
            SELECT t.*, pt."AddedAt" 
            FROM "Track" t
            JOIN "PlaylistTrack" pt ON t."TrackID" = pt."TrackID"
            WHERE pt."PlaylistID" = $1
            ORDER BY pt."AddedAt" DESC
        `, [id]);
        
        res.json(tracks);
    } catch (error) {
        res.status(404).json({ error: 'Playlist or tracks not found' });
    }
});

// Add track to playlist (requires authentication)
router.post('/:id/tracks', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { trackId } = req.body;
        const userId = req.user.id;
        
        // Check if user owns the playlist
        const playlist = await playlistModel.getById(id);
        if (playlist.UserID !== userId) {
            return res.status(403).json({ error: 'You can only add tracks to your own playlists' });
        }
        
        const result = await playlistModel.addTrack(id, trackId);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove track from playlist (requires authentication)
router.delete('/:playlistId/tracks/:trackId', auth, async (req, res) => {
    try {
        const { playlistId, trackId } = req.params;
        const userId = req.user.id;
        
        // Check if user owns the playlist
        const playlist = await playlistModel.getById(playlistId);
        if (playlist.UserID !== userId) {
            return res.status(403).json({ error: 'You can only remove tracks from your own playlists' });
        }
        
        const result = await playlistModel.removeTrack(playlistId, trackId);
        res.json({ success: true, message: 'Track removed from playlist' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete playlist (requires authentication)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Check if user owns the playlist
        const playlist = await playlistModel.getById(id);
        if (playlist.UserID !== userId) {
            return res.status(403).json({ error: 'You can only delete your own playlists' });
        }
        
        await playlistModel.delete(id);
        res.json({ success: true, message: 'Playlist deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get trending playlists
router.get('/trending', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const playlists = await playlistModel.getTrending(parseInt(limit), parseInt(offset));
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 