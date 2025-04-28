import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';

const TrendingTracks = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/trending');
        const data = await res.json();
        setTracks(data);
      } catch (err) {
        console.error('Failed to fetch trending tracks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 6,
    slidesToScroll: 2,
    swipeToSlide: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } }
    ]
  };

  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <div className="trending-section p-4 bg-dark text-white">
      <h2 className="mb-4">🔥 Trending Now</h2>
      <Slider {...settings}>
        {tracks.map((track) => (
          <div key={track.TrackID} className="px-2">
            <div className="bg-secondary rounded shadow-sm">
              <img
                src={`http://localhost:5001/${track.CoverArt}`}
                alt={track.Title}
                className="w-100 rounded-top"
                style={{ height: '180px', objectFit: 'cover' }}
              />
              <div className="p-2">
                <h6 className="mb-1 text-white text-truncate">{track.Title}</h6>
                <small className="text-light">{track.Artist}</small>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default TrendingTracks;