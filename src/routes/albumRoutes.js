const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const { albumModel, trackModel } = require('../db/models');
const authenticateToken = require('../middleware/authenticateToken');

// Multer setup for cover uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = 'uploads/album_covers';
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Get all albums with pagination
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const albums = await albumModel.getAll(parseInt(limit), parseInt(offset));
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific album by ID with its tracks
router.get('/:id', async (req, res) => {
  try {
    const album = await albumModel.getById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get albums by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const albums = await albumModel.getByUser(
      req.params.userId,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new album
router.post('/', authenticateToken, upload.single('coverArt'), async (req, res) => {
  try {
    const { title, releaseDate, description, genre } = req.body;
    const userId = req.user.id;
    
    // Handle the cover art file
    let coverArtPath = null;
    if (req.file) {
      // Normalize path with forward slashes and remove any leading slashes
      coverArtPath = req.file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    }
    
    const newAlbum = await albumModel.create(
      userId,
      title,
      coverArtPath,
      releaseDate || null,
      description || null,
      genre || null
    );
    
    res.status(201).json({
      success: true,
      data: newAlbum
    });
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload full album with tracks
router.post('/upload', authenticateToken, upload.fields([
  { name: 'coverArt', maxCount: 1 },
  { name: 'tracks', maxCount: 50 } // Allow multiple track uploads
]), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, releaseDate, description, genre, trackTitles, trackNumbers, trackDurations } = req.body;
    
    // Get the cover art file
    const coverArtFile = req.files.coverArt?.[0];
    if (!coverArtFile) {
      return res.status(400).json({ 
        success: false,
        error: 'Cover art is required' 
      });
    }
    
    // Get the track files
    const trackFiles = req.files.tracks;
    if (!trackFiles || trackFiles.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'At least one track is required' 
      });
    }
    
    // Parse track titles and numbers
    const titles = Array.isArray(trackTitles) ? trackTitles : [trackTitles];
    let numbers = [];
    let durations = [];
    
    if (trackNumbers) {
      numbers = Array.isArray(trackNumbers) 
        ? trackNumbers.map(n => parseInt(n)) 
        : [parseInt(trackNumbers)];
    } else {
      // If track numbers aren't provided, generate sequential numbers
      numbers = Array(trackFiles.length).fill().map((_, i) => i + 1);
    }
    
    if (trackDurations) {
      durations = Array.isArray(trackDurations)
        ? trackDurations.map(d => parseInt(d) || 0)
        : [parseInt(trackDurations) || 0];
    } else {
      // Default durations to 0 if not provided
      durations = Array(trackFiles.length).fill(0);
    }
    
    if (titles.length !== trackFiles.length) {
      return res.status(400).json({ 
        success: false,
        error: 'Number of track titles must match number of track files' 
      });
    }
    
    // Handle the cover art path
    const coverArtPath = coverArtFile.path.replace(/\\/g, '/').replace(/^\/+/, '');
    
    // Create the album
    const newAlbum = await albumModel.create(
      userId,
      title,
      coverArtPath,
      releaseDate || null,
      description || null,
      genre || null
    );
    
    const albumId = newAlbum.AlbumID;
    const trackData = [];
    
    // Process each track
    for (let i = 0; i < trackFiles.length; i++) {
      const trackFile = trackFiles[i];
      const trackTitle = titles[i];
      const trackNumber = numbers[i];
      const trackDuration = durations[i] || 0;
      
      // Get file path - normalize with forward slashes and ensure it starts with uploads/
      let filePath = trackFile.path.replace(/\\/g, '/').replace(/^\/+/, '');
      // Ensure path starts with uploads/ prefix
      if (!filePath.startsWith('uploads/')) {
        filePath = `uploads/${filePath}`;
      }
      
      // Create each track
      const newTrack = await trackModel.create(
        userId,
        trackTitle,
        "", // Artist (we'll use the user's name or handle this differently)
        genre || "", // Use album genre for tracks if available
        trackDuration,  // Use provided duration or default
        filePath,
        coverArtPath // Use album cover as track cover
      );
      
      // Add track to album
      await albumModel.addTrack(albumId, newTrack.TrackID, trackNumber);
      
      trackData.push({
        id: newTrack.TrackID,
        title: trackTitle,
        trackNumber
      });
    }
    
    // Return the album with the added tracks
    res.status(201).json({
      success: true,
      data: {
        album: newAlbum,
        tracks: trackData
      }
    });
  } catch (error) {
    console.error('Error uploading album:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add existing track to album
router.post('/:albumId/tracks', authenticateToken, async (req, res) => {
  try {
    const { albumId } = req.params;
    const { trackId, trackNumber } = req.body;
    const userId = req.user.id;
    
    // Verify album ownership
    const album = await albumModel.getById(albumId);
    if (!album) {
      return res.status(404).json({ 
        success: false,
        error: 'Album not found' 
      });
    }
    
    if (album.UserID !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'You do not have permission to modify this album' 
      });
    }
    
    // Add track to album
    const updatedTrack = await albumModel.addTrack(
      albumId, 
      trackId, 
      trackNumber || album.tracks.length + 1
    );
    
    res.json({
      success: true,
      data: updatedTrack
    });
  } catch (error) {
    console.error('Error adding track to album:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove track from album
router.delete('/:albumId/tracks/:trackId', authenticateToken, async (req, res) => {
  try {
    const { albumId, trackId } = req.params;
    const userId = req.user.id;
    
    // Verify album ownership
    const album = await albumModel.getById(albumId);
    if (!album) {
      return res.status(404).json({ 
        success: false,
        error: 'Album not found' 
      });
    }
    
    if (album.UserID !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to modify this album'
      });
    }
    
    // Remove track from album
    const updatedTrack = await albumModel.removeTrack(trackId);
    
    res.json({
      success: true,
      data: updatedTrack
    });
  } catch (error) {
    console.error('Error removing track from album:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update album details
router.put('/:id', authenticateToken, upload.single('coverArt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, releaseDate, description, genre } = req.body;
    const userId = req.user.id;
    
    // Verify album ownership
    const album = await albumModel.getById(id);
    if (!album) {
      return res.status(404).json({
        success: false,
        error: 'Album not found'
      });
    }
    
    if (album.UserID !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this album'
      });
    }
    
    // Prepare updates
    const updates = {};
    if (title) updates.Title = title;
    if (releaseDate) updates.ReleaseDate = releaseDate;
    if (description) updates.Description = description;
    if (genre) updates.Genre = genre;
    
    // Handle cover art update if provided
    if (req.file) {
      const coverArtPath = req.file.path.replace(/\\/g, '/').replace(/^\/+/, '');
      updates.CoverArtURL = coverArtPath;
    }
    
    // Update the album
    const updatedAlbum = await albumModel.update(id, updates);
    
    res.json({
      success: true,
      data: updatedAlbum
    });
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete an album
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify album ownership
    const album = await albumModel.getById(id);
    if (!album) {
      return res.status(404).json({
        success: false,
        error: 'Album not found'
      });
    }
    
    if (album.UserID !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this album'
      });
    }
    
    // Delete the album
    await albumModel.delete(id);
    
    res.json({
      success: true,
      message: 'Album deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search albums
router.get('/search/:query', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const albums = await albumModel.search(
      req.params.query,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route to find album-related tables
router.get('/debug/find-album-likes', async (req, res) => {
  try {
    const tables = await req.app.locals.db.any(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%album%'
      ORDER BY table_name;
    `);
    
    res.json(tables);
  } catch (error) {
    console.error('Error finding album tables:', error);
    res.status(500).json({ error: 'Failed to find album tables' });
  }
});

// Get liked albums for a user - MUST come before /:id route
router.get('/liked/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find albums that are NOT created by this user, as those would be more likely to be "liked"
    const query = `
      SELECT a.*, u."Username" AS Artist 
      FROM "Album" a
      JOIN "User" u ON a."UserID" = u."UserID"
      WHERE a."UserID" != $1
      LIMIT 10
    `;
    
    const otherAlbums = await req.app.locals.db.any(query, [userId]);
    
    // For now, return other users' albums as "liked albums" since we don't have actual likes
    res.json(otherAlbums);
  } catch (error) {
    console.error('Error fetching liked albums:', error);
    res.status(500).json({ error: 'Failed to fetch liked albums' });
  }
});

// Get popular albums - based on number of tracks and profile visits
router.get('/popular', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    // Get popular albums by combining various metrics
    // Updated query to use Track table instead of AlbumTrack
    const query = `
      SELECT a.*, u."Username" AS Artist, 
             (SELECT COUNT(*) FROM "Track" t WHERE t."AlbumID" = a."AlbumID") as "TrackCount"
      FROM "Album" a
      JOIN "User" u ON a."UserID" = u."UserID"
      ORDER BY 
        "TrackCount" DESC,
        a."CreatedAt" DESC
      LIMIT $1
    `;
    
    const popularAlbums = await req.app.locals.db.any(query, [limit]);
    
    res.json(popularAlbums);
  } catch (error) {
    console.error('Error fetching popular albums:', error);
    res.status(500).json({ error: 'Failed to fetch popular albums' });
  }
});

module.exports = router; 