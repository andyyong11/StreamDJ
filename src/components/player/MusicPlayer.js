import { useAuth } from '../../context/AuthContext';
import AddToPlaylistModal from './AddToPlaylistModal';
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, ProgressBar, Button } from 'react-bootstrap';
import {
  FaPlay, FaPause, FaStepForward, FaStepBackward,
  FaVolumeUp, FaVolumeMute, FaHeart, FaRandom, FaRedo,
  FaShareAlt, FaListUl, FaPlus
} from 'react-icons/fa';

const MusicPlayer = ({ 
  track, 
  isPlaying, 
  setIsPlaying, 
  onNext, 
  onPrevious,
  currentPlaylist = []
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [prevVolume, setPrevVolume] = useState(80);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
      if (audioRef.current) audioRef.current.volume = prevVolume / 100;
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const toggleFavorite = async () => {
    if (!track || !user) return;
    const endpoint = isFavorite ? 'unlike' : 'like';
    try {
      const res = await fetch(`http://localhost:5001/api/tracks/${track.TrackID}/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) setIsFavorite(!isFavorite);
      else console.error('Failed to toggle like');
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const paddedMins = hrs > 0 ? String(mins).padStart(2, '0') : mins;
    const paddedSecs = String(secs).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${paddedMins}:${paddedSecs}` : `${mins}:${paddedSecs}`;
  };

  const handleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const handleRepeat = () => {
    setIsRepeat(!isRepeat);
    if (audioRef.current) {
      audioRef.current.loop = !isRepeat;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: track.Title,
        text: `Check out ${track.Title} by ${track.Artist || 'Unknown Artist'} on StreamDJ!`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Failed to copy link:', err));
    }
  };

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume / 100;
      
      if (isPlaying) {
        audio.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      } else {
        audio.pause();
      }
      
      audio.loop = isRepeat;
    }
  }, [isPlaying, volume, isMuted, isRepeat, setIsPlaying]);

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.src = `http://localhost:5001/${track.FilePath?.replace(/\\/g, '/')}`;
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Auto-play failed:', err);
          setIsPlaying(false);
        });
      }
      
      setCurrentTime(0);
    }
  }, [track, isPlaying, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
  
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
  
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error('Failed to replay track:', err);
          setIsPlaying(false);
        });
      } else if (onNext) {
        onNext();
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };
  
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
  
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [track, onNext, isRepeat, setIsPlaying]);  

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!track || !user) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5001/api/tracks/${track.TrackID}/like-status?userId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
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
          const token = localStorage.getItem('token');
          await fetch(`http://localhost:5001/api/tracks/${track.TrackID}/play`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId: user?.id || null })
          });
        }
      } catch (err) {
        console.error('Failed to log track play:', err);
      }
    };
    logPlay();
  }, [track, isPlaying, user]);

  if (!track) return null;

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
                e.target.src = 'https://placehold.co/300x300';
              }}
            />
            <div className="d-flex flex-column">
              <h6 className="mb-1">{track.Title}</h6>
              <small style={{ color: 'white' }}>{track.Artist || track.ArtistName || 'Unknown Artist'}</small>
            </div>
            <Button variant="link" className="text-light ms-3" onClick={toggleFavorite}>
              <FaHeart color={isFavorite ? 'red' : 'white'} />
            </Button>
          </Col>

          {/* Player Controls */}
          <Col md={6}>
            <div className="d-flex justify-content-center align-items-center mb-2">
              <Button 
                variant="link" 
                className="text-light mx-2" 
                onClick={handleShuffle}
                title="Shuffle"
              >
                <FaRandom color={isShuffle ? '#1DB954' : 'white'} />
              </Button>
              <Button 
                variant="link" 
                className="text-light mx-2" 
                onClick={onPrevious}
                title="Previous"
              >
                <FaStepBackward />
              </Button>
              <Button
                variant="light"
                className="rounded-circle mx-2"
                style={{ width: '40px', height: '40px', padding: '0' }}
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </Button>
              <Button 
                variant="link" 
                className="text-light mx-2" 
                onClick={onNext}
                title="Next"
              >
                <FaStepForward />
              </Button>
              <Button 
                variant="link" 
                className="text-light mx-2" 
                onClick={handleRepeat}
                title="Repeat"
              >
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

          {/* Volume + Additional Controls */}
          <Col md={3} className="d-flex align-items-center justify-content-end gap-3">
            <Button 
              variant="link" 
              className="text-light p-0"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            </Button>
            <ProgressBar
              now={volume}
              style={{ width: '80px', height: '5px', cursor: 'pointer' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                const newVolume = Math.max(0, Math.min(Math.round((clickX / width) * 100), 100));
                setVolume(newVolume);
                setIsMuted(newVolume === 0);
                if (audioRef.current) audioRef.current.volume = newVolume / 100;
              }}
            />
            <Button 
              variant="link" 
              className="text-white p-0" 
              onClick={handleShare}
              title="Share"
            >
              <FaShareAlt />
            </Button>
            <Button 
              variant="link" 
              className="text-white p-0" 
              onClick={togglePlaylist}
              title="Queue"
            >
              <FaListUl />
            </Button>
            <Button 
              variant="link" 
              className="text-white p-0" 
              onClick={() => setShowAddModal(true)}
              title="Add to playlist"
            >
              <FaPlus />
            </Button>
          </Col>
        </Row>
        
        <audio ref={audioRef} />
        
        <AddToPlaylistModal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          track={track}
          userId={user?.id}
        />
        
        {showPlaylist && (
          <Row className="mt-2">
            <Col>
              <div className="bg-dark border border-secondary rounded p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <h6 className="mb-2">Now Playing</h6>
                <ul className="list-unstyled">
                  {currentPlaylist.map((t, idx) => (
                    <li 
                      key={t.TrackID || idx} 
                      className={`d-flex align-items-center py-1 ${t.TrackID === track.TrackID ? 'text-success' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (onNext && currentPlaylist.indexOf(t) > currentPlaylist.indexOf(track)) {
                          for (let i = currentPlaylist.indexOf(track); i < currentPlaylist.indexOf(t); i++) {
                            onNext();
                          }
                        } else if (onPrevious && currentPlaylist.indexOf(t) < currentPlaylist.indexOf(track)) {
                          for (let i = currentPlaylist.indexOf(track); i > currentPlaylist.indexOf(t); i--) {
                            onPrevious();
                          }
                        }
                      }}
                    >
                      <span className="me-2">{idx + 1}.</span>
                      <span className="text-truncate">{t.Title} - {t.Artist || t.ArtistName || 'Unknown Artist'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default MusicPlayer;
