const db = require('../config');

const liveStreamModel = {
    // Get all active streams
    async getActive() {
        try {
            return await db.any(`
                SELECT ls.*, u."Username"
                FROM "LiveStream" ls
                JOIN "User" u ON ls."UserID" = u."UserID"
                WHERE ls."Status" = 'active'
                ORDER BY ls."StartedAt" DESC
            `);
        } catch (error) {
            throw new Error(`Error getting active streams: ${error.message}`);
        }
    },

    // Create a new stream
    async create(userId, title, description = '') {
        try {
            return await db.one(`
                INSERT INTO "LiveStream" (
                    "UserID", "Title", "Description", 
                    "Status", "StartedAt", "ViewerCount"
                )
                VALUES ($1, $2, $3, 'active', NOW(), 0)
                RETURNING *
            `, [userId, title, description]);
        } catch (error) {
            throw new Error(`Error creating stream: ${error.message}`);
        }
    },

    // End a stream
    async end(streamId, userId) {
        try {
            return await db.result(`
                UPDATE "LiveStream"
                SET "Status" = 'ended', "EndedAt" = NOW()
                WHERE "LiveStreamID" = $1 AND "UserID" = $2
                AND "Status" = 'active'
            `, [streamId, userId]);
        } catch (error) {
            throw new Error(`Error ending stream: ${error.message}`);
        }
    },

    // Get stream by ID
    async getById(streamId) {
        try {
            return await db.one(`
                SELECT ls.*, u."Username"
                FROM "LiveStream" ls
                JOIN "User" u ON ls."UserID" = u."UserID"
                WHERE ls."LiveStreamID" = $1
            `, [streamId]);
        } catch (error) {
            throw new Error(`Error getting stream: ${error.message}`);
        }
    },

    // Update viewer count
    async updateViewerCount(streamId, count) {
        try {
            return await db.result(`
                UPDATE "LiveStream"
                SET "ViewerCount" = $2
                WHERE "LiveStreamID" = $1 AND "Status" = 'active'
            `, [streamId, count]);
        } catch (error) {
            throw new Error(`Error updating viewer count: ${error.message}`);
        }
    }
};

module.exports = liveStreamModel; 