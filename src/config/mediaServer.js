const NodeMediaServer = require('node-media-server');
const path = require('path');
const fs = require('fs');

// Define absolute paths
const rootPath = path.resolve(__dirname, '..', '..');
const mediaPath = path.join(rootPath, 'media');
const ffmpegPath = path.join('C:', 'ffmpeg-7.1.1', 'ffmpeg-n6.1-latest-win64-gpl-6.1', 'bin', 'ffmpeg.exe');

// Verify FFmpeg exists
if (!fs.existsSync(ffmpegPath)) {
  console.error('FFmpeg not found at:', ffmpegPath);
  process.exit(1);
}

const config = {
  logType: 3,
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: mediaPath
  },
  auth: {
    play: false,
    publish: false
  },
  trans: false // Disable transcoding entirely
};

// Create directories with proper permissions
const directories = [
  mediaPath,
  path.join(mediaPath, 'live')
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
    console.log(`Created directory: ${dir}`);
  }
  try {
    fs.chmodSync(dir, 0o777);
    fs.accessSync(dir, fs.constants.W_OK);
    console.log(`Directory ${dir} is writable`);
  } catch (err) {
    console.error(`Directory ${dir} is not writable:`, err);
  }
});

// Clean up any existing HLS segments
const cleanupHlsSegments = () => {
  const liveDir = path.join(mediaPath, 'live');
  if (fs.existsSync(liveDir)) {
    fs.readdirSync(liveDir).forEach(file => {
      const filePath = path.join(liveDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(subFile => {
          if (subFile.endsWith('.ts') || subFile.endsWith('.m3u8')) {
            fs.unlinkSync(path.join(filePath, subFile));
          }
        });
      }
    });
  }
};

// Clean up old segments on startup
cleanupHlsSegments();

// Log configuration
console.log('Media Server Configuration:', {
  mediaPath,
  ffmpegPath,
  rtmpUrl: 'rtmp://localhost:1935/live',
  hlsUrl: 'http://localhost:8000/live'
});

module.exports = config; 