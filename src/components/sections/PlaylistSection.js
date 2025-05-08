import React from 'react';
import { Container, Spinner } from 'react-bootstrap';
import PlaylistCard from '../cards/PlaylistCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Slider from 'react-slick';
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

/**
 * PlaylistSection - Shows playlists in a slider similar to RecommendedSection
 */
const PlaylistSection = ({ title, playlists, loading, onPlaylistClick, onViewAllClick, onLikeClick }) => {
  // Only render if we have playlists
  if (!playlists || playlists.length === 0) {
    return null;
  }
  
  const settings = {
    dots: true,
    infinite: playlists.length > 5,
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
      <Container className="playlist-section mb-5">
        <h2 className="mb-4">{title}</h2>
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading playlists...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container className="playlist-section mb-5">
      <h2 className="mb-4">{title}</h2>
      <div className="position-relative slider-container">
        <Slider {...settings}>
          {playlists.map(playlist => (
            <div key={playlist.PlaylistID || playlist.id} className="px-2">
              <PlaylistCard 
                playlist={{
                  ...playlist,
                  PlaylistID: playlist.PlaylistID || playlist.id,
                  Title: playlist.Title || playlist.Name,
                  TrackCount: playlist.TrackCount || 0,
                  CreatorName: playlist.CreatorName || playlist.Username || 'Unknown Creator'
                }} 
                onPlayClick={() => onPlaylistClick(playlist.PlaylistID || playlist.id)}
                onLikeClick={onLikeClick ? (e) => onLikeClick(playlist.PlaylistID || playlist.id, e) : undefined}
                showLikeButton={!!onLikeClick}
                isLiked={playlist.IsLiked}
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
            View All Playlists
          </button>
        </div>
      )}
    </Container>
  );
};

export default PlaylistSection; 