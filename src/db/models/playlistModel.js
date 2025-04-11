const db = require('../config');

const playlistModel = {
    // Create a new playlist
    async create(userId, title, isPublic = true) {
        try {
            const now = new Date();
            return await db.one(
                'INSERT INTO "Playlist" ("UserID", "Title", "IsPublic", "CreatedAt") VALUES ($1, $2, $3, $4) RETURNING *',
                [userId, title, isPublic, now]
            );
        } catch (error) {
            throw new Error(`Error creating playlist: ${error.message}`);
        }
    },

    // Get playlist by ID
    async getById(id) {
        try {
            return await db.one(`
                SELECT p.*, u."Username", COUNT(pt."TrackID") as "Quantity"
                FROM "Playlist" p
                LEFT JOIN "User" u ON p."UserID" = u."UserID"
                LEFT JOIN "PlaylistTrack" pt ON p."PlaylistID" = pt."PlaylistID"
                WHERE p."PlaylistID" = $1
                GROUP BY p."PlaylistID", u."Username", u."UserID"
            `, [id]);
        } catch (error) {
            throw new Error(`Error getting playlist: ${error.message}`);
        }
    },

    // Get playlists by user ID
    async getByUserId(userId) {
        try {
            return await db.any(`
                SELECT p.*, u."Username", COUNT(pt."TrackID") as "Quantity"
                FROM "Playlist" p
                LEFT JOIN "User" u ON p."UserID" = u."UserID"
                LEFT JOIN "PlaylistTrack" pt ON p."PlaylistID" = pt."PlaylistID"
                WHERE p."UserID" = $1
                GROUP BY p."PlaylistID", u."Username", u."UserID"
                ORDER BY p."CreatedAt" DESC
            `, [userId]);
        } catch (error) {
            throw new Error(`Error getting user playlists: ${error.message}`);
        }
    },

    // Get all public playlists
    async getPublic(limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT p.*, u."Username", COUNT(pt."TrackID") as "Quantity"
                FROM "Playlist" p
                LEFT JOIN "User" u ON p."UserID" = u."UserID"
                LEFT JOIN "PlaylistTrack" pt ON p."PlaylistID" = pt."PlaylistID"
                WHERE p."IsPublic" = true
                GROUP BY p."PlaylistID", u."Username", u."UserID"
                ORDER BY p."CreatedAt" DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
        } catch (error) {
            throw new Error(`Error getting public playlists: ${error.message}`);
        }
    },

    // Add track to playlist
    async addTrack(playlistId, trackId, addedAt = new Date()) {
        try {
            return await db.one(
                'INSERT INTO "PlaylistTrack" ("PlaylistID", "TrackID", "AddedAt") VALUES ($1, $2, $3) RETURNING *',
                [playlistId, trackId, addedAt]
            );
        } catch (error) {
            throw new Error(`Error adding track to playlist: ${error.message}`);
        }
    },

    // Remove track from playlist
    async removeTrack(playlistId, trackId) {
        try {
            return await db.result(
                'DELETE FROM "PlaylistTrack" WHERE "PlaylistID" = $1 AND "TrackID" = $2',
                [playlistId, trackId]
            );
        } catch (error) {
            throw new Error(`Error removing track from playlist: ${error.message}`);
        }
    },

    // Delete playlist
    async delete(id) {
        try {
            return await db.result('DELETE FROM "Playlist" WHERE "PlaylistID" = $1', [id]);
        } catch (error) {
            throw new Error(`Error deleting playlist: ${error.message}`);
        }
    },

    // Get trending playlists
    async getTrending(limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT p.*, u."Username", 
                       COUNT(DISTINCT pt."TrackID") as "Quantity",
                       COUNT(DISTINCT pl."PlayID") as "TotalPlays"
                FROM "Playlist" p
                LEFT JOIN "User" u ON p."UserID" = u."UserID"
                LEFT JOIN "PlaylistTrack" pt ON p."PlaylistID" = pt."PlaylistID"
                LEFT JOIN "Track" t ON pt."TrackID" = t."TrackID"
                LEFT JOIN "Play" pl ON t."TrackID" = pl."TrackID"
                WHERE p."IsPublic" = true
                GROUP BY p."PlaylistID", u."Username", u."UserID"
                ORDER BY "TotalPlays" DESC, p."CreatedAt" DESC
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
        } catch (error) {
            throw new Error(`Error getting trending playlists: ${error.message}`);
        }
    }
};

module.exports = playlistModel; 