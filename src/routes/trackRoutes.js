const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const { trackModel } = require('../db/models');
const authenticateToken = require('../middleware/authenticateToken');

// Simple test endpoint
router.get('/test', (req, res) => {
  console.log("Test endpoint hit!");
  res.json({ message: "Track routes test endpoint working!" });
});

// Test endpoint for user tracks specifically
router.get('/by-user-test/:id', (req, res) => {
  console.log("User tracks test endpoint hit for user:", req.params.id);
  res.json({ message: "User tracks test endpoint working!", userId: req.params.id });
});

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

// IMPORTANT: Order routes from most specific to least specific
// Static-path endpoints first

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

// Get tracks by a specific user ID with a unique path
router.get('/by-user/:id', async (req, res) => {
  console.log("by-user/:id route hit with ID:", req.params.id);
  try {
    const userId = req.params.id;
    const { limit = 50, offset = 0 } = req.query;
    
    // Query tracks by the specified user ID
    const result = await req.app.locals.db.any(
      `SELECT t.* 
       FROM "Track" t
       WHERE t."UserID" = $1
       ORDER BY t."CreatedAt" DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching user tracks:', error);
    res.status(500).json({ error: 'Failed to fetch user tracks' });
  }
});

// Get tracks belonging to the authenticated user
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    // Query tracks by the authenticated user
    const result = await req.app.locals.db.any(
      `SELECT t.* 
       FROM "Track" t
       WHERE t."UserID" = $1
       ORDER BY t."CreatedAt" DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching user tracks:', error);
    res.status(500).json({ error: 'Failed to fetch user tracks' });
  }
});

// IMPORTANT: Generic parameter routes last
// Get track by ID
router.get('/:id', async (req, res, next) => {
  // Make sure ID doesn't match any of our specific endpoints before treating as a track ID
  if (req.params.id === 'search' || 
      req.params.id === 'search-all' || 
      req.params.id === 'test' || 
      req.params.id === 'by-user' || 
      req.params.id === 'by-user-test' || 
      req.params.id === 'artist' || 
      req.params.id === 'user') {
    return next();
  }
  
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
router.put('/:id', upload.fields([
  { name: 'coverArt', maxCount: 1 }
]), async (req, res) => {
  try {
    const trackId = req.params.id;
    const updates = { ...req.body };
    
    // Handle file uploads
    const coverArtFile = req.files?.coverArt?.[0];
    if (coverArtFile) {
      // Normalize path with forward slashes
      const coverFilePath = coverArtFile.path.replace(/\\/g, '/').replace(/^\/+/, '');
      
      // Ensure path starts with uploads/ prefix
      const coverPath = coverFilePath.startsWith('uploads/') ? coverFilePath : `uploads/${coverFilePath}`;
      
      // Add to updates
      updates.CoverArt = coverPath;
    }
    
    const updatedTrack = await trackModel.update(trackId, updates);
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
  
  console.log('Received upload request with data:', {
    title, artist, genre, duration, userId,
    featuredArtistsType: typeof featuredArtists,
    featuredArtistsValue: featuredArtists
  });
  
  const audioFile = req.files.audioFile?.[0];
  const coverArtFile = req.files.coverArt?.[0];

  if (!audioFile || !coverArtFile) {
    return res.status(400).json({ error: 'Audio and cover art files are required.' });
  }

  try {
    // Normalize paths with forward slashes
    const audioFilePath = audioFile.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const coverFilePath = coverArtFile.path.replace(/\\/g, '/').replace(/^\/+/, '');
    
    // Ensure paths start with uploads/ prefix
    const audioPath = audioFilePath.startsWith('uploads/') ? audioFilePath : `uploads/${audioFilePath}`;
    const coverPath = coverFilePath.startsWith('uploads/') ? coverFilePath : `uploads/${coverFilePath}`;

    // Use provided duration or default to 0
    const trackDuration = duration ? parseInt(duration) : 0;
    console.log('Using track duration:', trackDuration);

    const newTrack = await trackModel.create(
      parseInt(userId),
      title,
      artist,
      genre,
      trackDuration,
      audioPath,
      coverPath
    );    
    
    const trackId = newTrack.TrackID;

    // Step 2: Add primary artist to TrackArtist
    await db.none(
      `INSERT INTO "TrackArtist" ("TrackID", "UserID", "Role") VALUES ($1, $2, 'primary')`,
      [trackId, userId]
    );

    // Step 3: Add featured artists (from comma-separated usernames)
    if (featuredArtists && featuredArtists.trim && featuredArtists.trim().length > 0) {
      const usernames = featuredArtists.split(',').map(u => u.trim());
      
      for (const username of usernames) {
        if (!username) continue;
        
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
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// TRACK PLAY LOGGING - add this before module.exports
// TRACK PLAY LOGGING
router.post('/:id/play', async (req, res) => {
  try {
    const { userId } = req.body;
    const trackId = parseInt(req.params.id);

    await req.app.locals.db.none(
      `INSERT INTO "ListenerHistory" ("TrackID", "UserID", "PlayedAt") VALUES ($1, $2, NOW())`,
      [trackId, userId || null]
    );

    res.sendStatus(204);
  } catch (error) {
    console.error('Error tracking play:', error);
    res.status(500).json({ error: 'Could not log play.' });
  }
});

// Like a track
router.post('/:id/like', async (req, res) => {
  const { userId } = req.body;
  const trackId = parseInt(req.params.id);

  try {
    await req.app.locals.db.none(
      `INSERT INTO "TrackLikes" ("UserID", "TrackID") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, trackId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error liking track:', err);
    res.status(500).json({ error: 'Failed to like track.' });
  }
});

// Get total likes for a track
router.get('/:id/likes', async (req, res) => {
  try {
    const result = await req.app.locals.db.one(
      `SELECT COUNT(*) FROM "TrackLikes" WHERE "TrackID" = $1`,
      [req.params.id]
    );
    res.json({ likes: parseInt(result.count) });
  } catch (err) {
    console.error('Error fetching likes:', err);
    res.status(500).json({ error: 'Failed to fetch likes.' });
  }
});

router.get('/:id/like-status', async (req, res) => {
  const { userId } = req.query;
  const { id: trackId } = req.params;

  try {
    const exists = await req.app.locals.db.oneOrNone(`
      SELECT 1 FROM "TrackLikes" WHERE "UserID" = $1 AND "TrackID" = $2
    `, [userId, trackId]);

    res.json({ liked: !!exists });
  } catch (err) {
    console.error('Error checking like status:', err);
    res.status(500).json({ error: 'Failed to fetch like status' });
  }
});

router.post('/:id/unlike', async (req, res) => {
  const { userId } = req.body;
  const { id: trackId } = req.params;

  try {
    await req.app.locals.db.none(`
      DELETE FROM "TrackLikes" WHERE "UserID" = $1 AND "TrackID" = $2
    `, [userId, trackId]);

    res.sendStatus(200);
  } catch (err) {
    console.error('Error unliking track:', err);
    res.status(500).json({ error: 'Failed to unlike track' });
  }
});

// Get all liked tracks for a user
router.get('/liked/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const likedTracks = await req.app.locals.db.any(`
      SELECT t.*, u."Username" AS Artist 
      FROM "Track" t
      JOIN "TrackLikes" tl ON t."TrackID" = tl."TrackID"
      JOIN "User" u ON t."UserID" = u."UserID"
      WHERE tl."UserID" = $1
    `, [userId]);
    
    res.json(likedTracks);
  } catch (error) {
    console.error('Error fetching liked tracks:', error);
    res.status(500).json({ error: 'Failed to fetch liked tracks' });
  }
});

// Test route to list all tables in the database
router.get('/debug/tables', async (req, res) => {
  try {
    const tables = await req.app.locals.db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    res.json(tables);
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({ error: 'Failed to list tables' });
  }
});

// Test route to check columns in specific tables
router.get('/debug/columns/:table', async (req, res) => {
  try {
    const tableName = req.params.table;
    const columns = await req.app.locals.db.any(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    res.json(columns);
  } catch (error) {
    console.error('Error listing columns:', error);
    res.status(500).json({ error: 'Failed to list columns' });
  }
});

module.exports = router;