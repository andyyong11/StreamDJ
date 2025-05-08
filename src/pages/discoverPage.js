import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { FaPlay, FaHeart, FaMusic, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS, SERVER_URL } from '../config/apiConfig';
import genreOptions from '../utils/genreOptions';
import ProfileImage from '../components/ui/ProfileImage';
import CoverImage from '../components/ui/CoverImage';
import PlaylistCard from '../components/cards/PlaylistCard';
import AlbumCard from '../components/cards/AlbumCard';
import PlaylistSection from '../components/sections/PlaylistSection';
import AlbumsSection from '../components/sections/AlbumsSection';
import '../styles/PlayButton.css';
import Slider from 'react-slick';

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

const DiscoverPage = ({ playTrack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States for trending playlists
  const [trendingPlaylists, setTrendingPlaylists] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  
  // States for genres
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  
  // States for new releases
  const [newReleases, setNewReleases] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(true);
  
  // States for popular artists
  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  
  // Default image handling functions
  const formatImageUrl = (url, type) => {
    // For debugging
    console.log(`Formatting image URL for ${type}:`, { originalUrl: url });
    
    // Handle null/undefined urls
    if (!url) {
      console.log(`No URL provided for ${type}, using default`);
      
      // Use actual filenames from the directory for default images
      if (type === 'album') {
        return `/images/Default Album.png`;
      } else if (type === 'playlist') {
        return `/images/Default Playlist.png`;
      } else if (type === 'track') {
        return `/images/Default Track.png`;
      } else if (type === 'genre') {
        // Use Default Album as fallback for genres
        return `/images/Default Album.png`;
      }
      
      // Generic fallback for any other type
      return `/images/Default Album.png`;
    }
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's a path to a local image in /images
    if (url.startsWith('/images/')) {
      return url;
    }
    
    // Handle uploads/ prefix
    if (url.startsWith('uploads/')) {
      return `${SERVER_URL}/${url}`;
    }
    
    // Handle paths without uploads/ prefix
    if (!url.startsWith('/')) {
      return `${SERVER_URL}/uploads/${url}`;
    }
    
    // Handle paths with leading slash
    return `${SERVER_URL}${url}`;
  };

  // Enhanced image error handling with debugging
  const handleImageError = (e, type, genreName = null, item = null) => {
    // Log the error for debugging
    console.error(`Image load error for ${type}:`, {
      src: e.target.src,
      item: item || 'No item data',
      error: 'Failed to load image'
    });

    // For genre images, use the exact filenames we have in the public/images folder
    if (type === 'genre' && genreName) {
      // Special case for R&B
      const imageName = genreName === 'R&B' ? 'RandB' : genreName;
      
      // Try PNG format first (since most of your images are PNG)
      e.target.src = `/images/${imageName}.png`;
      
      // Add an additional error handler in case the png version doesn't exist
      e.target.onerror = () => {
        // Try JPG if PNG fails
        e.target.src = `/images/${imageName}.jpg`;
        
        // Final fallback to default image if both fail
        e.target.onerror = () => {
          e.target.src = `/images/Default Album.png`;
        };
      };
    } else if (type === 'album') {
      e.target.src = `/images/Default Album.png`;
    } else if (type === 'playlist') {
      e.target.src = `/images/Default Playlist.png`;
    } else {
      // Default fallback for other image types
      e.target.src = `/images/Default Album.png`;
    }
  };

  // Fetch trending playlists
  useEffect(() => {
    const fetchTrendingPlaylists = async () => {
      try {
        setLoadingTrending(true);
        const response = await api.get(API_ENDPOINTS.featuredPlaylists);
        if (response?.data) {
          setTrendingPlaylists(Array.isArray(response.data) ? response.data : []);
        } else {
          // Fallback to empty array
          setTrendingPlaylists([]);
        }
      } catch (error) {
        console.error('Error fetching trending playlists:', error);
        // Fallback to empty array
        setTrendingPlaylists([]);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchTrendingPlaylists();
  }, []);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoadingGenres(true);
        // Create featured genres using a subset of genreOptions
        // Using the most popular genres
        const featuredGenres = [
          'Hip-Hop', 'Electronic', 'Pop', 'Rock', 'Jazz', 
          'R&B', 'Classical', 'Indie', 'Metal', 'Reggae'
        ].filter(genre => genreOptions.includes(genre));
        
        // Map to genre objects with actual image files we have
        const mappedGenres = featuredGenres.map((name, index) => {
          // Special case for R&B which is saved as RandB.png
          const imageName = name === 'R&B' ? 'RandB' : name;
          
          return {
            GenreID: index + 1,
            Name: name,
            // Use the correct image filename
            ImageURL: `/images/${imageName}.png`
          };
        });
        
        setGenres(mappedGenres);
      } catch (error) {
        console.error('Error fetching genres:', error);
        // Fallback already handled below
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  // Fetch new releases
  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        setLoadingReleases(true);
        // Using popular albums endpoint instead of the non-existent recent endpoint
        const response = await api.get(API_ENDPOINTS.popularAlbums);
        if (response?.data) {
          console.log('Album data received:', response.data);
          setNewReleases(Array.isArray(response.data) ? response.data : []);
        } else {
          // Fallback to empty array
          setNewReleases([]);
        }
      } catch (error) {
        console.error('Error fetching new releases:', error);
        // Fallback to empty array
        setNewReleases([]);
      } finally {
        setLoadingReleases(false);
      }
    };

    fetchNewReleases();
  }, []);

  // Add a new effect for fetching artists
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoadingArtists(true);
        // Use the top users endpoint which returns popular artists
        const response = await api.get(API_ENDPOINTS.topUsers);
        if (response?.data) {
          console.log('Artist data received:', response.data);
          setArtists(Array.isArray(response.data) ? response.data : []);
        } else {
          // Fallback to mock data if API call fails
          setArtists([
            { UserID: 1, Username: 'DJ Awesome', ProfileImage: '/images/Default Album.png', FollowersCount: 15000 },
            { UserID: 2, Username: 'BeatMaster', ProfileImage: '/images/Default Album.png', FollowersCount: 12300 },
            { UserID: 3, Username: 'Melody Queen', ProfileImage: '/images/Default Album.png', FollowersCount: 9800 },
            { UserID: 4, Username: 'ElectroKing', ProfileImage: '/images/Default Album.png', FollowersCount: 8700 },
            { UserID: 5, Username: 'Bass Dropper', ProfileImage: '/images/Default Album.png', FollowersCount: 7500 },
            { UserID: 6, Username: 'Rhythm Maker', ProfileImage: '/images/Default Album.png', FollowersCount: 6200 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching artists:', error);
        // Fallback to mock data
        setArtists([
          { UserID: 1, Username: 'DJ Awesome', ProfileImage: '/images/Default Album.png', FollowersCount: 15000 },
          { UserID: 2, Username: 'BeatMaster', ProfileImage: '/images/Default Album.png', FollowersCount: 12300 },
          { UserID: 3, Username: 'Melody Queen', ProfileImage: '/images/Default Album.png', FollowersCount: 9800 },
          { UserID: 4, Username: 'ElectroKing', ProfileImage: '/images/Default Album.png', FollowersCount: 8700 },
          { UserID: 5, Username: 'Bass Dropper', ProfileImage: '/images/Default Album.png', FollowersCount: 7500 },
          { UserID: 6, Username: 'Rhythm Maker', ProfileImage: '/images/Default Album.png', FollowersCount: 6200 }
        ]);
      } finally {
        setLoadingArtists(false);
      }
    };

    fetchArtists();
  }, []);

  // Handle playing a track
  const handlePlayAlbum = (albumId) => {
    navigate(`/albums/${albumId}?autoplay=true`);
  };

  // Handle liking a playlist
  const handleLikePlaylist = async (playlistId, e) => {
    e.stopPropagation();
    if (!user) {
      // Redirect to login or show login modal
      navigate('/login');
      return;
    }

    try {
      await api.post(`/api/playlists/${playlistId}/like`, { userId: user.id });
      // Could update UI to show liked status
    } catch (error) {
      console.error('Error liking playlist:', error);
    }
  };

  // Handle clicking on genre
  const handleGenreClick = (genreId) => {
    navigate(`/browse?genre=${genreId}`);
  };

  const handleArtistClick = (artistId) => {
    navigate(`/profile/${artistId}`);
  };

  return (
    <Container style={{ paddingTop: '80px' }}>
      {/* Trending Playlists */}
      {loadingTrending ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
                </div>
      ) : trendingPlaylists.length > 0 ? (
        <PlaylistSection
          title="Trending Playlists"
          playlists={trendingPlaylists}
          loading={loadingTrending}
          onPlaylistClick={(playlistId) => navigate(`/playlists/${playlistId}?autoplay=true`)}
          onLikeClick={handleLikePlaylist}
          onViewAllClick={() => navigate('/playlists')}
        />
      ) : null}

      {/* Genres */}
      <section className="mb-5">
        <h2 className="mb-4">Browse by Genre</h2>
        {loadingGenres ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : genres.length > 0 ? (
        <Row>
          {genres.map(genre => (
              <Col md={2} key={genre.GenreID} className="mb-4 text-center">
                <Card 
                  className="h-100 border-0"
                  onClick={() => handleGenreClick(genre.GenreID)}
                  style={{ cursor: 'pointer' }}
                >
                  <CoverImage
                    src={genre.ImageURL}
                    alt={genre.Name}
                    type="genre"
                    className="mb-2"
                    rounded="md"
                  />
                <Card.Body className="p-0">
                    <h6>{genre.Name}</h6>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        ) : (
          <div className="text-center">
            <p>No genres available at the moment.</p>
          </div>
        )}
      </section>

      {/* Artists section */}
      <section className="mb-5">
        <h2 className="mb-4">Popular Artists</h2>
        {loadingArtists ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading artists...</span>
            </Spinner>
          </div>
        ) : artists.length > 0 ? (
        <Row>
            {artists.map(artist => (
              <Col md={2} key={artist.UserID} className="mb-4 text-center">
                <Card 
                  className="h-100 border-0"
                  onClick={() => handleArtistClick(artist.UserID)}
                  style={{ cursor: 'pointer' }}
                >
                  <ProfileImage 
                    src={artist.ProfileImage}
                    alt={artist.Username} 
                    size={120}
                    clickable
                  />
                  <Card.Body className="p-0">
                    <h6>{artist.Username}</h6>
                    <p className="text-muted small">{artist.FollowersCount?.toLocaleString() || 0} followers</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        ) : (
          <div className="text-center">
            <p>No artists available at the moment.</p>
          </div>
        )}
      </section>

      {/* New Releases */}
      {loadingReleases ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : newReleases.length > 0 ? (
        <AlbumsSection
          title="New Releases"
          apiUrl={API_ENDPOINTS.popularAlbums}
          onAlbumPlay={(album) => handlePlayAlbum(album.AlbumID)}
          limit={10}
        />
      ) : null}
    </Container>
  );
};

export default DiscoverPage;
