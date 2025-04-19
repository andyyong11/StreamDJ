const NodeMediaServer = require('node-media-server');
const config = require('../config/mediaServer');
const fs = require('fs');
const path = require('path');

// Create a custom NodeMediaServer class to handle the version error
class CustomNodeMediaServer extends NodeMediaServer {
  constructor(config) {
    super(config);
    this.version = '2.7.4'; // Set the version explicitly
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
  
  console.log('Stream directory path:', streamDir);
  
  try {
    // Ensure directory exists and is writable
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true, mode: 0o777 });
      console.log('Created stream directory:', streamDir);
    }
    
    fs.chmodSync(streamDir, 0o777);
    fs.accessSync(streamDir, fs.constants.W_OK);
    console.log('Stream directory is writable');
    
    // Clean up existing files
    const files = fs.readdirSync(streamDir);
    for (const file of files) {
      fs.unlinkSync(path.join(streamDir, file));
    }
    console.log('Cleaned up existing files in stream directory');
    
  } catch (err) {
    console.error('Error preparing stream:', err);
    return;
  }
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  
  const streamKey = StreamPath.split('/')[2];
  const streamDir = path.join(config.http.mediaroot, 'live', streamKey);
  
  // Log initial directory contents
  if (fs.existsSync(streamDir)) {
    console.log('Initial stream directory contents:', fs.readdirSync(streamDir));
  }
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  
  const streamKey = StreamPath.split('/')[2];
  const streamDir = path.join(config.http.mediaroot, 'live', streamKey);
  
  if (fs.existsSync(streamDir)) {
    console.log('Final stream directory contents:', fs.readdirSync(streamDir));
  }
});

// Log all FFmpeg output
nms.on('postTranscodeChunk', (id, StreamPath, args) => {
  console.log('[NodeEvent on postTranscodeChunk]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
});

// Handle any errors
nms.on('error', (err, id, StreamPath) => {
  console.error('[NodeEvent on error]', err, `id=${id} StreamPath=${StreamPath}`);
});

// Add error handling for server startup
try {
  console.log('Starting Media Server...');
  // Use the original run method but handle any errors
  nms.run();
} catch (err) {
  console.error('Failed to start media server:', err);
  process.exit(1);
}

module.exports = nms; 