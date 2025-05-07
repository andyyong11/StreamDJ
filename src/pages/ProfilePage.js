import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Nav, Tab, Spinner, Alert } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH, FaCompactDisc, FaList, FaClock, FaUser, FaEdit, FaHeadphones } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserListModal from '../components/modals/UserListModal';
import AlbumCard from '../components/cards/AlbumCard';
import TrackActionMenu from '../components/modals/TrackActionMenu';
import AddToPlaylistModal from '../components/modals/AddToPlaylistModal';
import DeleteTrackModal from '../components/modals/DeleteTrackModal';
import '../styles/PlayButton.css';

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
        ProfileImage: 'https://via.placeholder.com/150?text=User',
        BannerImage: 'https://via.placeholder.com/1200x300?text=Profile+Banner',
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
        <div className="text-center py-4">
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
      return <p className="text-muted">No playlists found.</p>;
    }

    return (
      <Row>
        {playlists.map(playlist => (
          <Col md={4} key={playlist.PlaylistID} className="mb-4">
            <Card className="h-100 shadow-sm">
              <div className="position-relative">
                <Card.Img 
                  variant="top" 
                  src={
                    playlist.CoverURL 
                      ? (playlist.CoverURL.startsWith('http') 
                        ? playlist.CoverURL 
                        : `http://localhost:5001/${playlist.CoverURL.replace(/^\/+/, '')}`)
                      : 'https://placehold.co/300x300?text=Playlist'
                  } 
                  alt={playlist.Title}
                  style={{ height: '180px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/300x300?text=Playlist';
                  }}
                />
                <Button 
                  variant="success" 
                  className="play-button"
                  onClick={() => handlePlayPlaylist(playlist.PlaylistID)}
                >
                  <FaPlay />
                </Button>
              </div>
              <Card.Body>
                <Card.Title className="text-truncate">{playlist.Title}</Card.Title>
                <Card.Text>
                  <small className="text-muted">
                    {playlist.TrackCount || 0} tracks
                  </small>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // Update the track list display in renderTracks
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
      return <p className="text-muted">No tracks found.</p>;
    }

    return (
      <Card>
        <Card.Body className="p-0">
          <table className="table table-hover align-middle mb-0">
            <thead>
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
                      src={track.CoverArt ? 
                        `http://localhost:5001/${track.CoverArt.replace(/^\/+/, '')}` : 
                        'https://placehold.co/50x50?text=Track'
                      } 
                      alt={track.Title}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/50x50?text=Track';
                      }}
                    />
                  </td>
                  <td>{track.Title}</td>
                  <td className="text-center">{formatDuration(track.Duration)}</td>
                  <td className="text-center">
                    <span className="d-flex align-items-center justify-content-center">
                      <FaHeadphones className="me-1 text-muted" size={14} />
                      {formatNumber(track.PlayCount)}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-end align-items-center">
                      <Button 
                        variant="success"
                        className="play-button-table me-2"
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
            <Button variant="link" onClick={() => setActiveTab('tracks')}>
              View All Tracks
            </Button>
          </Card.Footer>
        )}
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
      return <p className="text-muted">No albums found.</p>;
    }

    const handlePlayAlbum = (album) => {
      // Navigate to album page which will handle playing the album
      navigate(`/albums/${album.AlbumID}`);
    };

    return (
      <Row>
        {(activeTab === 'overview' ? albums.slice(0, 3) : albums).map(album => (
          <Col md={activeTab === 'overview' ? 4 : 3} key={album.AlbumID} className="mb-4">
            <AlbumCard album={album} onPlayClick={handlePlayAlbum} />
          </Col>
        ))}
        {activeTab === 'overview' && albums.length > 3 && (
          <div className="text-center w-100 mt-2">
            <Button variant="outline-primary" onClick={() => setActiveTab('albums')}>
              View All Albums
            </Button>
          </div>
        )}
      </Row>
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
      <>
        {/* Tracks section */}
        <section className="mb-5">
          <h3 className="mb-4">Created Tracks</h3>
          {renderTracks()}
        </section>

        {/* Playlists section */}
        <section className="mb-5">
          <h3 className="mb-4">Playlists</h3>
          {renderPlaylists()}
        </section>

        {/* Albums section */}
        <section className="mb-5">
          <h3 className="mb-4">Albums</h3>
          {renderAlbums()}
        </section>
      </>
    );
  };

  // Similarly update the renderTracksContent function for the full tracks view
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
      return <p className="text-muted">No tracks found.</p>;
    }

    return (
      <Card>
        <Card.Body className="p-0">
          <table className="table table-hover align-middle mb-0">
            <thead>
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
                      src={track.CoverArt ? 
                        `http://localhost:5001/${track.CoverArt.replace(/^\/+/, '')}` : 
                        'https://placehold.co/50x50?text=Track'
                      } 
                      alt={track.Title}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/50x50?text=Track';
                      }}
                    />
                  </td>
                  <td>{track.Title}</td>
                  <td className="text-center">{formatDuration(track.Duration)}</td>
                  <td className="text-center">
                    <span className="d-flex align-items-center justify-content-center">
                      <FaHeadphones className="me-1 text-muted" size={14} />
                      {formatNumber(track.PlayCount)}
                    </span>
                  </td>
                  <td className="text-center">{new Date(track.CreatedAt).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex justify-content-end align-items-center">
                      <Button 
                        variant="success"
                        className="play-button-table me-2"
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

  // Update the getSafeImageUrl function to properly handle internal vs external URLs
  const getSafeImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/300x300?text=Image';
    
    // If it's already a full URL, return it as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // For local paths from the server, ensure they have the proper base URL
    // Clean up any redundant slashes
    const cleanPath = imagePath.replace(/^\/+/, '');
    
    // Return a properly formed URL to the server
    return `http://localhost:5001/${cleanPath}`;
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
    <Container>
      {/* Profile Banner */}
      <Card className="mb-4 border-0">
        <div 
          className="profile-banner position-relative"
          style={{
            height: '280px',
            background: profileData.BannerImage 
              ? `url(${getSafeImageUrl(profileData.BannerImage)})`
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
                    ? getSafeImageUrl(profileData.ProfileImage) 
                    : 'https://placehold.co/150x150?text=User'}
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
                    e.target.src = 'https://placehold.co/150x150?text=User';
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
      </Card>

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
            <h3 className="mb-4">All Tracks by {profileData.Username}</h3>
            {renderTracksContent()}
          </Tab.Pane>
          
          <Tab.Pane eventKey="albums">
            <h3 className="mb-4">Albums by {profileData.Username}</h3>
            {renderAlbums()}
          </Tab.Pane>
          
          <Tab.Pane eventKey="playlists">
            <h3 className="mb-4">Playlists by {profileData.Username}</h3>
            {renderPlaylists()}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
      
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
    </Container>
  );
};

