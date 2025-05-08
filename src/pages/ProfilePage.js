import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH, FaCompactDisc, FaList, FaClock, FaUser, FaEdit, FaHeadphones, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserListModal from '../components/modals/UserListModal';
import AlbumCard from '../components/cards/AlbumCard';
import PlaylistCard from '../components/cards/PlaylistCard';
import TrackActionMenu from '../components/modals/TrackActionMenu';
import AddToPlaylistModal from '../components/modals/AddToPlaylistModal';
import DeleteTrackModal from '../components/modals/DeleteTrackModal';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import '../styles/PlayButton.css';
import '../styles/custom.css';

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

// Default placeholder image path
const DEFAULT_PLACEHOLDER = '/images/Default Track.png';

// Default image handling functions
const formatImageUrl = (url, type) => {
  if (!url) {
    // Use the correct image path based on type
    if (type === 'track') {
      return `/images/Default Track.png`;
    } else if (type === 'album') {
      return `/images/Default Album.png`;
    } else if (type === 'playlist') {
      return `/images/Default Playlist.png`;
    } else {
      return `/images/default-${type}.jpg`;
    }
  }
  
  // Handle relative server paths
  if (!url.startsWith('http') && !url.startsWith('/images/')) {
    return `http://localhost:5001/${url.replace(/^\/+/, '')}`;
  }
  
  return url;
};

const handleImageError = (e, type) => {
  e.target.onerror = null; // Prevent infinite error loops
  
  // Use the correct image path based on type
  if (type === 'track') {
    e.target.src = `/images/Default Track.png`;
  } else if (type === 'album') {
    e.target.src = `/images/Default Album.png`;
  } else if (type === 'playlist') {
    e.target.src = `/images/Default Playlist.png`;
  } else {
    e.target.src = `/images/default-${type}.jpg`;
  }
};

