const NodeMediaServer = require('node-media-server');
const path = require('path');
const fs = require('fs');

// Define absolute paths
const rootPath = path.resolve(__dirname, '..', '..');
const mediaPath = path.join(rootPath, 'media');
const ffmpegPath = process.env.FFMPEG_PATH || 'C:\\ffmpeg\\bin\\ffmpeg.exe';

// Normalize paths with correct separators for Windows
const normalizedMediaPath = mediaPath.replace(/\\/g, '/');

// Verify FFmpeg exists
if (!fs.existsSync(ffmpegPath)) {
  console.error('FFmpeg not found at:', ffmpegPath);
  console.error('Please ensure FFmpeg is installed at the correct path');
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
    mediaroot: normalizedMediaPath,
    webroot: normalizedMediaPath
  },
  trans: {
    ffmpeg: ffmpegPath,
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments+omit_endlist]',
        ac: 'aac',
        acParam: ['-b:a', '128k', '-ar', '44100'],
        vcParam: ['-vcodec', 'libx264', '-preset', 'superfast', '-profile:v', 'baseline', '-r', '30', '-g', '60', '-b:v', '1000k', '-f', 'hls'],
        hlsKeep: true
      }
    ]
  },
  auth: {
    play: false,
    publish: false
  }
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
  // Ensure directory has proper permissions even if it already exists
  try {
    fs.chmodSync(dir, 0o777);
    console.log(`Set permissions for directory: ${dir}`);
  } catch (err) {
    console.error(`Error setting permissions for ${dir}:`, err);
  }
});

// Clean up old segments on startup
const cleanupHlsSegments = () => {
  const liveDir = path.join(mediaPath, 'live');
  if (fs.existsSync(liveDir)) {
    fs.readdirSync(liveDir).forEach(file => {
      const filePath = path.join(liveDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fs.readdirSync(filePath).forEach(subFile => {
          if (subFile.endsWith('.ts') || subFile.endsWith('.m3u8') || subFile.endsWith('.mpd')) {
            try {
              fs.unlinkSync(path.join(filePath, subFile));
              console.log(`Cleaned up media file: ${subFile}`);
            } catch (err) {
              console.error(`Error cleaning up file ${subFile}:`, err);
            }
          }
        });
      }
    });
  }
};

cleanupHlsSegments();

// Log configuration
console.log('Media Server Configuration:', {
  mediaPath,
  ffmpegPath,
  rtmpUrl: 'rtmp://localhost:1935/live',
  hlsUrl: 'http://localhost:8000/live'
});

module.exports = {
  config,
  paths: {
    mediaPath,
    ffmpegPath,
    livePath: path.join(mediaPath, 'live')
  }
}; 