export default ProfilePage;


// import React from 'react';
// import { useParams } from 'react-router-dom';
// import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
// import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH } from 'react-icons/fa';

// const ProfilePage = () => {
//   // Get the profile ID from the URL
//   const { id } = useParams();

//   // Mock user data based on ID
//   const users = {
//     1: {
//       name: 'DJ Sparkle',
//       followers: '1.2M',
//       following: 345,
//       avatar: 'https://via.placeholder.com/150',
//       banner: 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png',
//       bio: 'Bringing the best beats to your ears. Live DJ, music producer, and sound enthusiast.'
//     },
//     2: {
//       name: 'BeatMaster',
//       followers: '980K',
//       following: 210,
//       avatar: 'https://via.placeholder.com/150',
//       banner: 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png',
//       bio: 'Hip Hop is life. Bringing the best rap beats and remixes to the stage.'
//     },
//     3: {
//       name: 'ElectroQueen',
//       followers: '1.5M',
//       following: 500,
//       avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCJkAoQFnKSizD__XWUr1_RhK86R8E7h8I0g&s',
//       banner: 'https://i.etsystatic.com/34466454/r/il/730751/4475686453/il_fullxfull.4475686453_n0ds.jpg',
//       bio: 'Electronic beats and house music to keep the party going all night.'
//     }
//   };

