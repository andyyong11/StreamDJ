import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import TrackCard from '../cards/TrackCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Slider from 'react-slick';
import api from '../../services/api';
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

const RecommendedSection = ({ apiUrl, title = "Recommended For You", onTrackSelect }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
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
  
    if (apiUrl) {
      fetchRecommendations();
    }
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

  if (loading) {
    return (
      <Container className="text-center py-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading recommendations...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return null; // Hide section if there's an error
  }

  if (tracks.length === 0) {
    return null; // Don't show empty recommendations
  }

  return (
    <Container className="recommended-section mb-5">
      <h2 className="mb-4">{title}</h2>
      <div className="position-relative">
        <Slider {...settings}>
          {tracks.map(track => (
            <div key={track.TrackID || track.id} className="px-2">
              <TrackCard track={track} onTrackSelect={onTrackSelect} />
            </div>
          ))}
        </Slider>
      </div>
    </Container>
  );
};

export default RecommendedSection; 