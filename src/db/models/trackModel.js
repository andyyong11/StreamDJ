const db = require('../config');

const trackModel = {
    // Create a new track
    async create(userId, title, genre, duration, filePath, coverArtBuffer) {
        try {
            const now = new Date();
            return await db.one(
                `INSERT INTO "Track" 
                 ("UserID", "Title", "Genre", "Duration", "FilePath", "CoverArt", "CreatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING *`,
                [userId, title, genre, duration, filePath, coverArtBuffer]
            );
        } catch (error) {
            throw new Error(`Error creating track: ${error.message}`);
        }
    },

    // Get track by ID
    async getById(id) {
        try {
            return await db.one(`
                SELECT t.*, u."Username" 
                FROM "Track" t
                LEFT JOIN "User" u ON t."UserID" = u."UserID"
                WHERE t."TrackID" = $1
            `, [id]);
        } catch (error) {
            throw new Error(`Error getting track: ${error.message}`);
        }
    },

    // Get tracks by user ID
    async getByUserId(userId) {
        try {
            return await db.any(`
                SELECT t.*, u."Username" 
                FROM "Track" t
                LEFT JOIN "User" u ON t."UserID" = u."UserID"
                WHERE t."UserID" = $1
                ORDER BY t."CreatedAt" DESC
            `, [userId]);
        } catch (error) {
            throw new Error(`Error getting user tracks: ${error.message}`);
        }
    },

    // Get liked tracks by user ID (using LikedHistory table)
    async getLikedByUserId(userId) {
        try {
            return await db.any(`
                SELECT t.*, u."Username" 
                FROM "Track" t
                LEFT JOIN "User" u ON t."UserID" = u."UserID"
                JOIN "LikedHistory" lh ON t."TrackID" = lh."TrackID"
                WHERE lh."UserID" = $1
                ORDER BY lh."PlayedAt" DESC
            `, [userId]);
        } catch (error) {
            throw new Error(`Error getting liked tracks: ${error.message}`);
        }
    },

    // Get recent tracks by user ID (using Play history)
    async getRecentByUserId(userId) {
        try {
            return await db.any(`
                SELECT t.*, u."Username", COUNT(p."PlayID") as "PlayCount"
                FROM "Track" t
                LEFT JOIN "User" u ON t."UserID" = u."UserID"
                JOIN "Play" p ON t."TrackID" = p."TrackID"
                WHERE p."UserID" = $1
                GROUP BY t."TrackID", u."UserID", u."Username"
                ORDER BY MAX(p."PlayedAt") DESC
                LIMIT 10
            `, [userId]);
        } catch (error) {
            throw new Error(`Error getting recent tracks: ${error.message}`);
        }
    },

    // Get all tracks
    async getAll(limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT t.*, u."Username" 
                FROM "Track" t
                LEFT JOIN "User" u ON t."UserID" = u."UserID"
                ORDER BY t."CreatedAt" DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
        } catch (error) {
            throw new Error(`Error getting tracks: ${error.message}`);
        }
    },

    // Record a liked track
    async like(userId, trackId) {
        try {
            const now = new Date();
            return await db.one(
                'INSERT INTO "LikedHistory" ("UserID", "TrackID", "PlayedAt") VALUES ($1, $2, $3) RETURNING *',
                [userId, trackId, now]
            );
        } catch (error) {
            throw new Error(`Error liking track: ${error.message}`);
        }
    },

    // Remove a liked track
    async unlike(userId, trackId) {
        try {
            return await db.result(
                'DELETE FROM "LikedHistory" WHERE "UserID" = $1 AND "TrackID" = $2',
                [userId, trackId]
            );
        } catch (error) {
            throw new Error(`Error unliking track: ${error.message}`);
        }
    },

    // Record a play
    async recordPlay(userId, trackId) {
        try {
            const now = new Date();
            return await db.one(
                'INSERT INTO "Play" ("UserID", "TrackID", "PlayedAt") VALUES ($1, $2, $3) RETURNING *',
                [userId, trackId, now]
            );
        } catch (error) {
            throw new Error(`Error recording play: ${error.message}`);
        }
    },

    // Delete track
    async delete(id) {
        try {
            return await db.result('DELETE FROM "Track" WHERE "TrackID" = $1', [id]);
        } catch (error) {
            throw new Error(`Error deleting track: ${error.message}`);
        }
    },

    // Search tracks (title, genre, artist username)
    async search(query, limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT t.*, u."Username" AS "ArtistName"
                FROM "Track" t
                JOIN "User" u ON t."UserID" = u."UserID"
                WHERE t."Title" ILIKE $1 
                OR t."Genre" ILIKE $1 
                OR u."Username" ILIKE $1
                ORDER BY t."CreatedAt" DESC 
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