import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, ProgressBar, Button } from 'react-bootstrap';
import {
  FaPlay, FaPause, FaStepForward, FaStepBackward,
  FaVolumeUp, FaHeart, FaRandom, FaRedo
} from 'react-icons/fa';

const MusicPlayer = ({ track }) => {
  const { user } = useAuth(); // (Temporary) Can be removed if it's not working
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => setIsPlaying(!isPlaying);
  // const toggleFavorite = () => setIsFavorite(!isFavorite);

  // ========================= Updated ToggleFavorite Function Starts ============================================
  const toggleFavorite = async () => {
    if (!track || !user) return;
  
    const endpoint = isFavorite ? 'unlike' : 'like';
  
    try {
      const res = await fetch(`http://localhost:5001/api/tracks/${track.TrackID}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
  
      if (res.ok) {
        setIsFavorite(!isFavorite);
      } else {
        console.error('Failed to toggle like');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };  
// ==================================== ENDS HERE  ================================

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = hrs > 0 ? String(mins).padStart(2, '0') : mins;
    const paddedSecs = String(secs).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${paddedMins}:${paddedSecs}` : `${mins}:${paddedSecs}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
      isPlaying ? audio.play().catch(err => console.error('Playback error:', err)) : audio.pause();
    }
  }, [isPlaying, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [track]);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!track || !user) return;
      try {
        const res = await fetch(`http://localhost:5001/api/tracks/${track.TrackID}/like-status?userId=${user.id}`);
        const data = await res.json();
        setIsFavorite(data.liked);
      } catch (err) {
        console.error('Failed to fetch like status:', err);
      }
    };
  
    fetchLikeStatus();
  }, [track, user]);  

  useEffect(() => {
    const logPlay = async () => {
      try {
        if (track && isPlaying) {
          await fetch(`http://localhost:5001/api/tracks/${track.TrackID}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: track.UserID || null })
          });
        }
      } catch (err) {
        console.error('Failed to log track play:', err);
      }
    };
    logPlay();
  }, [track, isPlaying]);

  if (!track) return null;

  const audioSrc = `http://localhost:5001/${track.FilePath?.replace(/\\/g, '/')}`;
  const coverArtSrc = track.CoverArt
    ? `http://localhost:5001/${track.CoverArt.replace(/\\/g, '/')}`
    : '/default-cover.jpg';

  return (
    <div className="fixed-bottom bg-dark text-light py-2 border-top">
      <Container fluid>
        <Row className="align-items-center">
          {/* Track Info */}
          <Col md={3} className="d-flex align-items-center">
            <img
              src={coverArtSrc}
              alt={`${track.Title} cover`}
              className="me-3"
              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-cover.jpg';
              }}
            />
<div className="d-flex flex-column">
  <h6 className="mb-1">{track.Title}</h6>
  <small style={{ color: 'white' }}>{track.Artist}</small>
</div>
            <Button variant="link" className="text-light ms-3" onClick={toggleFavorite}>
              <FaHeart color={isFavorite ? 'red' : 'white'} />
            </Button>
          </Col>

          {/* Player Controls */}
          <Col md={6}>
            <div className="d-flex justify-content-center align-items-center mb-2">
              <Button variant="link" className="text-light mx-2" onClick={() => setIsShuffle(!isShuffle)}>
                <FaRandom color={isShuffle ? '#1DB954' : 'white'} />
              </Button>
              <Button variant="link" className="text-light mx-2"><FaStepBackward /></Button>
              <Button
                variant="light"
                className="rounded-circle mx-2"
                style={{ width: '40px', height: '40px', padding: '0' }}
                onClick={togglePlay}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </Button>
              <Button variant="link" className="text-light mx-2"><FaStepForward /></Button>
              <Button variant="link" className="text-light mx-2" onClick={() => setIsRepeat(!isRepeat)}>
                <FaRedo color={isRepeat ? '#1DB954' : 'white'} />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="d-flex align-items-center position-relative" style={{ height: '30px' }}>
              <small className="text-muted me-2">{formatTime(currentTime)}</small>
              <div style={{ flexGrow: 1, position: 'relative' }}>
                <ProgressBar
                  now={(currentTime / (audioRef.current?.duration || 1)) * 100}
                  style={{ height: '5px', cursor: 'pointer' }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const hoverX = e.clientX - rect.left;
                    const width = rect.width;
                    const hoverT = (audioRef.current?.duration || 0) * (hoverX / width);
                    setHoverTime(hoverT);
                    setHoverPosition(hoverX);
                  }}
                  onMouseLeave={() => setHoverTime(null)}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const width = rect.width;
                    const audio = audioRef.current;
                    if (audio && audio.duration) {
                      const newTime = Math.max(0, Math.min((clickX / width) * audio.duration, audio.duration));
                      audio.currentTime = newTime;
                    }
                  }}
                />
                {hoverTime !== null && (
                  <div
                    className="position-absolute bg-dark text-white px-2 py-1 rounded"
                    style={{
                      top: '-35px',
                      left: hoverPosition - 25,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none'
                    }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>
              <small className="text-muted ms-2">{formatTime(audioRef.current?.duration || 0)}</small>
            </div>
          </Col>

          {/* Volume Control */}
          <Col md={3} className="d-flex align-items-center justify-content-end">
            <FaVolumeUp className="me-2" />
            <ProgressBar
              now={volume}
              style={{ width: '100px', height: '5px', cursor: 'pointer' }}
              onClick={(e) => {
                const clickX = e.nativeEvent.offsetX;
                const width = e.currentTarget.clientWidth;
                const newVolume = (clickX / width) * 100;
                setVolume(newVolume);
              }}
            />
          </Col>
        </Row>

        <audio ref={audioRef} src={audioSrc} />
      </Container>
    </div>
  );
};

export default MusicPlayer;