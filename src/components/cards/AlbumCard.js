import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeart, FaMusic } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CoverImage from '../ui/CoverImage';
import '../../styles/PlayButton.css';

const AlbumCard = ({ album, onPlayClick, onLikeClick, isLiked = false, showLikeButton = true }) => {
  // Handle link click separately to avoid triggering card click
  const handleArtistClick = (e) => {
    e.stopPropagation();
  };

  // Handle play button click
  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent card navigation
    if (onPlayClick) {
      onPlayClick(album);
    }
  };

  // Handle like button click
  const handleLikeClick = (e) => {
    e.stopPropagation(); // Prevent card navigation
    
    // Add debug logging
    console.log('Album data in like click:', album);
    
    // Validate the album ID
    if (!album || album.AlbumID === undefined) {
      console.error('Invalid album or missing AlbumID:', album);
      return;
    }
    
    if (onLikeClick) {
      // Ensure AlbumID is a number
      const albumId = typeof album.AlbumID === 'number' ? 
        album.AlbumID : 
        parseInt(album.AlbumID, 10);
        
      console.log(`Calling onLikeClick with albumId: ${albumId}`);
      onLikeClick(albumId, e);
    }
  };

  // Format release year or date
  const formatReleaseInfo = () => {
    if (album.ReleaseDate) {
      // Check if it's a full date or just a year
      return album.ReleaseDate.length > 4 
        ? new Date(album.ReleaseDate).getFullYear() 
        : album.ReleaseDate;
    }
    return album.ReleaseYear || '';
  };

  return (
    <Card 
      className="h-100 border" 
      as={Link} 
      to={`/albums/${album.AlbumID}`}
      style={{ 
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <div className="card-img-container">
        <CoverImage
          src={album.CoverArt || album.CoverArtURL}
          alt={album.Title || 'Album'}
          type="album"
          className="cover-image"
          rounded="sm"
        />
        <Button
          variant="success"
          className="play-button-circle"
          onClick={handlePlayClick}
          aria-label="Play album"
        >
          <FaPlay size={18} />
        </Button>
        
        {showLikeButton && onLikeClick && (
          <Button
            variant={isLiked ? "danger" : "light"}
            className={`like-button-circle ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            aria-label={isLiked ? "Unlike album" : "Like album"}
          >
            <FaHeart size={16} />
          </Button>
        )}
      </div>
      <Card.Body className="p-3">
        <Card.Title className="mb-1 text-truncate fs-6 fw-bold">
          {album.Title || 'Untitled Album'}
        </Card.Title>
        <div className="text-muted small">
          By{' '}
          {album.UserID ? (
            <Link 
              to={`/profile/${album.UserID}`} 
              className="text-decoration-none text-muted"
              onClick={handleArtistClick}
            >
              {album.Artist || album.ArtistName || album.Username || 'Unknown Artist'}
            </Link>
          ) : (
            <span>{album.Artist || album.ArtistName || album.Username || 'Unknown Artist'}</span>
          )}
          
          <div className="d-flex justify-content-between align-items-center mt-1">
            <span className="small text-muted">
              <FaMusic className="me-1" style={{ fontSize: '0.7rem' }} /> 
              {album.TrackCount || 0} tracks
            </span>
            {(album.ReleaseDate || album.ReleaseYear) && (
              <span className="small text-muted">{formatReleaseInfo()}</span>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AlbumCard;