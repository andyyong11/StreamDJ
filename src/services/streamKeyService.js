const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class StreamKeyService {
  constructor(pool) {
    this.pool = pool;
  }

  async generateStreamKey(userId) {
    try {
      console.log('Generating stream key for user:', userId);
      
      // First clean up any expired streams
      await this.pool.query(
        `UPDATE public."LiveStream" 
         SET "Status" = 'ended' 
         WHERE "EndTime" < CURRENT_TIMESTAMP 
         AND "Status" IN ('active', 'scheduled')`
      );

      // Check for existing active or scheduled stream
      const existingStream = await this.pool.query(
        `SELECT * FROM public."LiveStream" 
         WHERE "UserID" = $1 
         AND "Status" IN ('active', 'scheduled')
         ORDER BY "StartTime" DESC
         LIMIT 1`,
        [userId]
      );

      // If there's an existing active or scheduled stream, return its key
      if (existingStream.rows.length > 0) {
        const stream = existingStream.rows[0];
        console.log('Found existing stream for user:', userId, stream.StreamKey);
        return { 
          streamKey: stream.StreamKey,
          status: stream.Status,
          startTime: stream.StartTime,
          endTime: stream.EndTime
        };
      }

      // Generate a new stream key if no active/scheduled stream exists
      const streamKey = crypto.randomBytes(16).toString('hex');
      const title = `Stream ${new Date().toLocaleString()}`;

      // Try to update an ended/inactive stream first
      const updateResult = await this.pool.query(
        `UPDATE public."LiveStream"
         SET "StreamKey" = $1,
             "Title" = $2,
             "StartTime" = CURRENT_TIMESTAMP,
             "EndTime" = CURRENT_TIMESTAMP + interval '24 hours',
             "Status" = 'scheduled'
         WHERE "UserID" = $3
         AND "Status" IN ('ended', 'inactive')
         ORDER BY "StartTime" DESC
         LIMIT 1
         RETURNING *`,
        [streamKey, title, userId]
      );

      // If we found and updated an existing stream, return the new key
      if (updateResult.rows.length > 0) {
        const stream = updateResult.rows[0];
        console.log('Updated existing stream with new key for user:', userId, streamKey);
        return { 
          streamKey: stream.StreamKey,
          status: stream.Status,
          startTime: stream.StartTime,
          endTime: stream.EndTime
        };
      }

      // If no existing stream was found, create a new one
      const insertResult = await this.pool.query(
        `INSERT INTO public."LiveStream" (
          "UserID", 
          "Title", 
          "StartTime", 
          "EndTime", 
          "StreamURL", 
          "ListenerCount", 
          "Status", 
          "StreamKey"
        ) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '24 hours', $3, $4, $5, $6) 
        RETURNING *`,
        [
          userId,
          title,
          'rtmp://localhost:1935/live',
          0,
          'scheduled',
          streamKey
        ]
      );

      const newStream = insertResult.rows[0];
      console.log('Created new stream with key for user:', userId, streamKey);
      return { 
        streamKey: newStream.StreamKey,
        status: newStream.Status,
        startTime: newStream.StartTime,
        endTime: newStream.EndTime
      };
    } catch (error) {
      console.error('Error generating stream key:', error);
      throw error;
    }
  }

  async validateStreamKey(streamKey) {
    try {
      console.log('Validating stream key:', streamKey);
      const result = await this.pool.query(
        `SELECT * FROM public."LiveStream" 
         WHERE "StreamKey" = $1 
         AND "Status" IN ('active', 'scheduled')
         AND CURRENT_TIMESTAMP < "EndTime"`,
        [streamKey]
      );
      console.log('Stream validation result:', result.rows[0]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error validating stream key:', error);
      throw error;
    }
  }

  async activateStream(streamKey) {
    try {
      console.log('Attempting to activate stream with key:', streamKey);
      
      // First, check if the stream exists and get its current status
      const checkResult = await this.pool.query(
        `SELECT * FROM public."LiveStream" 
         WHERE "StreamKey" = $1`,
        [streamKey]
      );
      
      if (!checkResult.rows.length) {
        console.log('Stream not found for key:', streamKey);
        return null;
      }

      const stream = checkResult.rows[0];
      console.log('Found stream:', stream);

      // Only activate if the stream is in a valid state
      if (stream.Status !== 'scheduled' && stream.Status !== 'inactive') {
        console.log('Stream is already active or ended:', stream.Status);
        return stream;
      }

      // Update the stream status to active
      const result = await this.pool.query(
        `UPDATE public."LiveStream" 
         SET "Status" = 'active',
             "StartTime" = CURRENT_TIMESTAMP,
             "ListenerCount" = 0
         WHERE "StreamKey" = $1 
         AND "Status" IN ('scheduled', 'inactive')
         RETURNING *`,
        [streamKey]
      );

      if (result.rows.length > 0) {
        console.log('Successfully activated stream:', result.rows[0]);
        return result.rows[0];
      } else {
        console.log('Failed to activate stream - no rows updated');
        return null;
      }
    } catch (error) {
      console.error('Error activating stream:', error);
      throw error;
    }
  }

  async deactivateStreamKey(streamKey) {
    try {
      console.log('Deactivating stream:', streamKey);
      const result = await this.pool.query(
        `UPDATE public."LiveStream" 
         SET "Status" = 'ended', 
             "EndTime" = CURRENT_TIMESTAMP 
         WHERE "StreamKey" = $1 
         AND "Status" = 'active'
         RETURNING *`,
        [streamKey]
      );
      
      if (result.rows.length > 0) {
        console.log('Successfully deactivated stream:', result.rows[0]);
        return result.rows[0];
      } else {
        console.log('No active stream found to deactivate');
        return null;
      }
    } catch (error) {
      console.error('Error deactivating stream key:', error);
      throw error;
    }
  }

  // Add a cleanup method to fix incorrect UserIDs
  async cleanupIncorrectUserIds() {
    try {
      await this.pool.query(
        `UPDATE public."LiveStream"
         SET "Status" = 'ended'
         WHERE "UserID" != 6
         AND "Status" IN ('active', 'scheduled')`
      );
      console.log('Cleaned up streams with incorrect UserIDs');
    } catch (error) {
      console.error('Error cleaning up streams:', error);
      throw error;
    }
  }
}

module.exports = StreamKeyService; 