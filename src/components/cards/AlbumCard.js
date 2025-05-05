import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaMusic } from 'react-icons/fa';

const AlbumCard = ({ album, onPlayClick }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/albums/${album.AlbumID}`);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onPlayClick) {
      onPlayClick(album);
    } else {
      navigate(`/albums/${album.AlbumID}`);
    }
  };

  // Handle image error by providing a fallback image
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://placehold.co/300x300?text=Album';
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
          src={album.CoverArtURL ? 
            `http://localhost:5001/${album.CoverArtURL.replace(/^\/+/, '')}` : 
            'https://placehold.co/300x300?text=Album'
          }
          alt={album.Title}
          style={{ height: '180px', objectFit: 'cover' }}
          onError={handleImageError}
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
        {album.TrackCount > 0 && (
          <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white">
            <FaMusic className="me-1" />
            {album.TrackCount} tracks
          </span>
        )}
      </div>
      <Card.Body>
        <Card.Title className="text-truncate">{album.Title}</Card.Title>
        <Card.Text className="text-muted small">
          By {album.Artist || 'Unknown Artist'}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default AlbumCard; 