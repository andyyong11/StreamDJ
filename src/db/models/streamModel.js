const db = require('../config');

const streamModel = {
    // Get all active streams
    async getActive() {
        try {
            return await db.any(`
                SELECT s.*, u."Username"
                FROM "Stream" s
                JOIN "User" u ON s."UserID" = u."UserID"
                WHERE s."IsActive" = true
                ORDER BY s."StartedAt" DESC
            `);
        } catch (error) {
            throw new Error(`Error getting active streams: ${error.message}`);
        }
    },

    // Create a new stream
    async create(userId, title, description = '') {
        try {
            return await db.one(`
                INSERT INTO "Stream" ("UserID", "Title", "Description", "IsActive", "StartedAt")
                VALUES ($1, $2, $3, true, NOW())
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
                UPDATE "Stream"
                SET "IsActive" = false, "EndedAt" = NOW()
                WHERE "StreamID" = $1 AND "UserID" = $2
            `, [streamId, userId]);
        } catch (error) {
            throw new Error(`Error ending stream: ${error.message}`);
        }
    },

    // Get stream by ID
    async getById(streamId) {
        try {
            return await db.one(`
                SELECT s.*, u."Username"
                FROM "Stream" s
                JOIN "User" u ON s."UserID" = u."UserID"
                WHERE s."StreamID" = $1
            `, [streamId]);
        } catch (error) {
            throw new Error(`Error getting stream: ${error.message}`);
        }
    }
};

module.exports = streamModel; 