const db = require('../config');

const albumModel = {
  // Create a new album
  async create(userId, title, coverArtPath, releaseDate, description, genre) {
    try {
      return await db.one(
        `INSERT INTO "Album" 
        ("UserID", "Title", "CoverArtURL", "ReleaseDate", "Description", "Genre", "CreatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [userId, title, coverArtPath, releaseDate, description, genre]
      );
    } catch (error) {
      throw new Error(`Error creating album: ${error.message}`);
    }
  },

  // Get all albums with pagination
  async getAll(limit = 10, offset = 0) {
    try {
      return await db.any(
        `SELECT * FROM "Album" 
         ORDER BY "CreatedAt" DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } catch (error) {
      throw new Error(`Error getting albums: ${error.message}`);
    }
  },

  // Get an album by ID
  async getById(albumId) {
    try {
      const album = await db.oneOrNone(
        `SELECT * FROM "Album" WHERE "AlbumID" = $1`,
        [albumId]
      );
      
      if (!album) {
        return null;
      }
      
      // Get all tracks in this album
      const tracks = await db.any(
        `SELECT * FROM "Track" 
         WHERE "AlbumID" = $1 
         ORDER BY "TrackNumber" ASC`,
        [albumId]
      );
      
      return {
        ...album,
        tracks
      };
    } catch (error) {
      throw new Error(`Error getting album: ${error.message}`);
    }
  },

  // Get albums by a specific user
  async getByUser(userId, limit = 10, offset = 0) {
    try {
      return await db.any(
        `SELECT a.*, COUNT(t."TrackID")::INTEGER AS "TrackCount" 
         FROM "Album" a
         LEFT JOIN "Track" t ON a."AlbumID" = t."AlbumID"
         WHERE a."UserID" = $1 
         GROUP BY a."AlbumID"
         ORDER BY a."CreatedAt" DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
    } catch (error) {
      throw new Error(`Error getting albums by user: ${error.message}`);
    }
  },

  // Update an album
  async update(albumId, updates) {
    try {
      const updateFields = [];
      const values = [];
      let counter = 1;
      
      // Build dynamic update query
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'AlbumID') { // Don't update the primary key
          updateFields.push(`"${key}" = $${counter}`);
          values.push(value);
          counter++;
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(albumId);
      
      return await db.one(
        `UPDATE "Album" 
         SET ${updateFields.join(', ')} 
         WHERE "AlbumID" = $${counter} 
         RETURNING *`,
        values
      );
    } catch (error) {
      throw new Error(`Error updating album: ${error.message}`);
    }
  },

  // Delete an album
  async delete(albumId) {
    try {
      // First, delete or update all tracks associated with this album
      await db.none(
        `UPDATE "Track" SET "AlbumID" = NULL, "TrackNumber" = NULL WHERE "AlbumID" = $1`,
        [albumId]
      );
      
      // Then delete the album
      return await db.none(
        `DELETE FROM "Album" WHERE "AlbumID" = $1`,
        [albumId]
      );
    } catch (error) {
      throw new Error(`Error deleting album: ${error.message}`);
    }
  },

  // Add a track to an album
  async addTrack(albumId, trackId, trackNumber) {
    try {
      return await db.one(
        `UPDATE "Track" 
         SET "AlbumID" = $1, "TrackNumber" = $2 
         WHERE "TrackID" = $3 
         RETURNING *`,
        [albumId, trackNumber, trackId]
      );
    } catch (error) {
      throw new Error(`Error adding track to album: ${error.message}`);
    }
  },

  // Remove a track from an album
  async removeTrack(trackId) {
    try {
      return await db.one(
        `UPDATE "Track" 
         SET "AlbumID" = NULL, "TrackNumber" = NULL 
         WHERE "TrackID" = $1 
         RETURNING *`,
        [trackId]
      );
    } catch (error) {
      throw new Error(`Error removing track from album: ${error.message}`);
    }
  },

  // Search albums
  async search(query, limit = 10, offset = 0) {
    try {
      return await db.any(`
        SELECT * FROM "Album" 
        WHERE "Title" ILIKE $1 OR "Description" ILIKE $1 
        ORDER BY "CreatedAt" DESC 
        LIMIT $2 OFFSET $3
      `, [`%${query}%`, limit, offset]);
    } catch (error) {
      throw new Error(`Error searching albums: ${error.message}`);
    }
  }
};

module.exports = albumModel; 