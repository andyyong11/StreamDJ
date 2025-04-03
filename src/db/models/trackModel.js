const db = require('../config');

const trackModel = {
    // Create a new track
    async create(title, artist, duration, url) {
        try {
            return await db.one(
                'INSERT INTO tracks (title, artist, duration, url) VALUES ($1, $2, $3, $4) RETURNING *',
                [title, artist, duration, url]
            );
        } catch (error) {
            throw new Error(`Error creating track: ${error.message}`);
        }
    },

    // Get track by ID
    async getById(id) {
        try {
            return await db.one('SELECT * FROM tracks WHERE id = $1', [id]);
        } catch (error) {
            throw new Error(`Error getting track: ${error.message}`);
        }
    },

    // Update track
    async update(id, updates) {
        try {
            const setClause = Object.keys(updates)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            const values = Object.values(updates);
            
            return await db.one(
                `UPDATE tracks SET ${setClause} WHERE id = $1 RETURNING *`,
                [id, ...values]
            );
        } catch (error) {
            throw new Error(`Error updating track: ${error.message}`);
        }
    },

    // Delete track
    async delete(id) {
        try {
            // First remove from all playlists
            await db.none('DELETE FROM playlist_tracks WHERE track_id = $1', [id]);
            // Then delete the track
            return await db.result('DELETE FROM tracks WHERE id = $1', [id]);
        } catch (error) {
            throw new Error(`Error deleting track: ${error.message}`);
        }
    },

    // Search tracks
    async search(query, limit = 10, offset = 0) {
        try {
            return await db.any(`
                SELECT * FROM tracks 
                WHERE title ILIKE $1 OR artist ILIKE $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            `, [`%${query}%`, limit, offset]);
        } catch (error) {
            throw new Error(`Error searching tracks: ${error.message}`);
        }
    },

    // List all tracks
    async list(limit = 10, offset = 0) {
        try {
            return await db.any('SELECT * FROM tracks ORDER BY created_at DESC LIMIT $1 OFFSET $2', 
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
                'SELECT * FROM tracks WHERE artist ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
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
                SELECT COUNT(DISTINCT playlist_id) as playlist_count 
                FROM playlist_tracks 
                WHERE track_id = $1
            `, [id]);
        } catch (error) {
            throw new Error(`Error getting track usage: ${error.message}`);
        }
    }
};

module.exports = trackModel; 