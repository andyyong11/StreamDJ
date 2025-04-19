import React, { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socket';
import Hls from 'hls.js';

const StreamPlayer = ({ streamId }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const audio = audioRef.current;
    let hls;

    const setupStream = () => {
      setStatus('Setting up stream...');
      const streamUrl = `http://localhost:8000/live/${streamId}/index.m3u8`;
      console.log('Attempting to connect to stream:', streamUrl);

      if (Hls.isSupported()) {
        setStatus('HLS is supported, creating instance...');
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          debug: true,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('Stream manifest parsed, attempting playback...');
          audio.play().catch(err => {
            console.error('Playback failed:', err);
            setError('Failed to play stream: ' + err.message);
            setStatus('Playback failed');
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', event, data);
          setStatus(`Stream error: ${data.type}`);
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
                hls.destroy();
                break;
            }
          }
        });

        // Add more event listeners for debugging
        hls.on(Hls.Events.MANIFEST_LOADING, () => {
          console.log('Manifest loading...');
          setStatus('Loading stream manifest...');
        });

        hls.on(Hls.Events.LEVEL_LOADED, () => {
          console.log('Stream level loaded');
          setStatus('Stream level loaded');
        });
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        setStatus('Using native HLS support...');
        audio.src = streamUrl;
        audio.addEventListener('loadedmetadata', () => {
          setStatus('Stream metadata loaded, attempting playback...');
          audio.play().catch(err => {
            console.error('Native playback failed:', err);
            setError('Failed to play stream: ' + err.message);
            setStatus('Native playback failed');
          });
        });
      }
    };

    setupStream();

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [streamId]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setStatus('Stream paused');
      } else {
        audioRef.current.play().catch(err => {
          console.error('Toggle play failed:', err);
          setError('Failed to play stream: ' + err.message);
          setStatus('Playback failed');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="stream-player">
      <audio ref={audioRef} />
      <div className="controls">
        <button onClick={togglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>
      <div className="status">Stream Status: {status}</div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default StreamPlayer; 