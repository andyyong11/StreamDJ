const NodeMediaServer = require('node-media-server');
const config = require('../config/mediaServer');
const StreamKeyService = require('./streamKeyService');

class MediaServer {
  constructor(pool, io) {
    this.nms = new NodeMediaServer(config);
    this.streamKeyService = new StreamKeyService(pool);
    this.io = io;
    this.setupAuthHooks();
  }

  setupAuthHooks() {
    this.nms.on('prePublish', async (id, StreamPath, args) => {
      console.log('[NodeEvent on prePublish] Validating stream:', StreamPath);
      const streamKey = this.getStreamKeyFromPath(StreamPath);
      
      if (!streamKey) {
        console.log('No stream key found in path');
        const session = this.nms.getSession(id);
        session.reject();
        return;
      }

      const isValid = await this.streamKeyService.validateStreamKey(streamKey);
      console.log('Stream key validation result:', isValid);
      
      if (!isValid) {
        console.log('Invalid stream key, rejecting');
        const session = this.nms.getSession(id);
        session.reject();
        return;
      }

      // If we get here, the stream is valid
      console.log('Stream key validated, allowing publish');
    });

    this.nms.on('postPublish', async (id, StreamPath, args) => {
      console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath}`);
      const streamKey = this.getStreamKeyFromPath(StreamPath);
      if (streamKey) {
        console.log('Activating stream with key:', streamKey);
        try {
          const stream = await this.streamKeyService.activateStream(streamKey);
          console.log('Stream activation result:', stream);
          if (stream && this.io) {
            console.log('Emitting stream_started event');
            this.io.emit('stream_started', stream);
          } else {
            console.log('Stream activation failed or no socket connection');
          }
        } catch (error) {
          console.error('Error during stream activation:', error);
        }
      }
    });

    this.nms.on('donePublish', async (id, StreamPath, args) => {
      console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath}`);
      const streamKey = this.getStreamKeyFromPath(StreamPath);
      if (streamKey) {
        const stream = await this.streamKeyService.deactivateStreamKey(streamKey);
        if (stream && this.io) {
          this.io.emit('stream_ended', { streamId: stream.LiveStreamID });
        }
      }
    });
  }

  getStreamKeyFromPath(path) {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  start() {
    this.nms.run();
    console.log('Media Server is running');
  }

  stop() {
    this.nms.stop();
    console.log('Media Server stopped');
  }
}

module.exports = MediaServer; 