//   // Get user data; if ID is not found, default to user 1
//   const user = users[id] || users[1];

//   // Mock playlists
//   const playlists = [
//     { id: 1, title: 'My Favorite Mixes', tracks: 20, image: 'https://preview.redd.it/heres-some-playlist-icons-in-the-style-of-liked-songs-you-v0-cahrrr1is8ee1.png?width=473&format=png&auto=webp&s=e33bfdb466d30f69fa4209b41f90dc7e41f0e609' },
//     { id: 2, title: 'Chill Out Sessions', tracks: 15, image: 'https://lofigirl.com/wp-content/uploads/2023/02/DAY_UPDATE_ILLU.jpg' },
//     { id: 3, title: 'Top Hits', tracks: 30, image: 'https://i.scdn.co/image/ab67616d0000b273016d1a64505bc840c5e60469' },
//   ];

//   // Mock recent tracks
//   const recentTracks = [
//     { id: 1, title: 'Summer Groove', duration: '3:45', plays: 1250000 },
//     { id: 2, title: 'Midnight City', duration: '4:12', plays: 980000 },
//     { id: 3, title: 'Chill Wave', duration: '5:30', plays: 750000 },
//   ];

//   return (
//     <Container>
//       {/* Profile Banner */}
//       <Card className="mb-4">
//         <Card.Img src={user.banner} alt="Profile Banner" className="rounded" />
//         <Card.ImgOverlay className="d-flex flex-column justify-content-end">
//           <Row className="align-items-center">
//             <Col md={3} className="text-center">
//               <img
//                 src={user.avatar}
//                 alt={user.name}
//                 className="rounded-circle border border-white"
//                 style={{ width: '120px', height: '120px' }}
//               />
//             </Col>
//             <Col md={6}>
//               <h2 className="text-white">{user.name}</h2>
//               <p className="text-light">{user.bio}</p>
//               <Badge bg="primary" className="me-2">
//                 <FaUserFriends /> {user.followers} Followers
//               </Badge>
//               <Badge bg="secondary">
//                 <FaMusic /> {user.following} Following
//               </Badge>
//             </Col>
//             <Col md={3} className="text-end">
//               <Button variant="danger" className="me-2">
//                 <FaHeart /> Follow
//               </Button>
//               <Button variant="light">
//                 <FaEllipsisH />
//               </Button>
//             </Col>
//           </Row>
//         </Card.ImgOverlay>
//       </Card>

//       {/* My Playlists */}
//       <section className="mb-5">
//         <h3 className="mb-4">{user.name}'s Playlists</h3>
//         <Row>
//           {playlists.map(playlist => (
//             <Col md={4} key={playlist.id} className="mb-4">
//               <Card className="shadow-sm">
//                 <Card.Img variant="top" src={playlist.image} />
//                 <Card.Body>
//                   <Card.Title>{playlist.title}</Card.Title>
//                   <Card.Text>{playlist.tracks} tracks</Card.Text>
//                   <Button variant="success" size="sm">
//                     <FaPlay className="me-1" /> Play
//                   </Button>
//                 </Card.Body>
//               </Card>
//             </Col>
//           ))}
//         </Row>
//       </section>

//       {/* Recently Played Tracks */}
//       <section className="mb-5">
//         <h3 className="mb-4">Recently Played by {user.name}</h3>
//         <Card>
//           <Card.Body>
//             <table className="table">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Title</th>
//                   <th>Duration</th>
//                   <th>Plays</th>
//                   <th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {recentTracks.map((track, index) => (
//                   <tr key={track.id}>
//                     <td>{index + 1}</td>
//                     <td>{track.title}</td>
//                     <td>{track.duration}</td>
//                     <td>{track.plays.toLocaleString()}</td>
//                     <td>
//                       <Button variant="link" className="p-0">
//                         <FaEllipsisH />
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </Card.Body>
//         </Card>
//       </section>
//     </Container>
//   );
// };

// export default ProfilePage;
