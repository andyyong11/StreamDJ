import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeart } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PlayButton.css';
import api from '../../services/api';
import CoverImage from '../ui/CoverImage';

const TrackCard = ({ track, onTrackSelect, isLiked: propIsLiked, onLikeClick }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(propIsLiked || false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Update local state if prop changes
  useEffect(() => {
    if (propIsLiked !== undefined) {
      setIsLiked(propIsLiked);
    }
  }, [propIsLiked]);

  // Check if the track is liked by current user on component mount (if not provided via props)
  useEffect(() => {
    // Skip if isLiked is provided via props or if user/track is missing
    if (propIsLiked !== undefined || !user || !track || !track.TrackID) return;
    
    const checkLikeStatus = async () => {
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
  }, [track, user, propIsLiked]);

  const handleLikeToggle = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    // If a custom like handler is provided, use that instead
    if (onLikeClick) {
      onLikeClick(track);
      return;
    }
    
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

  // Handle username click to prevent card click
  const handleUsernameClick = (e) => {
    e.stopPropagation();
  };

  // Get artist information to display
  const getArtistDisplay = () => {
    let artistText = track.Username || track.Artist || 'Unknown Artist';
    
    if (track.Artist && track.Artist !== track.Username) {
      artistText = track.Artist;
    }
    
    return artistText;
  };
  
  return (
    <Card 
      className="h-100 border"
      onClick={handleCardClick}
      style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden' }}
    >
      <div className="card-img-container">
        <CoverImage 
          src={track.CoverArt}
          alt={track.Title || 'Track'} 
          type="track"
          className="cover-image"
          rounded="sm"
        />
        <Button
          variant={isLiked ? "danger" : "light"}
          className={`like-button-circle ${isLiked ? 'liked' : ''}`}
          onClick={handleLikeToggle}
          disabled={isLikeLoading}
          aria-label={isLiked ? "Unlike track" : "Like track"}
        >
          <FaHeart size={16} />
        </Button>
        
        <Button 
          variant="success"
          className="play-button-circle"
          onClick={handlePlayClick}
          aria-label="Play track"
        >
          <FaPlay size={18} />
        </Button>
      </div>
      <Card.Body className="p-3">
        <Card.Title className="mb-1 text-truncate fs-6 fw-bold">
          {track.Title || 'Untitled Track'}
        </Card.Title>
        <div className="text-muted small">
          {track.UserID ? (
            <Link 
              to={`/profile/${track.UserID}`} 
              className="text-decoration-none text-muted"
              onClick={handleUsernameClick}
            >
              {getArtistDisplay()}
            </Link>
          ) : (
            <span>{getArtistDisplay()}</span>
          )}
          {track.Artist && track.Artist !== track.Username && track.Username && (
            <span className="d-block small text-muted">{track.Username}</span>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default TrackCard;