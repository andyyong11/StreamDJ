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
      const setClause = Object.keys(updates)
        .map((key, index) => `"${key}" = $${index + 2}`)
        .join(', ');
      const values = Object.values(updates);

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
      await db.none('DELETE FROM "PlaylistTrack" WHERE "TrackID" = $1', [id]);
      return await db.result('DELETE FROM "Track" WHERE "TrackID" = $1', [id]);
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