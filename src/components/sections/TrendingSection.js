import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { FaPlay, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import Slider from 'react-slick';
import TrackCard from '../cards/TrackCard';
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

const TrendingSection = ({ onTrackSelect }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        // Use the API service for consistency
        const response = await api.get('/api/trending');
        if (response?.data) {
          console.log('Trending tracks data:', response.data); // Debug log
          setTracks(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch trending tracks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

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

  const handlePlay = (e, track) => {
    e.stopPropagation();
    console.log('Play button clicked, track data:', track); // Debug log
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  const handleCardClick = (track) => {
    // Only navigate to albums, play tracks
    if (track.AlbumID) {
      navigate(`/albums/${track.AlbumID}`);
    } else if (onTrackSelect) {
      onTrackSelect(track);
    }
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

  if (loading) {
    return (
      <Container className="text-center py-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading trending tracks...</span>
        </Spinner>
      </Container>
    );
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <Container className="trending-section py-4">
      <h2 className="mb-4">Trending Now</h2>
      <div className="position-relative">
        <Slider {...settings}>
          {tracks.map((track) => (
            <div key={track.TrackID || track.id} className="px-2">
              <TrackCard track={track} onTrackSelect={onTrackSelect} />
            </div>
          ))}
        </Slider>
      </div>
    </Container>
  );
};

export default TrendingSection; 