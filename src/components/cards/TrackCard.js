import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeadphones, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const TrackCard = ({ track, onTrackSelect }) => {
  const handleCardClick = () => {
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  // Format play count
  const formatPlayCount = (count) => {
    if (!count) return '';
    if (count > 1000) {
      return `${Math.floor(count/1000)}K`;
    }
    return count;
  };

  // Handle username click to prevent card click
  const handleUsernameClick = (e) => {
    e.stopPropagation();
  };

  // Handle image error by providing a fallback image
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://placehold.co/300x300?text=Track';
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
          src={track.CoverArt ? 
            `http://localhost:5001/${track.CoverArt.replace(/^\/+/, '')}` : 
            'https://placehold.co/300x300?text=Track'
          }
          alt={track.Title}
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
        {track.PlayCount > 0 && (
          <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white">
            <FaHeadphones className="me-1" />
            {formatPlayCount(track.PlayCount)}
          </span>
        )}
      </div>
      <Card.Body>
        <Card.Title className="text-truncate">{track.Title}</Card.Title>
        <div className="d-flex align-items-center">
          <FaUser className="text-muted me-1" style={{ fontSize: '0.8rem' }} />
          {track.UserID ? (
            <Link 
              to={`/profile/${track.UserID}`} 
              className="text-muted mb-0 text-decoration-none"
              onClick={handleUsernameClick}
              style={{ 
                ':hover': { textDecoration: 'underline' } 
              }}
            >
              {track.Username || 'Unknown User'}
            </Link>
          ) : (
            <Card.Text className="text-muted mb-0">
              {track.Username || 'Unknown User'}
            </Card.Text>
          )}
        </div>
        
        {/* Show Artist information if it's different from Username */}
        {(track.Artist && track.Artist !== track.Username) && (
          <div className="d-flex align-items-center mt-1">
            <small className="text-muted">
              {track.Artist}
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default TrackCard; 