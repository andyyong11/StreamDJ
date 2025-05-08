import React, { useEffect, useRef, useState, useCallback } from 'react';
import socketService from '../services/socket';
import { FaEye, FaPlay } from 'react-icons/fa';
import Hls from 'hls.js';
import '../styles/StreamPlayer.css';

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
  const [isMuted, setIsMuted] = useState(true); // Start muted to bypass autoplay restrictions
  const [showPlayOverlay, setShowPlayOverlay] = useState(true); // Show play overlay initially

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

  // Handle user interaction to start playing
  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;

    video.play()
      .then(() => {
        setIsPlaying(true);
        setShowPlayOverlay(false);
        setError(null);
        setStatus('Stream playing');
      })
      .catch(err => {
        console.error('Play failed:', err);
        setError('Failed to play stream: ' + err.message);
        setStatus('Playback failed');
      });
  };

  // Toggle mute state
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    videoRef.current.muted = newMutedState;
  };

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
    
    // Try different URLs in case one works better for the client
    // This helps with potential CORS or network issues
    const streamUrls = [
      `http://localhost:8000/live/${streamKey}/index.m3u8`,
      `/live/${streamKey}/index.m3u8`, // Relative URL might work better
      `${window.location.protocol}//${window.location.hostname}:8000/live/${streamKey}/index.m3u8`
    ];
    
    // Use the first URL for logging
    console.log('Attempting to connect to stream:', streamUrls[0]);

    // Try each URL until one works
    let responseOk = false;
    let content = '';
    let workingUrl = '';
    
    for (const url of streamUrls) {
      try {
        console.log('Trying stream URL:', url);
        const response = await fetch(url);
        content = await response.text();
        console.log('Stream response:', response.status, content.substring(0, 100));
        
        if (response.ok && content.includes('#EXTM3U')) {
          responseOk = true;
          workingUrl = url;
          console.log('Found working stream URL:', workingUrl);
          break;
        }
      } catch (err) {
        console.error(`Error checking stream at ${url}:`, err);
      }
    }

    if (!responseOk) {
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

    if (Hls.isSupported()) {
      setStatus('HLS is supported, creating instance...');
      const hls = new Hls({
        debug: false, // Set to false to reduce console noise
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true,
        // Add additional configuration to improve reliability
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 6,
        fragLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 6
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS: Media attached');
        setStatus('Media attached');
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS: Manifest parsed');
        setStatus('Stream ready');
        
        // Auto-play with muted audio to bypass browser restrictions
        video.muted = isMuted;
        video.play()
          .then(() => {
            setIsPlaying(true);
            setError(null);
          })
          .catch(err => {
            console.error('Playback failed:', err);
            setError('Failed to play stream: ' + err.message);
            setStatus('Playback failed');
            setShowPlayOverlay(true);
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

      hls.loadSource(workingUrl);
      hls.attachMedia(video);
      return true;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      setStatus('Using native HLS support...');
      video.src = workingUrl;
      video.addEventListener('loadedmetadata', () => {
        setStatus('Stream ready');
        
        // Auto-play with muted audio to bypass browser restrictions
        video.muted = isMuted;
        video.play()
          .then(() => {
            setIsPlaying(true);
            setError(null);
          })
          .catch(err => {
            console.error('Native playback failed:', err);
            setError('Failed to play stream: ' + err.message);
            setStatus('Playback failed');
            setShowPlayOverlay(true);
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

  // Update video status display to be more selective
  const getDisplayStatus = () => {
    // Only show status when it's important, hide common statuses
    const hiddenStatuses = ['Stream ready', 'Stream playing', 'Media attached'];
    return hiddenStatuses.includes(status) ? '' : status;
  };

  return (
    <div className="stream-player-container">
      {error && (
        <div className="stream-error-overlay">
          <div className="stream-error-message">
            {error}
            <button 
              className="btn btn-primary mt-2"
              onClick={() => {
                setError(null);
                retryCountRef.current = 0;
                setupStream();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {showPlayOverlay && !error && (
        <div className="stream-play-overlay" onClick={handlePlayClick}>
          <button className="play-button">
            <FaPlay />
          </button>
          <div className="play-text">Click to play</div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="video-js"
        controls
        autoPlay
        muted={isMuted}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000'
        }}
      />
      
      <div className="stream-status-overlay">
        <div className="stream-viewer-count">
          <FaEye /> {viewerCount}
        </div>
        {getDisplayStatus() && (
          <div className="stream-status">{getDisplayStatus()}</div>
        )}
      </div>
    </div>
  );
};

export default StreamPlayer; 