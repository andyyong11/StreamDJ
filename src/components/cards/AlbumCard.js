import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaMusic, FaHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PlayButton.css';
import { formatImageUrl, handleImageError } from '../../utils/imageUtils';
import api from '../../services/api';

const AlbumCard = ({ album, onPlayClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Check if the album is liked when component mounts
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !album || !album.AlbumID) return;
      
      try {
        // Use API service instead of direct fetch
        const response = await api.get(
          `/api/albums/${album.AlbumID}/like-status`, 
          { params: { userId: user.id } }
        );
        
        if (response && response.data) {
          setIsLiked(response.data.liked);
        }
      } catch (error) {
        console.error('Error checking album like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [album, user]);

  const handleLikeToggle = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user || !album || !album.AlbumID) return;
    
    setIsLikeLoading(true);
    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      
      // Use API service instead of direct fetch
      const response = await api.post(
        `/api/albums/${album.AlbumID}/${endpoint}`, 
        { userId: user.id }
      );
      
      if (response) {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} album:`, error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/albums/${album.AlbumID}`);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onPlayClick) {
      onPlayClick(album);
    } else {
      navigate(`/albums/${album.AlbumID}?autoplay=true`);
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
          src={formatImageUrl(album.CoverArtURL, 'album')}
          alt={album.Title || 'Album'}
          style={{ height: '180px', objectFit: 'cover' }}
          onError={(e) => handleImageError(e, 'album')}
        />
        <Button 
          variant="success" 
          className="play-button"
          onClick={handlePlayClick}
        >
          <FaPlay />
        </Button>
        {user && (
          <Button
            variant={isLiked ? "danger" : "outline-light"}
            className="position-absolute top-0 end-0 m-2"
            size="sm"
            onClick={handleLikeToggle}
            disabled={isLikeLoading}
          >
            <FaHeart />
          </Button>
        )}
        {album.TrackCount > 0 && (
          <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white d-flex align-items-center">
            <FaMusic className="me-1" />
            {formatTrackCount(album.TrackCount)} tracks
          </span>
        )}
      </div>
      <Card.Body>
        <Card.Title className="text-truncate">{album.Title || 'Untitled Album'}</Card.Title>
        <Card.Text className="text-muted small">
          By {album.Artist || 'Unknown Artist'}
          {album.ReleaseYear && ` • ${album.ReleaseYear}`}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default AlbumCard; 