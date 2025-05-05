import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import AlbumCard from '../cards/AlbumCard';
import Slider from 'react-slick';
import api from '../../services/api';

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

const AlbumsSection = ({ title = "Popular Albums", apiUrl, limit = 4, onAlbumPlay }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the api service for consistency
        const response = await api.get(apiUrl.replace('http://localhost:5001', ''));
        
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

  if (loading) {
    return (
      <Container className="text-center py-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading albums...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return null; // Hide section if there's an error
  }

  if (albums.length === 0) {
    return null; // Don't show empty albums
  }

  return (
    <Container className="albums-section mb-5">
      <h2 className="mb-4">{title}</h2>
      <div className="position-relative">
        <Slider {...settings}>
          {albums.map(album => (
            <div key={album.AlbumID} className="px-2">
              <AlbumCard album={album} onPlayClick={onAlbumPlay} />
            </div>
          ))}
        </Slider>
      </div>
    </Container>
  );
};

export default AlbumsSection; 