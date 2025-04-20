const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class StreamKeyService {
  constructor(db) {
    this.db = db;
  }

  async generateStreamKey(userId, customTitle = null) {
    try {
      console.log('Generating stream key for user:', userId, 'Type:', typeof userId);
      
      // Ensure userId is an integer
      const userIdInt = parseInt(userId, 10);
      
      if (isNaN(userIdInt)) {
        console.error('Invalid user ID:', userId);
        throw new Error('Invalid user ID');
      }
      
      // First clean up any expired streams
      await this.db.none(
        `UPDATE public."LiveStream" 
         SET "Status" = 'ended' 
         WHERE "EndTime" < CURRENT_TIMESTAMP 
         AND "Status" IN ('active', 'scheduled')`
      );

      // Check for existing active or scheduled stream
      const existingStream = await this.db.oneOrNone(
        `SELECT * FROM public."LiveStream" 
         WHERE "UserID" = $1 
         AND "Status" IN ('active', 'scheduled')
         ORDER BY "StartTime" DESC
         LIMIT 1`,
        [userIdInt]
      );

      // If there's an existing active or scheduled stream, return its key
      if (existingStream) {
        console.log('Found existing stream for user:', userIdInt, existingStream.StreamKey);
        return { 
          streamKey: existingStream.StreamKey,
          status: existingStream.Status,
          startTime: existingStream.StartTime,
          endTime: existingStream.EndTime,
          title: existingStream.Title
        };
      }

      // Generate a new stream key if no active/scheduled stream exists
      const streamKey = crypto.randomBytes(16).toString('hex');
      const title = customTitle || `Stream ${new Date().toLocaleString()}`;
      
      // First check if the user exists
      const userExists = await this.db.oneOrNone(
        `SELECT * FROM public."User" WHERE "UserID" = $1`,
        [userIdInt]
      );
      
      if (!userExists) {
        console.error(`User with ID ${userIdInt} not found in database`);
        throw new Error('User not found');
      }

      // Try to update an ended/inactive stream first
      const updatedStream = await this.db.oneOrNone(
        `UPDATE public."LiveStream"
         SET "StreamKey" = $1,
             "Title" = $2,
             "StartTime" = CURRENT_TIMESTAMP,
             "EndTime" = CURRENT_TIMESTAMP + interval '24 hours',
             "Status" = 'scheduled'
         WHERE "LiveStreamID" IN (
           SELECT "LiveStreamID" FROM public."LiveStream"
           WHERE "UserID" = $3
           AND "Status" IN ('ended', 'inactive')
           ORDER BY "StartTime" DESC
           LIMIT 1
         )
         RETURNING *`,
        [streamKey, title, userIdInt]
      );

      // If we found and updated an existing stream, return the new key
      if (updatedStream) {
        console.log('Updated existing stream with new key for user:', userIdInt, streamKey);
        return { 
          streamKey: updatedStream.StreamKey,
          status: updatedStream.Status,
          startTime: updatedStream.StartTime,
          endTime: updatedStream.EndTime,
          title: updatedStream.Title
        };
      }

      // If no existing stream was found, create a new one
      console.log('Creating new stream for user:', userIdInt);
      const newStream = await this.db.one(
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
          userIdInt,
          title,
          'rtmp://localhost:1935/live',
          0,
          'scheduled',
          streamKey
        ]
      );

      console.log('Created new stream with key for user:', userIdInt, streamKey);
      return { 
        streamKey: newStream.StreamKey,
        status: newStream.Status,
        startTime: newStream.StartTime,
        endTime: newStream.EndTime,
        title: newStream.Title
      };
    } catch (error) {
      console.error('Error generating stream key:', error);
      throw error;
    }
  }

  async validateStreamKey(streamKey) {
    try {
      console.log('Validating stream key:', streamKey);
      const stream = await this.db.oneOrNone(
        `SELECT * FROM public."LiveStream" 
         WHERE "StreamKey" = $1 
         AND "Status" IN ('active', 'scheduled')
         AND CURRENT_TIMESTAMP < "EndTime"`,
        [streamKey]
      );
      console.log('Stream validation result:', stream);
      return !!stream;
    } catch (error) {
      console.error('Error validating stream key:', error);
      throw error;
    }
  }

  async activateStream(streamKey) {
    try {
      console.log('Attempting to activate stream with key:', streamKey);
      
      // First, check if the stream exists and get its current status
      const stream = await this.db.oneOrNone(
        `SELECT * FROM public."LiveStream" 
         WHERE "StreamKey" = $1`,
        [streamKey]
      );
      
      if (!stream) {
        console.log('Stream not found for key:', streamKey);
        return null;
      }

      console.log('Found stream:', stream);

      // Only activate if the stream is not already active
      if (stream.Status === 'active') {
        console.log('Stream is already active:', stream.Status);
        return stream;
      }

      // Update the stream status to active
      const updatedStream = await this.db.oneOrNone(
        `UPDATE public."LiveStream" 
         SET "Status" = 'active',
             "StartTime" = CURRENT_TIMESTAMP,
             "ListenerCount" = 0
         WHERE "StreamKey" = $1 
         AND "Status" IN ('scheduled', 'inactive', 'ended')
         RETURNING *`,
        [streamKey]
      );

      if (updatedStream) {
        console.log('Successfully activated stream:', updatedStream);
        return updatedStream;
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
      const deactivatedStream = await this.db.oneOrNone(
        `UPDATE public."LiveStream" 
         SET "Status" = 'ended', 
             "EndTime" = CURRENT_TIMESTAMP 
         WHERE "StreamKey" = $1 
         AND "Status" = 'active'
         RETURNING *`,
        [streamKey]
      );
      
      if (deactivatedStream) {
        console.log('Successfully deactivated stream:', deactivatedStream);
        return deactivatedStream;
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
      await this.db.none(
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