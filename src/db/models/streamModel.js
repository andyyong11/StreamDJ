const db = require('../config');

const streamModel = {
    // Get all active streams
    async getActive() {
        try {
            return await db.any(`
                SELECT s.*, u."Username"
                FROM "Stream" s
                JOIN "User" u ON s."UserID" = u."UserID"
                WHERE s."Status" = 'online'
                ORDER BY s."StartedAt" DESC
            `);
        } catch (error) {
            throw new Error(`Error getting active streams: ${error.message}`);
        }
    },

    // Create a new stream
    async create(userId, title, description = '') {
        try {
            // Generate a unique stream key
            const streamKey = Math.random().toString(36).substring(2, 15);
            
            return await db.one(`
                INSERT INTO "Stream" (
                    "UserID", "Title", "Description", 
                    "Status", "StartedAt", "StreamKey"
                )
                VALUES ($1, $2, $3, 'online', NOW(), $4)
                RETURNING *
            `, [userId, title, description, streamKey]);
        } catch (error) {
            throw new Error(`Error creating stream: ${error.message}`);
        }
    },

    // End a stream
    async end(streamId, userId) {
        try {
            return await db.result(`
                UPDATE "Stream"
                SET "Status" = 'offline', "EndedAt" = NOW()
                WHERE "StreamID" = $1 AND "UserID" = $2
                AND "Status" = 'online'
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
    },

    // Update viewer count
    async updateViewerCount(streamId, count) {
        try {
            return await db.result(`
                UPDATE "Stream"
                SET "ViewerCount" = $2
                WHERE "StreamID" = $1 AND "Status" = 'online'
            `, [streamId, count]);
        } catch (error) {
            throw new Error(`Error updating viewer count: ${error.message}`);
        }
    },

    // Add viewer to stream
    async addViewer(streamId, userId) {
        try {
            return await db.one(`
                INSERT INTO "StreamViewer" ("StreamID", "UserID")
                VALUES ($1, $2)
                ON CONFLICT ("StreamID", "UserID") 
                DO UPDATE SET "LeftAt" = NULL
                RETURNING *
            `, [streamId, userId]);
        } catch (error) {
            throw new Error(`Error adding viewer: ${error.message}`);
        }
    },

    // Remove viewer from stream
    async removeViewer(streamId, userId) {
        try {
            return await db.result(`
                UPDATE "StreamViewer"
                SET "LeftAt" = NOW()
                WHERE "StreamID" = $1 AND "UserID" = $2
                AND "LeftAt" IS NULL
            `, [streamId, userId]);
        } catch (error) {
            throw new Error(`Error removing viewer: ${error.message}`);
        }
    },

    // Add chat message
    async addChatMessage(streamId, userId, message) {
        try {
            return await db.one(`
                INSERT INTO "StreamChat" ("StreamID", "UserID", "Message")
                VALUES ($1, $2, $3)
                RETURNING *
            `, [streamId, userId, message]);
        } catch (error) {
            throw new Error(`Error adding chat message: ${error.message}`);
        }
    }
};

module.exports = streamModel; 