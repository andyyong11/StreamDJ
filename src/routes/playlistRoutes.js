const express = require('express');
const router = express.Router();
const { playlistModel } = require('../db/models');
const authenticateToken = require('../middleware/authenticateToken');

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

// Get playlists by user ID
router.get('/users/:userId/playlists', async (req, res) => {
    const { userId } = req.params;

    try {
        const playlists = await playlistModel.getByUserId(userId);

        if (!playlists || playlists.length === 0) {
            return res.status(404).json({ message: 'No playlists found for this user.' });
        }

        res.status(200).json(playlists);
    } catch (error) {
        console.error('Error fetching playlists:', error.message);
        res.status(500).json({ error: 'Failed to fetch playlists.' });
    }
});

// Debug route to find playlist-related tables
router.get('/debug/find-playlist-likes', async (req, res) => {
    try {
        const tables = await req.app.locals.db.any(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE '%playlist%'
            ORDER BY table_name;
        `);
        
        res.json(tables);
    } catch (error) {
        console.error('Error finding playlist tables:', error);
        res.status(500).json({ error: 'Failed to find playlist tables' });
    }
});

// Get liked playlists for a user - MUST come before /:id route
router.get('/liked/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Try a simpler approach to get playlists by this user
        const query = `
            SELECT p.*, u."Username" AS CreatorName
            FROM "Playlist" p
            JOIN "User" u ON p."UserID" = u."UserID"
            WHERE p."UserID" = $1
        `;
        
        const userPlaylists = await req.app.locals.db.any(query, [userId]);
        
        // For now, return the user's own playlists since we don't have actual likes
        res.json(userPlaylists);
    } catch (error) {
        console.error('Error fetching liked playlists:', error);
        res.status(500).json({ error: 'Failed to fetch liked playlists' });
    }
});

// Get playlist by ID - Must come AFTER specific routes like /liked/:userId
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