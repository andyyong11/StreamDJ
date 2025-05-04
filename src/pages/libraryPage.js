import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaCompactDisc, FaList } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LibraryPage = ({ section, onTrackSelect }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(section || 'liked-tracks');
  
  // Data states
  const [likedTracks, setLikedTracks] = useState([]);
  const [likedAlbums, setLikedAlbums] = useState([]);
  const [likedPlaylists, setLikedPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    }
  }, [section]);

  // Fetch user's liked content when component mounts or user/activeSection changes
  useEffect(() => {
    if (!user) return;
    
    const fetchLikedContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Only fetch data for the active section to minimize requests
        if (activeSection === 'liked-tracks' || activeSection === 'all') {
          const tracksResponse = await axios.get(`/api/tracks/liked/${user.id}`);
          setLikedTracks(tracksResponse.data);
        }
        
        if (activeSection === 'liked-albums' || activeSection === 'all') {
          const albumsResponse = await axios.get(`/api/albums/liked/${user.id}`);
          setLikedAlbums(albumsResponse.data);
        }
        
        if (activeSection === 'liked-playlists' || activeSection === 'all') {
          const playlistsResponse = await axios.get(`/api/public-playlists/liked/${user.id}`);
          setLikedPlaylists(playlistsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching liked content:', err);
        setError('Failed to load your library. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLikedContent();
  }, [user, activeSection]);

  // Handle navigation between sections
  const handleSectionChange = (sectionKey) => {
    setActiveSection(sectionKey);
    navigate(`/${sectionKey}`);
  };

  // Handle unlike/remove from library
  const handleUnlike = async (itemId, type) => {
    try {
      switch (type) {
        case 'track':
          await axios.delete(`/api/tracks/${itemId}/like`, { data: { userId: user.id } });
          setLikedTracks(likedTracks.filter(track => (track.TrackID || track.id) !== itemId));
          break;
        case 'album':
          await axios.delete(`/api/albums/${itemId}/like`, { data: { userId: user.id } });
          setLikedAlbums(likedAlbums.filter(album => (album.AlbumID || album.id) !== itemId));
          break;
        case 'playlist':
          await axios.delete(`/api/playlists/${itemId}/like`, { data: { userId: user.id } });
          setLikedPlaylists(likedPlaylists.filter(playlist => (playlist.PlaylistID || playlist.id) !== itemId));
          break;
        default:
          throw new Error('Unknown item type');
      }
    } catch (err) {
      console.error(`Error unliking ${type}:`, err);
      setError(`Failed to unlike ${type}. Please try again.`);
    }
  };

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render the appropriate content based on active section
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your library...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      );
    }
    
    switch (activeSection) {
      case 'liked-tracks':
        return (
          <section>
            <h2 className="mb-4">Liked Tracks</h2>
            
            {likedTracks.length === 0 ? (
              <div className="text-center py-5">
                <p>You haven't liked any tracks yet.</p>
                <Button variant="primary" as={Link} to="/discover">
                  Discover Tracks
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
                        <th>Artist</th>
                        <th>Duration</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {likedTracks.map((track, index) => (
                        <tr key={track.TrackID || track.id}>
                          <td>{index + 1}</td>
                          <td>{track.Title || track.title}</td>
                          <td>{track.Artist || track.artist}</td>
                          <td>{formatDuration(track.Duration || track.duration)}</td>
                          <td>
                            <Button 
                              variant="success" 
                              size="sm" 
                              className="me-2"
                              onClick={() => {
                                if (typeof onTrackSelect === 'function') {
                                  onTrackSelect(track);
                                }
                              }}
                            >
                              <FaPlay />
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleUnlike(track.TrackID || track.id, 'track')}
                            >
                              <FaHeart />
                            </Button>
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
        
      case 'liked-albums':
        return (
          <section>
            <h2 className="mb-4">Liked Albums</h2>
            
            {likedAlbums.length === 0 ? (
              <div className="text-center py-5">
                <p>You haven't liked any albums yet.</p>
                <Button variant="primary" as={Link} to="/discover">
                  Discover Albums
                </Button>
              </div>
            ) : (
              <Row>
                {likedAlbums.map(album => (
                  <Col md={3} key={album.AlbumID || album.id} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Img 
                        variant="top" 
                        src={album.CoverArtUrl || album.image || 'https://via.placeholder.com/300'} 
                        alt={album.Title || album.title}
                      />
                      <Card.Body>
                        <Card.Title>{album.Title || album.title}</Card.Title>
                        <Card.Text>
                          By {album.Artist || album.artist} • {album.TrackCount || album.tracks || 0} tracks
                        </Card.Text>
                        <div className="d-flex justify-content-between">
                          <Button 
                            variant="success" 
                            size="sm"
                            as={Link}
                            to={`/albums/${album.AlbumID || album.id}`}
                          >
                            <FaPlay className="me-1" /> Play
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleUnlike(album.AlbumID || album.id, 'album')}
                          >
                            <FaHeart />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </section>
        );
        
      case 'liked-playlists':
        return (
          <section>
            <h2 className="mb-4">Liked Playlists</h2>
            
            {likedPlaylists.length === 0 ? (
              <div className="text-center py-5">
                <p>You haven't liked any playlists yet.</p>
                <Button variant="primary" as={Link} to="/discover">
                  Discover Playlists
                </Button>
              </div>
            ) : (
              <Row>
                {likedPlaylists.map(playlist => (
                  <Col md={3} key={playlist.PlaylistID || playlist.id} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Img 
                        variant="top" 
                        src={playlist.CoverUrl || playlist.image || 'https://via.placeholder.com/300'} 
                        alt={playlist.Title || playlist.title}
                      />
                      <Card.Body>
                        <Card.Title>{playlist.Title || playlist.title}</Card.Title>
                        <Card.Text>
                          By {playlist.CreatorName || playlist.creator} • {playlist.TrackCount || playlist.tracks || 0} tracks
                        </Card.Text>
                        <div className="d-flex justify-content-between">
                          <Button 
                            variant="success" 
                            size="sm"
                            as={Link}
                            to={`/playlist/${playlist.PlaylistID || playlist.id}`}
                          >
                            <FaPlay className="me-1" /> Play
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleUnlike(playlist.PlaylistID || playlist.id, 'playlist')}
                          >
                            <FaHeart />
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </section>
        );
        
      default:
        return (
          <section className="text-center py-5">
            <h3>Please select a section from the navigation menu</h3>
          </section>
        );
    }
  };

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <h3>Please log in to view your library</h3>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">My Library</h1>
      
      {/* Navigation Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            active={activeSection === 'liked-tracks'} 
            onClick={() => handleSectionChange('liked-tracks')}
          >
            <FaMusic className="me-2" /> Liked Tracks
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeSection === 'liked-albums'} 
            onClick={() => handleSectionChange('liked-albums')}
          >
            <FaCompactDisc className="me-2" /> Liked Albums
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeSection === 'liked-playlists'} 
            onClick={() => handleSectionChange('liked-playlists')}
          >
            <FaList className="me-2" /> Liked Playlists
          </Nav.Link>
        </Nav.Item>
      </Nav>
      
      {/* Render the content for the active section */}
      {renderContent()}
    </Container>
  );
};

export default LibraryPage;
