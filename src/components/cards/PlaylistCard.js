import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlay, FaMusic } from 'react-icons/fa';

const PlaylistCard = ({ playlist, onPlayClick }) => {
  const handleCardClick = () => {
    if (onPlayClick) {
      onPlayClick(playlist);
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onPlayClick) {
      onPlayClick(playlist);
    }
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
          src={playlist.image || playlist.CoverURL ? 
            playlist.CoverURL && !playlist.CoverURL.startsWith('http') ? 
              `http://localhost:5001/${playlist.CoverURL.replace(/^\/+/, '')}` : 
              playlist.image || playlist.CoverURL
            : 'https://placehold.co/300x300?text=Playlist'
          } 
          alt={playlist.title || playlist.Title}
          style={{ height: '180px', objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/300x300?text=Playlist';
          }}
        />
        <Button 
          variant="success" 
          size="sm" 
          className="position-absolute bottom-0 end-0 m-2 rounded-circle"
          style={{ width: '35px', height: '35px', padding: '6px 0' }}
          onClick={handlePlayClick}
        >
          <FaPlay />
        </Button>
        {(playlist.tracks || playlist.TrackCount) > 0 && (
          <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white">
            <FaMusic className="me-1" />
            {playlist.tracks || playlist.TrackCount}
          </span>
        )}
      </div>
      <Card.Body>
        <Card.Title className="text-truncate">{playlist.title || playlist.Title}</Card.Title>
        <Card.Text className="text-muted small">
          By {playlist.creator || playlist.Username}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default PlaylistCard; 