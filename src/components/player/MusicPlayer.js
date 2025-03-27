import React, { useState } from 'react';
import { Container, Row, Col, ProgressBar, Button } from 'react-bootstrap';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaVolumeUp, FaHeart, FaRandom, FaRedo } from 'react-icons/fa';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Mock data for current track
  const currentTrack = {
    title: "Summer Vibes",
    artist: "DJ Sunshine",
    album: "Beach Party Mix",
    duration: 217, // in seconds
    coverArt: "https://via.placeholder.com/60"
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed-bottom bg-dark text-light py-2 border-top">
      <Container fluid>
        <Row className="align-items-center">
          {/* Track Info */}
          <Col md={3} className="d-flex align-items-center">
            <img 
              src={currentTrack.coverArt} 
              alt={`${currentTrack.title} cover`} 
              className="me-3" 
              style={{ width: '60px', height: '60px' }}
            />
            <div>
              <h6 className="mb-0">{currentTrack.title}</h6>
              <small className="text-muted">{currentTrack.artist}</small>
            </div>
            <Button 
              variant="link" 
              className="text-light ms-3"
              onClick={toggleFavorite}
            >
              <FaHeart color={isFavorite ? 'red' : 'white'} />
            </Button>
          </Col>

          {/* Player Controls */}
          <Col md={6}>
            <div className="d-flex justify-content-center align-items-center mb-2">
              <Button variant="link" className="text-light mx-2" onClick={() => setIsShuffle(!isShuffle)}>
                <FaRandom color={isShuffle ? '#1DB954' : 'white'} />
              </Button>
              <Button variant="link" className="text-light mx-2">
                <FaStepBackward />
              </Button>
              <Button 
                variant="light" 
                className="rounded-circle mx-2" 
                style={{ width: '40px', height: '40px', padding: '0' }}
                onClick={togglePlay}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </Button>
              <Button variant="link" className="text-light mx-2">
                <FaStepForward />
              </Button>
              <Button variant="link" className="text-light mx-2" onClick={() => setIsRepeat(!isRepeat)}>
                <FaRedo color={isRepeat ? '#1DB954' : 'white'} />
              </Button>
            </div>
            <div className="d-flex align-items-center">
              <small className="text-muted me-2">{formatTime(currentTime)}</small>
              <ProgressBar 
                now={(currentTime / currentTrack.duration) * 100} 
                className="flex-grow-1" 
                style={{ height: '5px', cursor: 'pointer' }}
                onClick={(e) => {
                  const clickPosition = e.nativeEvent.offsetX;
                  const elementWidth = e.currentTarget.clientWidth;
                  const percentage = clickPosition / elementWidth;
                  setCurrentTime(percentage * currentTrack.duration);
                }}
              />
              <small className="text-muted ms-2">{formatTime(currentTrack.duration)}</small>
            </div>
          </Col>

          {/* Volume Control */}
          <Col md={3} className="d-flex align-items-center justify-content-end">
            <FaVolumeUp className="me-2" />
            <ProgressBar 
              now={volume} 
              style={{ width: '100px', height: '5px', cursor: 'pointer' }}
              onClick={(e) => {
                const clickPosition = e.nativeEvent.offsetX;
                const elementWidth = e.currentTarget.clientWidth;
                const percentage = (clickPosition / elementWidth) * 100;
                setVolume(percentage);
              }}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MusicPlayer;