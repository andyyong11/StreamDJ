const NodeMediaServer = require('node-media-server');
const config = require('../config/mediaServer').config;
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

// URL for API endpoints
const API_BASE_URL = 'http://localhost:5001/api';

// Create a custom NodeMediaServer class to handle the version error
class CustomNodeMediaServer extends NodeMediaServer {
  constructor(config) {
    super(config);
  }

  run() {
    if (this.nmsCore) {
      return;
    }
    this.nmsCore = {
      version: '3.0.0'
    };
    super.run();
  }
}

const nms = new CustomNodeMediaServer(config);

nms.on('preConnect', (id, args) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('postConnect', (id, args) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  
  const streamKey = StreamPath.split('/')[2];
  const streamDir = path.join(config.http.mediaroot, 'live', streamKey);
  const normalizedStreamDir = streamDir.replace(/\\/g, '/');
  
  console.log('Stream directory path:', normalizedStreamDir);
  
  try {
    // Ensure directory exists and is writable
    if (!fs.existsSync(normalizedStreamDir)) {
      fs.mkdirSync(normalizedStreamDir, { recursive: true, mode: 0o777 });
      console.log('Created stream directory:', normalizedStreamDir);
    }
    
    fs.chmodSync(normalizedStreamDir, 0o777);
    fs.accessSync(normalizedStreamDir, fs.constants.W_OK);
    console.log('Stream directory is writable');
    
    // Clean up existing files
    const files = fs.readdirSync(normalizedStreamDir);
    for (const file of files) {
      fs.unlinkSync(path.join(normalizedStreamDir, file));
    }
    console.log('Cleaned up existing files in stream directory');
    
  } catch (err) {
    console.error('Error preparing stream:', err);
    return;
  }
});

nms.on('postPublish', async (id, StreamPath, args) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  
  const streamKey = StreamPath.split('/')[2];
  const streamDir = path.join(config.http.mediaroot, 'live', streamKey);
  const normalizedStreamDir = streamDir.replace(/\\/g, '/');
  
  // Log initial directory contents
  if (fs.existsSync(normalizedStreamDir)) {
    console.log('Initial stream directory contents:', fs.readdirSync(normalizedStreamDir));
  }
  
  // Activate the stream in the database
  try {
    console.log('Activating stream in database for key:', streamKey);
    const response = await fetch(`${API_BASE_URL}/streams/activate/${streamKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Stream activated successfully:', result.data);
    } else {
      console.error('Failed to activate stream:', result.error);
    }
  } catch (error) {
    console.error('Error activating stream in database:', error);
  }
});

nms.on('donePublish', async (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  
  const streamKey = StreamPath.split('/')[2];
  const streamDir = path.join(config.http.mediaroot, 'live', streamKey);
  const normalizedStreamDir = streamDir.replace(/\\/g, '/');
  
  if (fs.existsSync(normalizedStreamDir)) {
    console.log('Final stream directory contents:', fs.readdirSync(normalizedStreamDir));
  }
  
  // End the stream in the database
  try {
    console.log('Ending stream in database for key:', streamKey);
    const response = await fetch(`${API_BASE_URL}/streams/end/${streamKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Stream ended successfully:', result.data);
    } else {
      console.error('Failed to end stream:', result.error);
    }
  } catch (error) {
    console.error('Error ending stream in database:', error);
  }
});

// Log all FFmpeg output
nms.on('postTranscodeChunk', (id, StreamPath, args) => {
  console.log('[NodeEvent on postTranscodeChunk]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

// Add FFmpeg command logging
nms.on('preTranscode', (id, StreamPath, args) => {
  console.log('[NodeEvent on preTranscode]', `id=${id} StreamPath=${StreamPath}`);
  console.log('FFmpeg command:', args);
});

nms.on('doneTranscode', (id, StreamPath, args) => {
  console.log('[NodeEvent on doneTranscode]', `id=${id} StreamPath=${StreamPath}`);
  
  const streamKey = StreamPath.split('/')[2];
  const streamDir = path.join(config.http.mediaroot, 'live', streamKey);
  
  if (fs.existsSync(streamDir)) {
    console.log('Transcoded files:', fs.readdirSync(streamDir));
  }
});

// Handle any errors
nms.on('error', (err, id, StreamPath) => {
  console.error('[NodeEvent on error]', err, `id=${id} StreamPath=${StreamPath}`);
  if (err.code === 'ENOENT' && err.syscall === 'spawn') {
    console.error('FFmpeg not found. Please check the ffmpeg path:', config.trans.ffmpeg);
  }
});

// Export the configured instance without running it
module.exports = nms; 