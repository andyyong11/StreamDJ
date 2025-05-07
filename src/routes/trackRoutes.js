const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const { trackModel } = require('../db/models');

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


// 🔍 Unified real-time search (must be above /:id!)
router.get('/search-all', async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length < 1) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const [tracks, artists, playlists] = await Promise.all([
      trackModel.search(query),
      req.app.locals.db.any(
        `SELECT "UserID", "Username" FROM "User" WHERE "Username" ILIKE $1 LIMIT 10`,
        [`%${query}%`]
      ),
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

// Search tracks (basic)
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

// Create new track
router.post('/', async (req, res) => {
  try {
    const { userId, title, artist, genre, duration, filePath } = req.body;
    const newTrack = await trackModel.create(userId, title, artist, genre, duration, filePath, null);
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

// Upload track with audio + cover art + featured artists
router.post('/upload', upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'coverArt', maxCount: 1 }
]), async (req, res) => {
  const db = req.app.locals.db;
  const { title, artist, genre, duration, userId, featuredArtists } = req.body;
  const audioFile = req.files.audioFile?.[0];
  const coverArtFile = req.files.coverArt?.[0];

  if (!audioFile || !coverArtFile) {
    return res.status(400).json({ error: 'Audio and cover art files are required.' });
  }

  try {
    const filePath = audioFile.path;
    const coverArtBuffer = fs.readFileSync(coverArtFile.path);

    // Step 1: Insert the track
    const newTrack = await trackModel.create(
      parseInt(userId),
      title,
      artist,
      genre,
      duration,
      filePath,
      coverArtBuffer
    );

    const trackId = newTrack.TrackID;

    // Step 2: Add primary artist to TrackArtist
    await db.none(
      `INSERT INTO "TrackArtist" ("TrackID", "UserID", "Role") VALUES ($1, $2, 'primary')`,
      [trackId, userId]
    );

    // Step 3: Add featured artists (from comma-separated usernames)
    if (featuredArtists && featuredArtists.trim().length > 0) {
      const usernames = featuredArtists.split(',').map(u => u.trim());
      
      for (const username of usernames) {
        const user = await db.oneOrNone(
          `SELECT "UserID" FROM "User" WHERE "Username" = $1`,
          [username]
        );

        if (user) {
          await db.none(
            `INSERT INTO "TrackArtist" ("TrackID", "UserID", "Role") VALUES ($1, $2, 'featured')`,
            [trackId, user.UserID]
          );
        } else {
          console.warn(`Username "${username}" not found. Skipping...`);
        }
      }
    }

    res.status(201).json({ message: 'Track uploaded successfully!', track: newTrack });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Upload failed.' });
  }
});


module.exports = router;