import React, { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import TrackCard from '../cards/TrackCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Slider from 'react-slick';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/apiConfig';
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

const RecommendedSection = ({ apiUrl, title = "Recommended For You", onTrackSelect, onViewAllClick }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!apiUrl) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Use the api service for consistency
        const response = await api.get(apiUrl);
        
        // Ensure it's an array before setting state
        if (Array.isArray(response?.data)) {
          setTracks(response.data);
        } else {
          console.warn("Expected array but got:", response?.data);
          setTracks([]); // fallback to empty to prevent map error
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError("Couldn't load recommendations");
      } finally {
        setLoading(false);
      }
    };
  
    fetchRecommendations();
  }, [apiUrl]);

  const settings = {
    dots: true,
    infinite: tracks.length > 5,
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

  // Only render if we have tracks
  if (!tracks || tracks.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Container className="recommended-section mb-5">
        <h2 className="mb-4">{title}</h2>
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading recommendations...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error) {
    return null; // Hide section if there's an error
  }

  return (
    <Container className="recommended-section mb-5">
      <h2 className="mb-4">{title}</h2>
      <div className="position-relative slider-container">
        <Slider {...settings}>
          {tracks.map(track => (
            <div key={track.TrackID || track.id} className="px-2">
              <TrackCard track={track} onTrackSelect={onTrackSelect} />
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
            View All Tracks
          </button>
        </div>
      )}
    </Container>
  );
};

export default RecommendedSection; 