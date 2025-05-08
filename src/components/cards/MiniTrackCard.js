import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CoverImage from '../ui/CoverImage';

/**
 * MiniTrackCard - A compact version of the TrackCard component 
 * for use in trending sections, search results, etc.
 */
const MiniTrackCard = ({ 
  track, 
  onPlayClick, 
  onLikeClick, 
  isLiked = false,
  showUsername = true,
  showLikeButton = true
}) => {
  // Prevent events from bubbling up
  const handleClick = (e, callback) => {
    e.preventDefault();
    e.stopPropagation();
    if (callback) callback(track);
  };

  return (
    <Card 
      className="border h-100" 
      as={Link} 
      to={`/track/${track.TrackID}`}
      style={{ 
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <div className="d-flex">
        <div className="position-relative" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
          <CoverImage 
            src={track.CoverArt}
            alt={track.Title || 'Track'} 
            type="track"
            width={80}
            height={80}
            rounded="sm"
          />
        </div>
        <div className="d-flex flex-column justify-content-center flex-grow-1 px-3 py-2">
          <h6 className="mb-0 text-truncate">{track.Title || 'Untitled Track'}</h6>
          {showUsername && (
            <p className="mb-0 small text-muted text-truncate">
              {track.Artist || track.Username || 'Unknown Artist'}
            </p>
          )}
        </div>
        <div className="d-flex flex-column justify-content-center align-items-center p-2" style={{ width: '40px' }}>
          <Button 
            variant="success"
            className="rounded-circle mb-2"
            style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => handleClick(e, onPlayClick)}
          >
            <FaPlay size={14} />
          </Button>
          
          {showLikeButton && onLikeClick && (
            <Button
              variant={isLiked ? "danger" : "light"}
              size="sm"
              className="rounded-circle"
              style={{ 
                width: '28px', 
                height: '28px', 
                padding: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                lineHeight: 1
              }}
              onClick={(e) => handleClick(e, onLikeClick)}
            >
              <FaHeart 
                size={12} 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MiniTrackCard; 