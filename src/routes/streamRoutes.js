const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

module.exports = (pool, streamKeyService) => {
  // Get active streams
  router.get('/active', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM public."LiveStream" 
         WHERE "Status" = $1 
         ORDER BY "StartTime" DESC`,
        ['active']
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching active streams:', error);
      res.status(500).json({ error: 'Failed to fetch active streams' });
    }
  });

  // Get a single stream by ID
  router.get('/:streamId', async (req, res) => {
    try {
      const { streamId } = req.params;
      const result = await pool.query(
        `SELECT * FROM public."LiveStream" 
         WHERE "LiveStreamID" = $1`,
        [streamId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Stream not found' 
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching stream:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch stream' 
      });
    }
  });

  // Generate a new stream key
  router.post('/key', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { title } = req.body;
      const result = await streamKeyService.generateStreamKey(userId, title);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error generating stream key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate stream key'
      });
    }
  });

  // Validate a stream key
  router.get('/validate/:streamKey', async (req, res) => {
    try {
      const { streamKey } = req.params;
      const isValid = await streamKeyService.validateStreamKey(streamKey);
      
      res.json({
        success: true,
        isValid
      });
    } catch (error) {
      console.error('Error validating stream key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate stream key'
      });
    }
  });

  // Activate a stream
  router.post('/activate/:streamKey', async (req, res) => {
    try {
      const { streamKey } = req.params;
      const stream = await streamKeyService.activateStream(streamKey);
      
      res.json({
        success: true,
        data: stream
      });
    } catch (error) {
      console.error('Error activating stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate stream'
      });
    }
  });

  // End a stream
  router.post('/end/:streamKey', async (req, res) => {
    try {
      const { streamKey } = req.params;
      const stream = await streamKeyService.deactivateStreamKey(streamKey);
      
      res.json({
        success: true,
        data: stream
      });
    } catch (error) {
      console.error('Error ending stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end stream'
      });
    }
  });

  // Update stream details
  router.put('/:streamId', authenticateToken, async (req, res) => {
    try {
      const { streamId } = req.params;
      const { title } = req.body;
      const userId = req.user.id;

      // Verify the user owns this stream
      const streamCheck = await pool.query(
        `SELECT "UserID" FROM public."LiveStream" WHERE "LiveStreamID" = $1`,
        [streamId]
      );
      
      if (streamCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }
      
      if (streamCheck.rows[0].UserID !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this stream'
        });
      }

      // Update the stream (only title since Description doesn't exist)
      const result = await pool.query(
        `UPDATE public."LiveStream" 
         SET "Title" = $1
         WHERE "LiveStreamID" = $2 
         RETURNING *`,
        [title, streamId]
      );

      // Get the updated stream data
      const updatedStream = result.rows[0];
      
      // Emit socket event for real-time updates
      if (req.app.get('io')) {
        req.app.get('io').emit('stream_updated', updatedStream);
      }

      res.json({
        success: true,
        data: updatedStream
      });
    } catch (error) {
      console.error('Error updating stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update stream'
      });
    }
  });

  // End a stream by ID (for stream owner)
  router.post('/:streamId/end', authenticateToken, async (req, res) => {
    try {
      const { streamId } = req.params;
      const userId = req.user.id;

      // Verify the user owns this stream
      const streamCheck = await pool.query(
        `SELECT "UserID", "StreamKey" FROM public."LiveStream" 
         WHERE "LiveStreamID" = $1`,
        [streamId]
      );
      
      if (streamCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }
      
      if (streamCheck.rows[0].UserID !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to end this stream'
        });
      }

      // End the stream
      const streamKey = streamCheck.rows[0].StreamKey;
      const stream = await streamKeyService.deactivateStreamKey(streamKey);
      
      res.json({
        success: true,
        data: stream
      });
    } catch (error) {
      console.error('Error ending stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end stream'
      });
    }
  });

  return router;
}; 