const ProfilePage = ({ playTrack, openLoginModal }) => {
  // Get the profile ID from the URL
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Modal states
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showDeleteTrackModal, setShowDeleteTrackModal] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    profile: true,
    playlists: true,
    tracks: true,
    albums: true,
    followToggle: false
  });
  const [error, setError] = useState({
    profile: null,
    playlists: null,
    tracks: null,
    albums: null,
    followToggle: null
  });

  // Check if this is the current user's profile
  const isOwnProfile = currentUser && currentUser.id === parseInt(id);

  // Define fetchProfileData outside of useEffect
  const fetchProfileData = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      setError(prev => ({ ...prev, profile: null }));
      
      // Add a timestamp to prevent caching
      const response = await api.get(`/api/users/${id}?t=${Date.now()}`);
      if (response?.data) {
        setProfileData(response.data);
        
        // Check if we're following this user
        if (currentUser && currentUser.id) {
          try {
            const followResponse = await api.get(`/api/users/${currentUser.id}/following/${id}`);
            setIsFollowing(followResponse?.data?.following || false);
          } catch (followErr) {
            console.error('Error checking follow status:', followErr);
            setIsFollowing(false);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(prev => ({ 
        ...prev, 
        profile: 'Could not load profile information. Please try again later.' 
      }));
      
      // Fallback data
      setProfileData({
        UserID: parseInt(id),
        Username: `User${id}`,
        FollowersCount: 0,
        FollowingCount: 0,
        ProfileImage: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
        BannerImage: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
        Bio: 'This user has not added a bio yet.'
      });
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Force refresh when coming from profile settings page
  useEffect(() => {
    // Check if we're coming from the profile settings page
    if (location.state?.fromProfileEdit) {
      // Force a data refresh
      fetchProfileData();
    }
  }, [location]);

  // Fetch profile data
  useEffect(() => {
    if (id) {
      fetchProfileData();
    }
  }, [id, currentUser]);

  // Fetch user playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!id) return;
      
      try {
        setLoading(prev => ({ ...prev, playlists: true }));
        setError(prev => ({ ...prev, playlists: null }));
        
        const response = await api.get(`/api/playlists/user/${id}`);
        if (response?.data) {
          setPlaylists(response.data);
        }
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError(prev => ({ ...prev, playlists: 'Could not load playlists.' }));
        // Empty array as fallback
        setPlaylists([]);
      } finally {
        setLoading(prev => ({ ...prev, playlists: false }));
      }
    };

    fetchPlaylists();
  }, [id]);

  // Fetch user tracks
  useEffect(() => {
    const fetchTracks = async () => {
      if (!id) return;
      
      try {
        setLoading(prev => ({ ...prev, tracks: true }));
        setError(prev => ({ ...prev, tracks: null }));
        
        const response = await api.get(`/api/tracks/by-user/${id}`);
        if (response?.data) {
          setTracks(response.data);
        }
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(prev => ({ ...prev, tracks: 'Could not load tracks.' }));
        // Empty array as fallback
        setTracks([]);
      } finally {
        setLoading(prev => ({ ...prev, tracks: false }));
      }
    };

    fetchTracks();
  }, [id]);

  // Fetch user albums
  useEffect(() => {
    const fetchAlbums = async () => {
      if (!id) return;
      
      try {
        setLoading(prev => ({ ...prev, albums: true }));
        setError(prev => ({ ...prev, albums: null }));
        
        const response = await api.get(`/api/albums/user/${id}`);
        if (response?.data) {
          setAlbums(response.data);
        }
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError(prev => ({ ...prev, albums: 'Could not load albums.' }));
        // Empty array as fallback
        setAlbums([]);
      } finally {
        setLoading(prev => ({ ...prev, albums: false }));
      }
    };

    fetchAlbums();
  }, [id]);

  const handleTabChange = (tab) => {
    if (tab.startsWith('creator-') || tab.startsWith('library-')) {
      if (tab === 'creator-dashboard') {
        navigate('/creator-dashboard');
      } else if (tab === 'creator-tracks') {
        navigate('/creator-dashboard/my-tracks');
      } else if (tab === 'creator-albums') {
        navigate('/creator-dashboard/my-albums');
      } else if (tab === 'creator-playlists') {
        navigate('/creator-dashboard/my-playlists');
      } else if (tab === 'library-tracks') {
        navigate('/liked-tracks');
      } else if (tab === 'library-albums') {
        navigate('/liked-albums');
      } else if (tab === 'library-playlists') {
        navigate('/liked-playlists');
      }
    } else {
      setActiveTab(tab);
    }
  };

  // Toggle follow status
  const handleToggleFollow = async () => {
    if (!currentUser || !currentUser.id) {
      // Open login modal instead of navigation
      if (openLoginModal) {
        openLoginModal();
      }
      return;
    }
    
    try {
      setError(prev => ({ ...prev, followToggle: null }));
      setLoading(prev => ({ ...prev, followToggle: true }));
      
      if (isFollowing) {
        const response = await api.delete(`/api/users/${currentUser.id}/unfollow/${id}`);
        if (response?.data?.success) {
          setIsFollowing(false);
          // Decrement follower count
          if (profileData) {
            setProfileData({
              ...profileData,
              FollowersCount: Math.max(0, (profileData.FollowersCount || 0) - 1)
            });
          }
        }
      } else {
        const response = await api.post(`/api/users/${currentUser.id}/follow/${id}`);
        if (response?.data?.success) {
          setIsFollowing(true);
          // Increment follower count
          if (profileData) {
            setProfileData({
              ...profileData,
              FollowersCount: (profileData.FollowersCount || 0) + 1
            });
          }
        }
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
      setError(prev => ({ 
        ...prev, 
        followToggle: 'Could not update follow status. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, followToggle: false }));
    }
  };

  // Update the formatNumber function to better format play counts
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    
    // Convert to number if it's a string
    const count = typeof num === 'string' ? parseInt(num, 10) : num;
    
    if (isNaN(count)) return '0';
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  // Format track duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play track
  const handlePlayTrack = (track) => {
    if (playTrack) {
      playTrack(track, tracks);
    }
  };

  // Handle play playlist
  const handlePlayPlaylist = (playlistId) => {
    navigate(`/playlists/${playlistId}`);
  };

  // Handle showing followers
  const handleShowFollowers = (e) => {
    e.preventDefault();
    setShowFollowersModal(true);
  };
  
  // Handle showing following
  const handleShowFollowing = (e) => {
    e.preventDefault();
    setShowFollowingModal(true);
  };

  // Add handlers for track actions
  const handleAddToPlaylist = (track) => {
    setSelectedTrack(track);
    setShowAddToPlaylistModal(true);
  };

  const handleDeleteTrack = (track) => {
    setSelectedTrack(track);
    setShowDeleteTrackModal(true);
  };

  const handleTrackDeleted = (trackId) => {
    // Filter out the deleted track from the tracks list
    setTracks(prev => prev.filter(track => track.TrackID !== trackId));
    setShowDeleteTrackModal(false);
  };

  // Render playlists section
  const renderPlaylists = () => {
    if (loading.playlists) {
      return (
        <div className="text-white text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading playlists...</span>
          </Spinner>
        </div>
      );
    }

    if (error.playlists) {
      return <Alert variant="danger">{error.playlists}</Alert>;
    }

    if (playlists.length === 0) {
      return (
        <div>
          <p className="text-muted">No playlists found.</p>
          {isOwnProfile && (
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/create-playlist')}
              className="mt-2"
            >
              Create Your First Playlist
            </Button>
          )}
        </div>
      );
    }

    const sliderSettings = {
      dots: true,
      infinite: playlists.length > 5,
      speed: 500,
      slidesToShow: activeTab === 'overview' ? 3 : 4,
      slidesToScroll: 1,
      swipeToSlide: true,
      prevArrow: <SlickArrowLeft />,
      nextArrow: <SlickArrowRight />,
      responsive: [
        { breakpoint: 1200, settings: { slidesToShow: 3 } },
        { breakpoint: 992, settings: { slidesToShow: 2 } },
        { breakpoint: 768, settings: { slidesToShow: 1 } }
      ]
    };

    // If we're in the overview tab, only show a few playlists
    const displayPlaylists = activeTab === 'overview' ? playlists.slice(0, 6) : playlists;

    // If we're in full list view, use a regular grid instead of slider
    if (activeTab === 'playlists' && playlists.length > 4) {
      return (
        <div>
          {isOwnProfile && (
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div></div>
              <div>
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/creator-dashboard/my-playlists')}
                  className="me-2"
                >
                  Manage All Playlists
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => navigate('/create-playlist')}
                >
                  Create New Playlist
                </Button>
              </div>
            </div>
          )}
          <Row>
            {playlists.map(playlist => (
              <Col md={4} lg={3} key={playlist.PlaylistID} className="mb-4">
                <PlaylistCard 
                  playlist={playlist}
                  onPlayClick={() => handlePlayPlaylist(playlist.PlaylistID)}
                />
              </Col>
            ))}
          </Row>
        </div>
      );
    }

    // Otherwise use the slider (for overview or small list of playlists)
    return (
      <div className="position-relative slider-container">
        <Slider {...sliderSettings}>
          {displayPlaylists.map(playlist => (
            <div key={playlist.PlaylistID} className="px-2">
              <PlaylistCard 
                playlist={playlist}
                onPlayClick={() => handlePlayPlaylist(playlist.PlaylistID)}
              />
            </div>
          ))}
        </Slider>
        {activeTab === 'overview' && (
          <div className="text-center mt-3 view-all-button">
            {playlists.length > 6 && (
              <Button 
                variant="outline-primary" 
                onClick={() => setActiveTab('playlists')}
                className="me-2"
              >
                View All Playlists
              </Button>
            )}
            {isOwnProfile && (
              <Button 
                variant="outline-success" 
                onClick={() => navigate('/creator-dashboard/my-playlists')}
              >
                Manage Playlists
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Update the track list display in renderTracks for overview
  const renderTracks = () => {
    if (loading.tracks) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading tracks...</span>
          </Spinner>
        </div>
      );
    }

    if (error.tracks) {
      return <Alert variant="danger">{error.tracks}</Alert>;
    }

    if (tracks.length === 0) {
      return <p className="text-white">No tracks found.</p>;
    }

    return (
      <Card className="mb-4">
        <Card.Body className="p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '60px' }}>Cover</th>
                <th>Title</th>
                <th style={{ width: '80px' }}>Duration</th>
                <th style={{ width: '80px' }}>Plays</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {tracks.slice(0, 5).map((track, index) => (
                <tr key={track.TrackID}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <img 
                      src={formatImageUrl(track.CoverArt, 'track')}
                      alt={track.Title || 'Track'}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => handleImageError(e, 'track')}
                    />
                  </td>
                  <td>{track.Title}</td>
                  <td className="text-center">{formatDuration(track.Duration)}</td>
                  <td className="text-center">
                    <span className="d-flex align-items-center justify-content-center">
                      <FaHeadphones className="me-1 text-muted" size={14} />
                      {formatNumber(track.PlayCount || track.play_count || 0)}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-end align-items-center">
                      <Button 
                        variant="success"
                        className="play-button-inline me-2"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <FaPlay />
                      </Button>
                      <div className="d-inline-block">
                        <TrackActionMenu 
                          track={track}
                          onAddToPlaylist={handleAddToPlaylist}
                          onDeleteTrack={handleDeleteTrack}
                        >
                          <FaEllipsisH />
                        </TrackActionMenu>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card.Body>
        {tracks.length > 5 && (
          <Card.Footer className="text-center">
            <Button variant="outline-primary" onClick={() => setActiveTab('tracks')}>
              View All Tracks
            </Button>
          </Card.Footer>
        )}
      </Card>
    );
  };

  // Function for full tracks view with date column
  const renderTracksContent = () => {
    if (loading.tracks) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading tracks...</span>
          </Spinner>
        </div>
      );
    }

    if (error.tracks) {
      return <Alert variant="danger">{error.tracks}</Alert>;
    }

    if (tracks.length === 0) {
      return <p className="text-white">No tracks found.</p>;
    }

    return (
      <Card className="mb-4">
        <Card.Body className="p-0">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '60px' }}>Cover</th>
                <th>Title</th>
                <th style={{ width: '80px' }}>Duration</th>
                <th style={{ width: '80px' }}>Plays</th>
                <th style={{ width: '100px' }}>Added</th>
                <th style={{ width: '100px' }}></th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, index) => (
                <tr key={track.TrackID}>
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <img 
                      src={formatImageUrl(track.CoverArt, 'track')}
                      alt={track.Title || 'Track'}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => handleImageError(e, 'track')}
                    />
                  </td>
                  <td>{track.Title}</td>
                  <td className="text-center">{formatDuration(track.Duration)}</td>
                  <td className="text-center">
                    <span className="d-flex align-items-center justify-content-center">
                      <FaHeadphones className="me-1 text-muted" size={14} />
                      {formatNumber(track.PlayCount || track.play_count || 0)}
                    </span>
                  </td>
                  <td className="text-center">{new Date(track.CreatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex justify-content-end align-items-center">
                      <Button 
                        variant="success"
                        className="play-button-inline me-2"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <FaPlay />
                      </Button>
                      <div className="d-inline-block">
                        <TrackActionMenu 
                          track={track}
                          onAddToPlaylist={handleAddToPlaylist}
                          onDeleteTrack={handleDeleteTrack}
                        >
                          <FaEllipsisH />
                        </TrackActionMenu>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card.Body>
      </Card>
    );
  };

  // Render albums section
  const renderAlbums = () => {
    if (loading.albums) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading albums...</span>
          </Spinner>
        </div>
      );
    }

    if (error.albums) {
      return <Alert variant="danger">{error.albums}</Alert>;
    }

    if (albums.length === 0) {
      return (
        <div>
          <p className="text-white">No albums found.</p>
          {isOwnProfile && (
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/upload-album')}
              className="mt-2"
            >
              Create Your First Album
            </Button>
          )}
        </div>
      );
    }

    const handlePlayAlbum = (album) => {
      // Navigate to album page with autoplay flag to start playing immediately
      navigate(`/albums/${album.AlbumID}?autoplay=true`);
    };

    const sliderSettings = {
      dots: true,
      infinite: albums.length > 5,
      speed: 500,
      slidesToShow: activeTab === 'overview' ? 3 : 4,
      slidesToScroll: 1,
      swipeToSlide: true,
      prevArrow: <SlickArrowLeft />,
      nextArrow: <SlickArrowRight />,
      responsive: [
        { breakpoint: 1200, settings: { slidesToShow: 3 } },
        { breakpoint: 992, settings: { slidesToShow: 2 } },
        { breakpoint: 768, settings: { slidesToShow: 1 } }
      ]
    };

    // If we're in the overview tab, only show a few albums
    const displayAlbums = activeTab === 'overview' ? albums.slice(0, 6) : albums;

    // If we're in full list view, use a regular grid instead of slider
    if (activeTab === 'albums' && albums.length > 4) {
      return (
        <div>
          {isOwnProfile && (
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div></div>
              <div>
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/creator-dashboard/my-albums')}
                  className="me-2"
                >
                  Manage All Albums
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => navigate('/upload-album')}
                >
                  Create New Album
                </Button>
              </div>
            </div>
          )}
          <Row>
            {albums.map(album => (
              <Col md={4} lg={3} key={album.AlbumID} className="mb-4">
                <AlbumCard album={album} onPlayClick={handlePlayAlbum} />
              </Col>
            ))}
          </Row>
        </div>
      );
    }

    // Otherwise use the slider (for overview or small list of albums)
    return (
      <div className="position-relative slider-container">
        <Slider {...sliderSettings}>
          {displayAlbums.map(album => (
            <div key={album.AlbumID} className="px-2">
              <AlbumCard album={album} onPlayClick={handlePlayAlbum} />
            </div>
          ))}
        </Slider>
        {activeTab === 'overview' && (
          <div className="text-center mt-3 view-all-button">
            {albums.length > 6 && (
              <Button 
                variant="outline-primary" 
                onClick={() => setActiveTab('albums')}
                className="me-2"
              >
                View All Albums
              </Button>
            )}
            {isOwnProfile && (
              <Button 
                variant="outline-success" 
                onClick={() => navigate('/creator-dashboard/my-albums')}
              >
                Manage Albums
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render overview content
  const renderOverviewContent = () => {
    if (loading.profile || loading.tracks || loading.playlists || loading.albums) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading profile...</span>
          </Spinner>
        </div>
      );
    }

    return (
      <div className="pb-5">
        {/* Tracks section */}
        <section className="mb-5">
          <h2 className="mb-4">Created Tracks</h2>
          {renderTracks()}
        </section>

        {/* Albums section */}
        <section className="mb-5">
          <h2 className="mb-4">Albums</h2>
          {albums.length > 0 ? (
            renderAlbums()
          ) : (
            <p className="text-white">No albums created yet.</p>
          )}
        </section>

        {/* Playlists section */}
        <section className="mb-5">
          <h2 className="mb-4">Playlists</h2>
          {playlists.length > 0 ? (
            renderPlaylists()
          ) : (
            <p className="text-white">No playlists created yet.</p>
          )}
        </section>
      </div>
    );
  };

  // Show loading state
  if (loading.profile && !profileData) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </Spinner>
      </Container>
    );
  }

  // Show error state
  if (error.profile && !profileData) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error.profile}</Alert>
        <Button variant="primary" as={Link} to="/">
          Go Back Home
        </Button>
      </Container>
    );
  }

  // Ensure we have profile data
  if (!profileData) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Profile not found</Alert>
        <Button variant="primary" as={Link} to="/">
          Go Back Home
        </Button>
      </Container>
    );
  }

  return (
    <div className="profile-page pb-5">
      {/* Profile Banner */}
      <div className="profile-banner-container mb-4">
        <div 
          className="profile-banner position-relative"
          style={{
            height: '280px',
            background: profileData.BannerImage 
              ? `url(${formatImageUrl(profileData.BannerImage)})`
              : 'linear-gradient(45deg, #3a1c71, #d76d77, #ffaf7b)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="position-absolute w-100 h-100" 
            style={{ 
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))',
              borderRadius: '8px'
            }}
          ></div>
          
          <div className="position-absolute bottom-0 start-0 w-100 p-4">
            <div className="d-flex flex-column flex-md-row align-items-center align-items-md-end">
              <div className="me-md-4 mb-3 mb-md-0 position-relative">
                <img
                  src={profileData.ProfileImage 
                    ? formatImageUrl(profileData.ProfileImage) 
                    : 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                  alt={profileData.Username}
                  className="rounded-circle border border-3 border-white"
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    objectFit: 'cover',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
                  }}
                />
                {isOwnProfile && (
                  <div className="position-absolute bottom-0 end-0">
                    <Button 
                      variant="light" 
                      size="sm" 
                      className="rounded-circle"
                      style={{ width: '32px', height: '32px', padding: '0' }}
                      onClick={() => navigate('/settings/profile')}
                    >
                      <FaEdit />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex-grow-1 text-center text-md-start mb-3 mb-md-0">
                <h1 className="text-white mb-2">{profileData.Username}</h1>
                <p className="text-light mb-3">{profileData.Bio || 'This user has not added a bio yet.'}</p>
                <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-3">
                  <Badge 
                    bg="dark" 
                    className="py-2 px-3" 
                    role="button" 
                    onClick={handleShowFollowers}
                    style={{ cursor: 'pointer' }}
                  >
                    <FaUserFriends className="me-1" /> {formatNumber(profileData.FollowersCount || 0)} Followers
                  </Badge>
                  <Badge 
                    bg="dark" 
                    className="py-2 px-3" 
                    role="button" 
                    onClick={handleShowFollowing}
                    style={{ cursor: 'pointer' }}
                  >
                    <FaUserFriends className="me-1" /> {formatNumber(profileData.FollowingCount || 0)} Following
                  </Badge>
                  <Badge bg="dark" className="py-2 px-3">
                    <FaMusic className="me-1" /> {formatNumber(tracks.length)} Tracks
                  </Badge>
                </div>
              </div>
              
              <div className="ms-md-auto">
                {!isOwnProfile && (
                  <Button 
                    variant={isFollowing ? "outline-light" : "light"} 
                    className="me-2"
                    onClick={handleToggleFollow}
                    disabled={loading.followToggle}
                  >
                    {loading.followToggle ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-1"
                      />
                    ) : (
                      <FaHeart className="me-1" />
                    )}
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                )}
                {isOwnProfile && (
                  <Button 
                    variant="light"
                    onClick={() => navigate('/settings/profile')}
                  >
                    <FaUser className="me-1" /> Edit Profile
                  </Button>
                )}
                {error.followToggle && (
                  <div className="text-danger mt-2 small">{error.followToggle}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Container>
        {/* Navigation Tabs */}
        <Tab.Container id="profile-tabs" activeKey={activeTab} onSelect={handleTabChange}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="overview">Overview</Nav.Link>
            </Nav.Item>
            
            <Nav.Item>
              <Nav.Link eventKey="tracks">
                <FaMusic className="me-1" /> Tracks 
                <Badge bg="secondary" className="ms-2">{tracks.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            
            <Nav.Item>
              <Nav.Link eventKey="albums">
                <FaCompactDisc className="me-1" /> Albums
                <Badge bg="secondary" className="ms-2">{albums.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            
            <Nav.Item>
              <Nav.Link eventKey="playlists">
                <FaList className="me-1" /> Playlists
                <Badge bg="secondary" className="ms-2">{playlists.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            
            {isOwnProfile && (
              <>
                {/* Creator Dashboard */}
                <Nav.Item>
                  <Nav.Link eventKey="creator-dashboard">Creator Dashboard</Nav.Link>
                </Nav.Item>
                
                {/* Library */}
                <Nav.Item>
                  <Nav.Link eventKey="library-tracks">Liked Tracks</Nav.Link>
                </Nav.Item>
              </>
            )}
          </Nav>
          
          <Tab.Content>
            <Tab.Pane eventKey="overview">
              {renderOverviewContent()}
            </Tab.Pane>
            
            <Tab.Pane eventKey="tracks">
              <h2 className="mb-4">All Tracks by {profileData.Username}</h2>
              {renderTracksContent()}
            </Tab.Pane>
            
            <Tab.Pane eventKey="albums">
              <h2 className="mb-4">Albums by {profileData.Username}</h2>
              {renderAlbums()}
            </Tab.Pane>
            
            <Tab.Pane eventKey="playlists">
              <h2 className="mb-4">Playlists by {profileData.Username}</h2>
              {renderPlaylists()}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
      
      {/* Followers Modal */}
      <UserListModal 
        show={showFollowersModal}
        onHide={() => setShowFollowersModal(false)}
        userId={id}
        type="followers"
        title={`Followers of ${profileData?.Username || 'User'}`}
      />
      
      {/* Following Modal */}
      <UserListModal 
        show={showFollowingModal}
        onHide={() => setShowFollowingModal(false)}
        userId={id}
        type="following"
        title={`Users followed by ${profileData?.Username || 'User'}`}
      />
      
      {/* AddToPlaylist Modal */}
      <AddToPlaylistModal
        show={showAddToPlaylistModal}
        handleClose={() => setShowAddToPlaylistModal(false)}
        track={selectedTrack}
      />
      
      {/* DeleteTrack Modal */}
      <DeleteTrackModal
        show={showDeleteTrackModal}
        handleClose={() => setShowDeleteTrackModal(false)}
        track={selectedTrack}
        onDelete={handleTrackDeleted}
      />
    </div>
  );
};

export default ProfilePage;
