import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaList } from 'react-icons/fa';
import '../../styles/PlayButton.css';

const PlaylistCard = ({ playlist, onPlayClick }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/playlists/${playlist.PlaylistID || playlist.id}`);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onPlayClick) {
      onPlayClick(playlist);
    } else {
      navigate(`/playlists/${playlist.PlaylistID || playlist.id}`);
    }
  };

  // Format track count
  const formatTrackCount = (count) => {
    if (!count && count !== 0) return '0';
    return count.toString();
  };

  return (
    <Card 
      className="h-100 shadow-sm"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={playlist.CoverURL || 'https://placehold.co/300x300?text=Playlist'} 
          alt={playlist.Title}
          style={{ height: '180px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/300x300?text=Playlist';
          }}
        />
        <Button 
          variant="success"
          className="play-button"
          onClick={handlePlayClick}
        >
          <FaPlay />
        </Button>
        <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white d-flex align-items-center">
          <FaList className="me-1" />
          {formatTrackCount(playlist.TrackCount)} tracks
        </span>
      </div>
      <Card.Body>
        <Card.Title className="text-truncate">{playlist.Title}</Card.Title>
        <Card.Text className="text-muted small">
          By {playlist.CreatedBy || 'Unknown Creator'}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default PlaylistCard; 