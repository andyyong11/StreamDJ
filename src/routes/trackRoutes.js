const express = require('express');
const router = express.Router();
const { trackModel } = require('../db/models');

// Get all tracks
router.get('/', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const tracks = await trackModel.list(parseInt(limit), parseInt(offset));
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

// Create new track
router.post('/', async (req, res) => {
    try {
        const { title, artist, duration, url } = req.body;
        const newTrack = await trackModel.create(title, artist, duration, url);
        res.status(201).json(newTrack);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update track
router.put('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const updatedTrack = await trackModel.update(req.params.id, updates);
        res.json(updatedTrack);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete track
router.delete('/:id', async (req, res) => {
    try {
        await trackModel.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router; 