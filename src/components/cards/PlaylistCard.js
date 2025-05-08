import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CoverImage from '../ui/CoverImage';
import '../../styles/PlayButton.css';

const PlaylistCard = ({ playlist, onPlayClick, onLikeClick, isLiked = false, showLikeButton = true }) => {
  // Handle link click separately to avoid triggering card click
  const handleCreatorClick = (e) => {
    e.stopPropagation();
  };

  // Handle play button click
  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent card navigation
    if (onPlayClick) {
      onPlayClick(playlist);
    }
  };

  // Handle like button click
  const handleLikeClick = (e) => {
    e.stopPropagation(); // Prevent card navigation
    if (onLikeClick) {
      onLikeClick(playlist.PlaylistID, e);
    }
  };

  return (
    <Card 
      className="h-100 border" 
      as={Link} 
      to={`/playlists/${playlist.PlaylistID}`}
      style={{ 
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <div className="card-img-container">
        <CoverImage
          src={playlist.CoverURL || playlist.CoverArt}
          alt={playlist.Title || 'Playlist'}
          type="playlist"
          className="cover-image"
          rounded="sm"
        />
        <Button
          variant="success"
          className="play-button-circle"
          onClick={handlePlayClick}
          aria-label="Play playlist"
        >
          <FaPlay size={18} />
        </Button>
        
        {showLikeButton && onLikeClick && (
          <Button
            variant={isLiked ? "danger" : "light"}
            className={`like-button-circle ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            aria-label={isLiked ? "Unlike playlist" : "Like playlist"}
          >
            <FaHeart size={16} />
          </Button>
        )}
      </div>
      <Card.Body className="p-3">
        <Card.Title className="mb-1 text-truncate fs-6 fw-bold">
          {playlist.Title || playlist.Name || 'Untitled Playlist'}
        </Card.Title>
        <div className="text-muted small">
          By{' '}
          {playlist.UserID ? (
            <Link 
              to={`/profile/${playlist.UserID}`} 
              className="text-decoration-none text-muted"
              onClick={handleCreatorClick}
            >
              {playlist.CreatorName || playlist.Username || 'Unknown'}
            </Link>
          ) : (
            <span>{playlist.CreatorName || playlist.Username || 'Unknown'}</span>
          )}
          {playlist.TrackCount !== undefined && (
            <span className="d-block small text-muted">
              {playlist.TrackCount || 0} tracks
            </span>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default PlaylistCard; 