const db = require('../config');

const trackModel = {
  // Create a new track
  // Create a new track (no longer storing artist string in Track table)
  async create(userId, title, artist, genre, duration, filePath, coverArtPath) {
    try {
      return await db.one(
        `INSERT INTO "Track" 
        ("UserID", "Title", "Artist", "Genre", "Duration", "FilePath", "CoverArt", "CreatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [userId, title, artist, genre, duration, filePath, coverArtPath]
      );
    } catch (error) {
      throw new Error(`Error creating track: ${error.message}`);
    }
  },
  
  // Get track by ID
  async getById(id) {
    try {
      return await db.one('SELECT * FROM "Track" WHERE "TrackID" = $1', [id]);
    } catch (error) {
      throw new Error(`Error getting track: ${error.message}`);
    }
  },

  // Update track
  async update(id, updates) {
    try {
      // Map lowercase keys to capitalized database column names
      const columnMap = {
        'title': 'Title',
        'artist': 'Artist',
        'genre': 'Genre',
        'coverArt': 'CoverArt'
      };
      
      // Create a properly capitalized update object
      const capitalizedUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        // If key is in our map, use the capitalized version, otherwise keep as is
        const dbColumnName = columnMap[key] || key;
        capitalizedUpdates[dbColumnName] = value;
      }
      
      const setClause = Object.keys(capitalizedUpdates)
        .map((key, index) => `"${key}" = $${index + 2}`)
        .join(', ');
      const values = Object.values(capitalizedUpdates);

      return await db.one(
        `UPDATE "Track" SET ${setClause} WHERE "TrackID" = $1 RETURNING *`,
        [id, ...values]
      );
    } catch (error) {
      throw new Error(`Error updating track: ${error.message}`);
    }
  },

  // Delete track
  async delete(id) {
    try {
      // Ensure the ID is being used consistently with proper capitalization
      const trackId = parseInt(id, 10);
      if (isNaN(trackId)) {
        throw new Error('Invalid track ID format');
      }
      
      // Delete from all related tables to avoid foreign key constraint errors
      // First delete entries from ListenerHistory
      await db.none('DELETE FROM "ListenerHistory" WHERE "TrackID" = $1', [trackId]);
      
      // Delete from TrackLikes if it exists
      await db.none('DELETE FROM "TrackLikes" WHERE "TrackID" = $1', [trackId]);
      
      // Delete from PlaylistTrack join table
      await db.none('DELETE FROM "PlaylistTrack" WHERE "TrackID" = $1', [trackId]);
      
      // Delete from TrackArtist if it exists
      await db.none('DELETE FROM "TrackArtist" WHERE "TrackID" = $1', [trackId]);
      
      // Finally delete the track itself
      return await db.none('DELETE FROM "Track" WHERE "TrackID" = $1', [trackId]);
    } catch (error) {
      throw new Error(`Error deleting track: ${error.message}`);
    }
  },

  // Search tracks
  async search(query, limit = 10, offset = 0) {
    try {
      return await db.any(`
        SELECT * FROM "Track" 
        WHERE "Title" ILIKE $1 OR "Artist" ILIKE $1 
        ORDER BY "CreatedAt" DESC 
        LIMIT $2 OFFSET $3
      `, [`%${query}%`, limit, offset]);
    } catch (error) {
      throw new Error(`Error searching tracks: ${error.message}`);
    }
  },

  // List all tracks
  async list(limit = 10, offset = 0) {
    try {
      return await db.any('SELECT * FROM "Track" ORDER BY "CreatedAt" DESC LIMIT $1 OFFSET $2', 
        [limit, offset]
      );
    } catch (error) {
      throw new Error(`Error listing tracks: ${error.message}`);
    }
  },

  // Get tracks by artist
  async getByArtist(artist, limit = 10, offset = 0) {
    try {
      return await db.any(
        'SELECT * FROM "Track" WHERE "Artist" ILIKE $1 ORDER BY "CreatedAt" DESC LIMIT $2 OFFSET $3',
        [`%${artist}%`, limit, offset]
      );
    } catch (error) {
      throw new Error(`Error getting tracks by artist: ${error.message}`);
    }
  },

  // Get track usage (in how many playlists it appears)
  async getTrackUsage(id) {
    try {
      return await db.one(`
        SELECT COUNT(DISTINCT "PlaylistID") as playlist_count 
        FROM "PlaylistTrack" 
        WHERE "TrackID" = $1
      `, [id]);
    } catch (error) {
      throw new Error(`Error getting track usage: ${error.message}`);
    }
  }
};

module.exports = trackModel;