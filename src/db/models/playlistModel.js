const db = require('../config');

const playlistModel = {
    // Create a new playlist
    async create(name, userId, isPublic = true) {
        try {
            return await db.one(
                'INSERT INTO playlists (name, user_id, is_public) VALUES ($1, $2, $3) RETURNING *',
                [name, userId, isPublic]
            );
        } catch (error) {
            throw new Error(`Error creating playlist: ${error.message}`);
        }
    },

    // Get playlist by ID with tracks
    async getById(id) {
        try {
            const playlist = await db.one('SELECT * FROM playlists WHERE id = $1', [id]);
            const tracks = await db.any(`
                SELECT t.*, pt.position 
                FROM tracks t 
                JOIN playlist_tracks pt ON t.id = pt.track_id 
                WHERE pt.playlist_id = $1 
                ORDER BY pt.position
            `, [id]);
            return { ...playlist, tracks };
        } catch (error) {
            throw new Error(`Error getting playlist: ${error.message}`);
        }
    },

    // Get user's playlists
    async getByUserId(userId) {
        try {
            return await db.any('SELECT * FROM playlists WHERE user_id = $1', [userId]);
        } catch (error) {
            throw new Error(`Error getting user playlists: ${error.message}`);
        }
    },

    // Update playlist
    async update(id, updates) {
        try {
            const setClause = Object.keys(updates)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            const values = Object.values(updates);
            
            return await db.one(
                `UPDATE playlists SET ${setClause} WHERE id = $1 RETURNING *`,
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
            await db.none('DELETE FROM playlist_tracks WHERE playlist_id = $1', [id]);
            // Then delete the playlist
            return await db.result('DELETE FROM playlists WHERE id = $1', [id]);
        } catch (error) {
            throw new Error(`Error deleting playlist: ${error.message}`);
        }
    },

    // Add track to playlist
    async addTrack(playlistId, trackId, position) {
        try {
            return await db.one(
                'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3) RETURNING *',
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
                'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
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
                SELECT p.*, u.username as owner_name, 
                       COUNT(pt.track_id) as track_count 
                FROM playlists p 
                JOIN users u ON p.user_id = u.id 
                LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id 
                WHERE p.is_public = true 
                GROUP BY p.id, u.username 
                ORDER BY p.created_at DESC 
                LIMIT $1 OFFSET $2
            `, [limit, offset]);
        } catch (error) {
            throw new Error(`Error listing public playlists: ${error.message}`);
        }
    }
};

module.exports = playlistModel; 