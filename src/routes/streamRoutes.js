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
      const result = await streamKeyService.generateStreamKey(userId);
      
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

  return router;
}; 