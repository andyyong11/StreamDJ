const db = require('../config');

const playlistModel = {
    // Create a new playlist
    async create(name, userId, isPublic = true) {
        try {
            return await db.one(
                'INSERT INTO "Playlist" ("Title", "UserID", "IsPublic") VALUES ($1, $2, $3) RETURNING *',
                [name, userId, isPublic]
            );
        } catch (error) {
            throw new Error(`Error creating playlist: ${error.message}`);
        }
    },

    // Get playlist by ID with tracks
    async getById(id) {
        try {
            const playlist = await db.one('SELECT * FROM "Playlist" WHERE "PlaylistID" = $1', [id]);
            const tracks = await db.any(`
                SELECT t.*, pt."Position" 
                FROM "Track" t 
                JOIN "PlaylistTrack" pt ON t."TrackID" = pt."TrackID" 
                WHERE pt."PlaylistID" = $1 
                ORDER BY pt."Position"
            `, [id]);
            return { ...playlist, tracks };
        } catch (error) {
            throw new Error(`Error getting playlist: ${error.message}`);
        }
    },

    // Get user's playlists
    async getByUserId(userId) {
        try {
            return await db.any('SELECT * FROM "Playlist" WHERE "UserID" = $1', [userId]);
        } catch (error) {
            throw new Error(`Error getting user playlists: ${error.message}`);
        }
    },

    // Update playlist
    async update(id, updates) {
        try {
            const setClause = Object.keys(updates)
                .map((key, index) => `"${key}" = $${index + 2}`)
                .join(', ');
            const values = Object.values(updates);
            
            return await db.one(
                `UPDATE "Playlist" SET ${setClause} WHERE "PlaylistID" = $1 RETURNING *`,
                [id, ...values]
            );
        } catch (error) {
            throw new Error(`Error updating playlist: ${error.message}`);
        }
    },

    // Delete playlist
    async delete(id) {
        try {
            // First delete all playlist_tracks entries
            await db.none('DELETE FROM "PlaylistTrack" WHERE "PlaylistID" = $1', [id]);
            // Then delete the playlist
            return await db.result('DELETE FROM "Playlist" WHERE "PlaylistID" = $1', [id]);
        } catch (error) {
            throw new Error(`Error deleting playlist: ${error.message}`);
        }
    },

    // Add track to playlist
// Add track to playlist
// Add track to playlist (prevent duplicates)
async addTrack(playlistId, trackId, position = null) {
    try {
        // Check if track already exists in the playlist
        const exists = await db.oneOrNone(
            `SELECT 1 FROM "PlaylistTrack" WHERE "PlaylistID" = $1 AND "TrackID" = $2`,
            [playlistId, trackId]
        );

        if (exists) {
            throw new Error('Track already exists in the playlist');
        }

        // Auto-position if not provided
        if (position === null) {
            const result = await db.oneOrNone(
                `SELECT MAX("Position") + 1 AS pos FROM "PlaylistTrack" WHERE "PlaylistID" = $1`,
                [playlistId]
            );
            position = result?.pos || 1;
        }

        return await db.one(
            `INSERT INTO "PlaylistTrack" ("PlaylistID", "TrackID", "Position", "AddedAt")
             VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [playlistId, trackId, position]
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

    // List all public playlists
    async listPublic(limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT p.*, u."Username" as "Username", 
                       COUNT(pt."TrackID") as "Quantity" 
                FROM "Playlist" p 
                JOIN "User" u ON p."UserID" = u."UserID" 
                LEFT JOIN "PlaylistTrack" pt ON p."PlaylistID" = pt."PlaylistID" 
                WHERE p."IsPublic" = true 
                GROUP BY p."PlaylistID", u."Username" 
                ORDER BY p."CreatedAt" DESC 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
        } catch (error) {
            throw new Error(`Error listing public playlists: ${error.message}`);
        }
    }
};

module.exports = playlistModel; 