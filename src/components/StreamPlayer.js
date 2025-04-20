import React, { useEffect, useRef, useState, useCallback } from 'react';
import socketService from '../services/socket';
import { FaEye } from 'react-icons/fa';
import Hls from 'hls.js';

const MAX_RETRIES = 30; // 30 retries = 150 seconds with 5s interval
const RETRY_INTERVAL = 5000; // 5 seconds

const StreamPlayer = ({ streamId, streamKey, onViewerCountChange }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const retryCountRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Initializing...');
  const [viewerCount, setViewerCount] = useState(0);

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  // Update viewer count and notify parent component
  const updateViewerCount = useCallback((count) => {
    setViewerCount(count);
    if (onViewerCountChange) {
      onViewerCountChange(count);
    }
  }, [onViewerCountChange]);

  // Listen for viewer count updates via socket
  useEffect(() => {
    if (!streamId) return;

    console.log(`StreamPlayer: Initializing viewer tracking for stream ${streamId}`);
    
    // Setup socket connection
    const socket = socketService.connect();
    
    // Join the stream's viewer tracking room
    socketService.joinStreamViewers(streamId);
    
    // Register for viewer count updates
    const handleViewerCountUpdate = (data) => {
      console.log('Received viewer_count_update event:', data);
      if (data.streamId.toString() === streamId.toString()) {
        console.log(`Updating viewer count to ${data.count} for stream ${streamId}`);
        updateViewerCount(data.count);
      }
    };
    
    socketService.onViewerCountUpdate(handleViewerCountUpdate);
    
    // Force an initial update - increment the viewer count immediately
    setTimeout(() => {
      console.log(`Sending viewer_joined for stream ${streamId}`);
      socketService.trackViewerJoin(streamId);
    }, 1000);
    
    return () => {
      console.log(`StreamPlayer: Cleaning up viewer tracking for stream ${streamId}`);
      socketService.trackViewerLeave(streamId);
      socketService.offViewerCountUpdate();
    };
  }, [streamId, updateViewerCount]);

  const setupStream = async () => {
    if (!streamKey) {
      setError('No stream key available');
      setStatus('Stream unavailable');
      return false;
    }

    const video = videoRef.current;
    if (!video) return false;

    // Clean up previous instance
    destroyHls();

    setStatus('Setting up stream...');
    const streamUrl = `http://localhost:8000/live/${streamKey}/index.m3u8`;
    console.log('Attempting to connect to stream:', streamUrl);

    // Check if stream is available
    try {
      const response = await fetch(streamUrl);
      const content = await response.text();
      console.log('Stream response:', response.status, content);

      if (!response.ok) {
        if (retryCountRef.current >= MAX_RETRIES) {
          setError('Stream failed to start after maximum retries');
          setStatus('Stream unavailable');
          return false;
        }
        setStatus(`Waiting for stream to start... (Attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);
        return false;
      }

      // Reset retry count on successful connection
      retryCountRef.current = 0;
      
      if (!content.includes('#EXTM3U')) {
        console.error('Invalid M3U8 content:', content);
        setError('Invalid stream format');
        setStatus('Stream format error');
        return false;
      }
    } catch (err) {
      console.error('Error checking stream:', err);
      setStatus('Stream not available');
      return false;
    }

    if (Hls.isSupported()) {
      setStatus('HLS is supported, creating instance...');
      const hls = new Hls({
        debug: true,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS: Media attached');
        setStatus('Media attached');
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS: Manifest parsed');
        setStatus('Stream ready');
        video.play()
          .then(() => {
            setIsPlaying(true);
            setError(null);
          })
          .catch(err => {
            console.error('Playback failed:', err);
            setError('Failed to play stream: ' + err.message);
            setStatus('Playback failed');
          });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', event, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStatus('Network error, attempting to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStatus('Media error, attempting to recover...');
              hls.recoverMediaError();
              break;
            default:
              setStatus('Fatal error, destroying stream...');
              destroyHls();
              break;
          }
          return false;
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      return true;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      setStatus('Using native HLS support...');
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setStatus('Stream ready');
        video.play()
          .then(() => {
            setIsPlaying(true);
            setError(null);
          })
          .catch(err => {
            console.error('Native playback failed:', err);
            setError('Failed to play stream: ' + err.message);
            setStatus('Playback failed');
          });
      });
      return true;
    }

    setError('HLS not supported');
    setStatus('Player not supported');
    return false;
  };

  useEffect(() => {
    let retryInterval;
    
    const initializeStream = async () => {
      const success = await setupStream();
      if (!success && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        retryInterval = setInterval(async () => {
          const retrySuccess = await setupStream();
          if (retrySuccess || retryCountRef.current >= MAX_RETRIES) {
            clearInterval(retryInterval);
          }
        }, RETRY_INTERVAL);
      }
    };

    initializeStream();

    return () => {
      clearInterval(retryInterval);
      destroyHls();
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
    };
  }, [streamId, streamKey]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setStatus('Stream paused');
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setStatus('Stream playing');
        })
        .catch(err => {
          console.error('Toggle play failed:', err);
          setError('Failed to play stream: ' + err.message);
          setStatus('Playback failed');
        });
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  return (
    <div className="stream-player position-relative">
      <video 
        ref={videoRef}
        style={{ width: '100%', maxHeight: '80vh' }}
        playsInline
        controls
      />
      
      {/* Viewer count overlay */}
      {isPlaying && (
        <div 
          className="position-absolute d-flex align-items-center" 
          style={{ 
            top: '1rem', 
            right: '1rem', 
            background: 'rgba(0, 0, 0, 0.7)', 
            color: 'white',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            zIndex: 10
          }}
        >
          <FaEye className="me-2" />
          <span>{viewerCount} watching</span>
        </div>
      )}
      
      <div className="status">Stream Status: {status}</div>
      {error && <div className="error" style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default StreamPlayer; 