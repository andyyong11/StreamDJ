const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Multer setup for audio and cover uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isAudio = file.fieldname === 'audioFile';
    const folder = isAudio ? 'uploads/audio' : 'uploads/covers';
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// ====================================================

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



// =======================================new uploard route

// Upload track with audio + cover art
router.post('/upload', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverArt', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { title, genre, duration, userId } = req.body;
      const audioFile = req.files.audioFile?.[0];
      const coverArtFile = req.files.coverArt?.[0];
  
      if (!audioFile || !coverArtFile) {
        return res.status(400).json({ error: 'Audio and cover art files are required.' });
      }
  
      const filePath = audioFile.path;
      const coverArtBuffer = fs.readFileSync(coverArtFile.path);
  
      const newTrack = await trackModel.create(
        parseInt(userId),
        title,
        genre,
        duration,
        filePath,
        coverArtBuffer
      );
  
      res.status(201).json({ message: 'Track uploaded successfully!', track: newTrack });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({ error: 'Upload failed.' });
    }
  });
  
  module.exports = router; 