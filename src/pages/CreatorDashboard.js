import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Nav, Modal, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaPlay, FaEdit, FaTrash, FaMusic, FaCompactDisc, FaList, FaPlus, FaSync } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AlbumCard from '../components/cards/AlbumCard';
import PlaylistCard from '../components/cards/PlaylistCard';
import '../styles/PlayButton.css';

// Default placeholder image - using a reliable source
const DEFAULT_PLACEHOLDER = 'https://placehold.co/300x300';

// Simple global cache for component data
const DASHBOARD_CACHE = {
  tracks: [],
  albums: [],
  playlists: [],
  hasInitialData: false
};

const CreatorDashboard = ({ section, playTrack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(section || 'my-tracks');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Data states
  const [myTracks, setMyTracks] = useState(DASHBOARD_CACHE.tracks);
  const [myPlaylists, setMyPlaylists] = useState(DASHBOARD_CACHE.playlists);
  const [myAlbums, setMyAlbums] = useState(DASHBOARD_CACHE.albums);
  const [isLoading, setIsLoading] = useState({
    tracks: !DASHBOARD_CACHE.tracks.length,
    albums: !DASHBOARD_CACHE.albums.length,
    playlists: !DASHBOARD_CACHE.playlists.length
  });
  const [errors, setErrors] = useState({
    tracks: null,
    albums: null,
    playlists: null,
    general: null
  });
  
  // For preventing duplicate fetches
  const fetchingRef = useRef({
    tracks: false,
    albums: false,
    playlists: false
  });
  
  // Update section based on props
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    }
  }, [section]);

  // Update cache when state changes
  useEffect(() => {
    if (myTracks.length > 0) {
      DASHBOARD_CACHE.tracks = myTracks;
    }
  }, [myTracks]);

  useEffect(() => {
    if (myAlbums.length > 0) {
      DASHBOARD_CACHE.albums = myAlbums;
    }
  }, [myAlbums]);

  useEffect(() => {
    if (myPlaylists.length > 0) {
      DASHBOARD_CACHE.playlists = myPlaylists;
    }
  }, [myPlaylists]);

  // Simplified data fetching functions
  const fetchTracks = useCallback(async (showLoading = true) => {
    if (!user?.id || fetchingRef.current.tracks) return;

    try {
      fetchingRef.current.tracks = true;
      
      if (showLoading) {
        setIsLoading(prev => ({ ...prev, tracks: true }));
      }
      
      setErrors(prev => ({ ...prev, tracks: null }));
      
      // Add a slight delay before making the request to avoid concurrent API calls
      // This helps prevent rate limiting by spreading out requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await api.get(`/api/tracks/by-user/${user.id}`);
      const data = response?.data || [];
      
      setMyTracks(data);
      DASHBOARD_CACHE.tracks = data;
      DASHBOARD_CACHE.hasInitialData = true;
      
      return data;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      
      // Check for rate limit error (HTTP 429)
      if (error.response && error.response.status === 429) {
        // Return existing data if available, display friendly error if not
        setErrors(prev => ({
          ...prev,
          tracks: 'Too many requests. Using cached data or please try again later.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          tracks: 'Failed to load tracks. Please try again.'
        }));
      }
      
      // Return existing data on error
      return DASHBOARD_CACHE.tracks;
    } finally {
      // Allow some time before enabling the next fetch
      setTimeout(() => {
        setIsLoading(prev => ({ ...prev, tracks: false }));
        fetchingRef.current.tracks = false;
      }, 500);
    }
  }, [user]);

  const fetchAlbums = useCallback(async (showLoading = true) => {
    if (!user?.id || fetchingRef.current.albums) return;

    try {
      fetchingRef.current.albums = true;
      
      if (showLoading) {
        setIsLoading(prev => ({ ...prev, albums: true }));
      }
      
      setErrors(prev => ({ ...prev, albums: null }));
      
      // Add a slight delay before making the request to avoid concurrent API calls
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const response = await api.get(`/api/albums/user/${user.id}`);
      const data = response?.data || [];
      
      setMyAlbums(data);
      DASHBOARD_CACHE.albums = data;
      DASHBOARD_CACHE.hasInitialData = true;
      
      return data;
    } catch (error) {
      console.error('Error fetching albums:', error);
      
      // Check for rate limit error
      if (error.response && error.response.status === 429) {
        setErrors(prev => ({
          ...prev,
          albums: 'Too many requests. Using cached data or please try again later.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          albums: 'Failed to load albums. Please try again.'
        }));
      }
      
      // Return existing data on error
      return DASHBOARD_CACHE.albums;
    } finally {
      // Allow some time before enabling the next fetch
      setTimeout(() => {
        setIsLoading(prev => ({ ...prev, albums: false }));
        fetchingRef.current.albums = false;
      }, 500);
    }
  }, [user]);

  const fetchPlaylists = useCallback(async (showLoading = true) => {
    if (!user?.id || fetchingRef.current.playlists) return;

    try {
      fetchingRef.current.playlists = true;
      
      if (showLoading) {
        setIsLoading(prev => ({ ...prev, playlists: true }));
      }
      
      setErrors(prev => ({ ...prev, playlists: null }));
      
      // Add a slight delay before making the request to avoid concurrent API calls
      await new Promise(resolve => setTimeout(resolve, 900));
      
      const response = await api.get(`/api/playlists/user/${user.id}`);
      const data = response?.data || [];
      
      setMyPlaylists(data);
      DASHBOARD_CACHE.playlists = data;
      DASHBOARD_CACHE.hasInitialData = true;
      
      return data;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      
      // Check for rate limit error
      if (error.response && error.response.status === 429) {
        setErrors(prev => ({
          ...prev,
          playlists: 'Too many requests. Using cached data or please try again later.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          playlists: 'Failed to load playlists. Please try again.'
        }));
      }
      
      // Return existing data on error
      return DASHBOARD_CACHE.playlists;
    } finally {
      // Allow some time before enabling the next fetch
      setTimeout(() => {
        setIsLoading(prev => ({ ...prev, playlists: false }));
        fetchingRef.current.playlists = false;
      }, 500);
    }
  }, [user]);

  // Load content based on active section
  useEffect(() => {
    if (!user) return;
    
    let mounted = true;
    let loadingTimeout = null;
    
    const loadSectionData = async () => {
      try {
        switch (activeSection) {
          case 'my-tracks':
            if (mounted && (!DASHBOARD_CACHE.tracks.length || !DASHBOARD_CACHE.hasInitialData)) {
              await fetchTracks(true);
            } else if (mounted) {
              // Background refresh with no loading indicator
              // Use setTimeout to delay the refresh and avoid rate limiting
              loadingTimeout = setTimeout(() => fetchTracks(false), 2000);
            }
            break;
            
          case 'my-albums':
            if (mounted && (!DASHBOARD_CACHE.albums.length || !DASHBOARD_CACHE.hasInitialData)) {
              await fetchAlbums(true);
            } else if (mounted) {
              // Background refresh with no loading indicator
              loadingTimeout = setTimeout(() => fetchAlbums(false), 2000);
            }
            break;
            
          case 'my-playlists':
            if (mounted && (!DASHBOARD_CACHE.playlists.length || !DASHBOARD_CACHE.hasInitialData)) {
              await fetchPlaylists(true);
            } else if (mounted) {
              // Background refresh with no loading indicator
              loadingTimeout = setTimeout(() => fetchPlaylists(false), 2000);
            }
            break;
            
          case 'all':
            // Load data for all sections in a staggered pattern
            if (mounted) {
              // First, check for initial data
              const needTracks = !DASHBOARD_CACHE.tracks.length || !DASHBOARD_CACHE.hasInitialData;
              const needAlbums = !DASHBOARD_CACHE.albums.length || !DASHBOARD_CACHE.hasInitialData;
              const needPlaylists = !DASHBOARD_CACHE.playlists.length || !DASHBOARD_CACHE.hasInitialData;
              
              // Load initial data with loading indicators
              if (needTracks) {
                await fetchTracks(true);
              }
              
              // Stagger the requests to avoid rate limiting
              if (needAlbums) {
                setTimeout(async () => {
                  if (mounted) await fetchAlbums(true);
                }, 1000);
        }
        
              if (needPlaylists) {
                setTimeout(async () => {
                  if (mounted) await fetchPlaylists(true);
                }, 2000);
              }
              
              // Refresh data without loading indicators
              if (!needTracks) {
                loadingTimeout = setTimeout(() => {
                  if (mounted) fetchTracks(false);
                }, 3000);
              }
              
              if (!needAlbums) {
                loadingTimeout = setTimeout(() => {
                  if (mounted) fetchAlbums(false);
                }, 5000);
              }
              
              if (!needPlaylists) {
                loadingTimeout = setTimeout(() => {
                  if (mounted) fetchPlaylists(false);
                }, 7000);
              }
            }
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error('Error loading section data:', error);
        if (mounted) {
          setErrors(prev => ({
            ...prev,
            general: 'Failed to load content. Please try again.'
          }));
        }
      }
    };
    
    loadSectionData();
    
    return () => {
      mounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [user, activeSection, fetchTracks, fetchAlbums, fetchPlaylists]);

  // Handle navigation between sections
  const handleSectionChange = (sectionKey) => {
    setActiveSection(sectionKey);
    navigate(`/creator-dashboard/${sectionKey}`);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    switch (activeSection) {
      case 'my-tracks':
        fetchTracks(true);
        break;
      case 'my-albums':
        fetchAlbums(true);
        break;
      case 'my-playlists':
        fetchPlaylists(true);
        break;
      case 'all':
        fetchTracks(true);
        fetchAlbums(true);
        fetchPlaylists(true);
        break;
      default:
        break;
    }
  };

  // Delete confirmation handlers
  const confirmDelete = (item, type) => {
    setItemToDelete({ item, type });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    const { item, type } = itemToDelete;
    
    try {
      switch (type) {
        case 'track':
          await api.delete(`/api/tracks/${item.TrackID || item.id}`);
          setMyTracks(myTracks.filter(track => (track.TrackID || track.id) !== (item.TrackID || item.id)));
          break;
        case 'album':
          await api.delete(`/api/albums/${item.AlbumID || item.id}`);
          setMyAlbums(myAlbums.filter(album => (album.AlbumID || album.id) !== (item.AlbumID || item.id)));
          break;
        case 'playlist':
          await api.delete(`/api/playlists/${item.PlaylistID || item.id}`);
          setMyPlaylists(myPlaylists.filter(playlist => (playlist.PlaylistID || playlist.id) !== (item.PlaylistID || item.id)));
          break;
        default:
          throw new Error('Unknown item type');
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      setErrors(prev => ({
        ...prev,
        general: `Failed to delete ${type}. Please try again.`
      }));
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Safely get cover image or return default placeholder
  const getCoverImage = (imageUrl) => {
    if (!imageUrl) return DEFAULT_PLACEHOLDER;
    
    // Handle relative server paths
    if (!imageUrl.startsWith('http')) {
      return `http://localhost:5001/${imageUrl.replace(/^\/+/, '')}`;
    }
    
    return imageUrl;
  };

  // Add this function to handle album playback
  const handlePlayAlbum = (album) => {
    navigate(`/albums/${album.AlbumID || album.id}?autoplay=true`);
  };

  // Render the appropriate content based on active section
  const renderContent = () => {
    // Show error message if there's a general error
    if (errors.general) {
      return (
        <div className="alert alert-danger">
          {errors.general}
        </div>
      );
    }
    
    switch (activeSection) {
      case 'my-tracks':
        return renderTracks();
      case 'my-albums':
        return renderAlbums();
      case 'my-playlists':
        return renderPlaylists();
      default:
        return (
          <div className="text-center py-5">
            <h3>Please select a section from the navigation menu</h3>
          </div>
        );
    }
  };

  // Render tracks section
  const renderTracks = () => {
    if (isLoading.tracks) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading tracks...</span>
          </Spinner>
          <p className="mt-3">Loading your tracks...</p>
        </div>
      );
    }
    
    if (errors.tracks) {
      return (
        <div className="alert alert-danger">
          {errors.tracks}
          <div className="mt-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => fetchTracks(true)}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    
        return (
          <section>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>My Tracks</h2>
          <div>
            <Button variant="outline-secondary" className="me-2" onClick={() => fetchTracks(true)}>
              <FaSync className="me-1" /> Refresh
            </Button>
              <Button variant="success" as={Link} to="/upload">
                <FaPlus className="me-2" /> Upload New Track
              </Button>
          </div>
            </div>
            
            {myTracks.length === 0 ? (
              <div className="text-center py-5">
                <p>You haven't uploaded any tracks yet.</p>
                <Button variant="primary" as={Link} to="/upload">
                  Upload Your First Track
                </Button>
              </div>
            ) : (
              <Card className="shadow-sm">
                <Card.Body>
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Duration</th>
                        <th>Plays</th>
                        <th>Upload Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTracks.map((track, index) => (
                        <tr key={track.TrackID || track.id}>
                          <td>{index + 1}</td>
                          <td>{track.Title || track.title}</td>
                          <td>{formatDuration(track.Duration || track.duration)}</td>
                          <td>{track.PlayCount || 0}</td>
                          <td>{formatDate(track.CreatedAt || track.uploadDate)}</td>
                          <td>
                        <div className="action-buttons-container">
                          <Button 
                            variant="success" 
                            className="creator-action-btn me-2"
                            onClick={() => playTrack && playTrack(track, myTracks)}
                          >
                                <FaPlay />
                              </Button>
                              <Button 
                                variant="primary" 
                                className="creator-action-btn me-2"
                                as={Link}
                                to={`/edit-track/${track.TrackID || track.id}`}
                              >
                                <FaEdit />
                              </Button>
                              <Button 
                                variant="danger" 
                                className="creator-action-btn"
                                onClick={() => confirmDelete(track, 'track')}
                              >
                                <FaTrash />
                              </Button>
                        </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card.Body>
              </Card>
            )}
          </section>
        );
  };

  // Render albums section
  const renderAlbums = () => {
    if (isLoading.albums) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading albums...</span>
          </Spinner>
          <p className="mt-3">Loading your albums...</p>
        </div>
      );
    }
    
    if (errors.albums) {
      return (
        <div className="alert alert-danger">
          {errors.albums}
          <div className="mt-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => fetchAlbums(true)}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    
        return (
          <section>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>My Albums</h2>
          <div>
            <Button variant="outline-secondary" className="me-2" onClick={() => fetchAlbums(true)}>
              <FaSync className="me-1" /> Refresh
            </Button>
              <Button variant="success" as={Link} to="/upload-album">
                <FaPlus className="me-2" /> Create New Album
              </Button>
          </div>
            </div>
            
            {myAlbums.length === 0 ? (
              <div className="text-center py-5">
                <p>You haven't created any albums yet.</p>
                <Button variant="primary" as={Link} to="/upload-album">
                  Create Your First Album
                </Button>
              </div>
            ) : (
              <Row>
                {myAlbums.map(album => (
                  <Col md={3} key={album.AlbumID || album.id} className="mb-4">
                    <AlbumCard album={album} onPlayClick={handlePlayAlbum} />
                  </Col>
                ))}
              </Row>
            )}
          </section>
        );
  };

  // Render playlists section
  const renderPlaylists = () => {
    if (isLoading.playlists) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading playlists...</span>
          </Spinner>
          <p className="mt-3">Loading your playlists...</p>
        </div>
      );
    }
    
    if (errors.playlists) {
      return (
        <div className="alert alert-danger">
          {errors.playlists}
          <div className="mt-2">
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => fetchPlaylists(true)}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    
        return (
          <section>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>My Playlists</h2>
          <div>
            <Button variant="outline-secondary" className="me-2" onClick={() => fetchPlaylists(true)}>
              <FaSync className="me-1" /> Refresh
            </Button>
              <Button variant="success" as={Link} to="/create-playlist">
                <FaPlus className="me-2" /> Create New Playlist
              </Button>
          </div>
            </div>
            
            {myPlaylists.length === 0 ? (
              <div className="text-center py-5">
                <p>You haven't created any playlists yet.</p>
                <Button variant="primary" as={Link} to="/create-playlist">
                  Create Your First Playlist
                </Button>
              </div>
            ) : (
              <Row>
                {myPlaylists.map(playlist => (
                  <Col md={3} key={playlist.PlaylistID || playlist.id} className="mb-4">
                    <PlaylistCard 
                      playlist={{
                        ...playlist,
                        Title: playlist.Title || playlist.title,
                        PlaylistID: playlist.PlaylistID || playlist.id,
                        CoverURL: playlist.CoverURL || playlist.CoverUrl || playlist.image,
                        TrackCount: playlist.TrackCount || playlist.tracks || 0,
                        CreatorName: user?.username || 'You'
                      }} 
                      onPlayClick={() => navigate(`/playlists/${playlist.PlaylistID || playlist.id}?autoplay=true`)}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </section>
        );
  };

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h3>Please log in to access your creator dashboard</h3>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Creator Dashboard</h1>
      
      {/* Navigation Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            active={activeSection === 'my-tracks'} 
            onClick={() => handleSectionChange('my-tracks')}
          >
            <FaMusic className="me-2" /> My Tracks
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeSection === 'my-albums'} 
            onClick={() => handleSectionChange('my-albums')}
          >
            <FaCompactDisc className="me-2" /> My Albums
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeSection === 'my-playlists'} 
            onClick={() => handleSectionChange('my-playlists')}
          >
            <FaList className="me-2" /> My Playlists
          </Nav.Link>
        </Nav.Item>
      </Nav>
      
      {/* Render the content for the active section */}
      {renderContent()}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {itemToDelete && (
            <p>
              Are you sure you want to delete the {itemToDelete.type} "{itemToDelete.item.Title || itemToDelete.item.title}"? 
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CreatorDashboard; 