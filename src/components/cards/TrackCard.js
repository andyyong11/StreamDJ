import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeadphones, FaUser, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PlayButton.css';
import { formatImageUrl, handleImageError } from '../../utils/imageUtils';
import api from '../../services/api';

const TrackCard = ({ track, onTrackSelect }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Check if the track is liked by current user on component mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !track || !track.TrackID) return;
      
      try {
        // Use API service instead of direct fetch
        const response = await api.get(
          `/api/tracks/${track.TrackID}/like-status`, 
          { params: { userId: user.id } }
        );
        
        if (response && response.data) {
          setIsLiked(response.data.liked);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [track, user]);

  const handleLikeToggle = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user || !track || !track.TrackID) return;
    
    setIsLikeLoading(true);
    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      
      // Use API service instead of direct fetch
      const response = await api.post(
        `/api/tracks/${track.TrackID}/${endpoint}`, 
        { userId: user.id }
      );
      
      if (response) {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} track:`, error);
    } finally {
      setIsLikeLoading(false);
    }
  };

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
    if (!count && count !== 0) return '0';
    
    const numCount = typeof count === 'string' ? parseInt(count, 10) : count;
    
    if (isNaN(numCount)) return '0';
    
    if (numCount >= 1000000) {
      return `${(numCount / 1000000).toFixed(1)}M`;
    } else if (numCount >= 1000) {
      return `${(numCount / 1000).toFixed(1)}K`;
    }
    return numCount.toLocaleString();
  };

  // Handle username click to prevent card click
  const handleUsernameClick = (e) => {
    e.stopPropagation();
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
          src={formatImageUrl(track.CoverArt, 'track')}
          alt={track.Title || 'Track'}
          style={{ height: '180px', objectFit: 'cover' }}
          onError={(e) => handleImageError(e, 'track')}
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
        {track.PlayCount > 0 && (
          <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white d-flex align-items-center">
            <FaHeadphones className="me-1" />
            {formatPlayCount(track.PlayCount)}
          </span>
        )}
      </div>
      <Card.Body>
        <Card.Title className="text-truncate">{track.Title || 'Untitled Track'}</Card.Title>
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