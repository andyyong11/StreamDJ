import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import AlbumCard from '../cards/AlbumCard';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../../styles/PlayButton.css';

// Custom arrows for the slider
const SlickArrowLeft = ({ currentSlide, slideCount, ...props }) => (
  <button
    {...props}
    className="slick-prev"
    aria-hidden="true"
    aria-disabled={currentSlide === 0}
    type="button"
  >
    <FaChevronLeft />
  </button>
);

const SlickArrowRight = ({ currentSlide, slideCount, ...props }) => (
  <button
    {...props}
    className="slick-next"
    aria-hidden="true"
    aria-disabled={currentSlide === slideCount - 1}
    type="button"
  >
    <FaChevronRight />
  </button>
);

const AlbumsSection = ({ 
  title = "Popular Albums", 
  apiUrl, 
  limit = 4, 
  onAlbumPlay, 
  onLikeClick,
  onViewAllClick 
}) => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [likedAlbums, setLikedAlbums] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch albums from API
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the api service for consistency
        const response = await api.get(apiUrl);
        
        // Ensure it's an array before setting state
        if (Array.isArray(response?.data)) {
          setAlbums(response.data.slice(0, limit));
        } else {
          console.warn("Expected array but got:", response?.data);
          setAlbums([]); // fallback to empty to prevent map error
        }
      } catch (err) {
        console.error('Failed to fetch albums:', err);
        setError("Couldn't load albums");
      } finally {
        setLoading(false);
      }
    };
  
    if (apiUrl) {
      fetchAlbums();
    }
  }, [apiUrl, limit]);
  
  // Fetch liked status for albums when user or albums change
  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!user || albums.length === 0) return;
      
      try {
        const likedMap = {};
        
        // This would ideally be a bulk request in a real API
        for (const album of albums) {
          try {
            console.log(`Checking like status for album ${album.AlbumID}, user ${user.id}`);
            const response = await api.get(`/api/albums/${album.AlbumID}/like-status`, {
              params: { userId: user.id }
            });
            console.log(`Like status response for album ${album.AlbumID}:`, response.data);
            likedMap[album.AlbumID] = response?.data?.liked || false;
          } catch (err) {
            console.warn(`Error checking liked status for album ${album.AlbumID}:`, err);
            console.warn('API error details:', err.response?.data || 'No response data');
            likedMap[album.AlbumID] = false;
          }
        }
        
        setLikedAlbums(likedMap);
      } catch (err) {
        console.error('Error checking liked albums status:', err);
      }
    };
    
    checkLikedStatus();
  }, [user, albums]);
  
  // Handle like/unlike with local state update for immediate UI feedback
  const handleLikeAlbum = (albumId, e) => {
    if (onLikeClick) {
      // Log the album ID and ID type for debugging
      console.log(`Handling like for album ${albumId}, type: ${typeof albumId}`, {
        album: albums.find(a => a.AlbumID === albumId)
      });
      
      // Update local state for immediate feedback
      setLikedAlbums(prev => ({
        ...prev,
        [albumId]: !prev[albumId]
      }));
      
      // Call the parent handler
      onLikeClick(albumId, e);
    }
  };

  const settings = {
    dots: true,
    infinite: albums.length > 5,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    swipeToSlide: true,
    prevArrow: <SlickArrowLeft />,
    nextArrow: <SlickArrowRight />,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 4 } },
      { breakpoint: 992, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } }
    ]
  };

  // Only render if we have albums
  if (!albums || albums.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Container className="albums-section mb-5">
        <h2 className="mb-4">{title}</h2>
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading albums...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error) {
    return null; // Hide section if there's an error
  }

  return (
    <Container className="albums-section mb-5">
      <h2 className="mb-4">{title}</h2>
      <div className="position-relative slider-container">
        <Slider {...settings}>
          {albums.map(album => (
            <div key={album.AlbumID} className="px-2">
              <AlbumCard 
                album={album} 
                onPlayClick={onAlbumPlay} 
                onLikeClick={handleLikeAlbum}
                isLiked={likedAlbums[album.AlbumID] || false}
              />
            </div>
          ))}
        </Slider>
      </div>
      {onViewAllClick && (
        <div className="text-center mt-3 view-all-button">
          <button 
            className="btn btn-outline-primary"
            onClick={onViewAllClick}
          >
            View All Albums
          </button>
        </div>
      )}
    </Container>
  );
};

export default AlbumsSection; 