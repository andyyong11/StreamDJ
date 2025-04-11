const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const { trackModel } = require('../db/models');

// ===========================
// Multer Setup for File Uploads
// ===========================
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

// ===========================
// GET: All Tracks
// ===========================
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const tracks = await trackModel.list(parseInt(limit), parseInt(offset));
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// GET: Search Only Tracks
// ===========================
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10, offset = 0 } = req.query;
    const tracks = await trackModel.search(query, parseInt(limit), parseInt(offset));
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// GET: Unified Real-Time Search
// ===========================
router.get('/search-all', async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length < 1) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const [tracks, artists, playlists] = await Promise.all([
      // Search tracks by title or genre or artist name
      trackModel.search(query),

      // Search artists (Users)
      req.app.locals.db.any(
        `SELECT "UserID", "Username" FROM "User" WHERE "Username" ILIKE $1 LIMIT 10`,
        [`%${query}%`]
      ),

      // Search playlists
      req.app.locals.db.any(
        `SELECT "PlaylistID", "Title", "UserID" FROM "Playlist" WHERE "Title" ILIKE $1 LIMIT 10`,
        [`%${query}%`]
      )
    ]);

    res.json({ tracks, artists, playlists });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ===========================
// GET: Tracks by Artist
// ===========================
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

// ===========================
// GET: Track by ID
// ===========================
router.get('/:id', async (req, res) => {
  try {
    const track = await trackModel.getById(req.params.id);
    res.json(track);
  } catch (error) {
    res.status(404).json({ error: 'Track not found' });
  }
});

// ===========================
// GET: Track Usage Stats
// ===========================
router.get('/:id/usage', async (req, res) => {
  try {
    const usage = await trackModel.getTrackUsage(req.params.id);
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================
// POST: Create a Basic Track (Optional Fallback)
// ===========================
router.post('/', async (req, res) => {
  try {
    const { title, artist, duration, url } = req.body;
    const newTrack = await trackModel.create(title, artist, duration, url);
    res.status(201).json(newTrack);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// PUT: Update a Track
// ===========================
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const updatedTrack = await trackModel.update(req.params.id, updates);
    res.json(updatedTrack);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// DELETE: Remove a Track
// ===========================
router.delete('/:id', async (req, res) => {
  try {
    await trackModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===========================
// POST: Upload Track w/ Audio + Cover Art
// ===========================
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