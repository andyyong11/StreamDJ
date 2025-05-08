import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaUser, FaUpload, FaSignOutAlt, FaMusic, FaCompactDisc, FaList, FaHeadphones, FaPlusCircle } from 'react-icons/fa';
import logo from '../../logo.svg';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NavigationBar = ({ onTrackSelect, openLoginModal, openRegisterModal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    playlists: []
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 1) {
        setIsSearching(true);
        try {
          // Force fresh search results by adding a cache control parameter
          const timestamp = Date.now();
          // Always fetch fresh results by using the API service with cache bypass
          api.clearCacheFor('/api/tracks/search-all');
          
          const response = await api.get(`/api/tracks/search-all?query=${encodeURIComponent(query)}&_t=${timestamp}`);
          
          setResults({
            tracks: response?.data?.tracks || [],
            artists: response?.data?.artists || [],
            playlists: response?.data?.playlists || []
          });
        } catch (err) {
          console.error('Search error:', err);
          setResults({ tracks: [], artists: [], playlists: [] });
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults({ tracks: [], artists: [], playlists: [] });
      }
    };

    const delay = setTimeout(fetchResults, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleLogout = async () => {
    try {
      await logout();
      // Don't navigate, just let the component re-render with the new auth state
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 position-relative">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img src={logo} alt="StreamDJ Logo" height="30" className="d-inline-block align-top me-2" />
          StreamDJ
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/discover">Discover</Nav.Link>
            {user && (
              <>
                <Nav.Link as={Link} to="/library/:id"><FaHeadphones className="me-1" /> Library</Nav.Link>
                <Nav.Link as={Link} to="/upload"><FaUpload className="me-1" /> Upload</Nav.Link>
              </>
            )}
            <Nav.Link as={Link} to="/liveStreams">Live Streams</Nav.Link>
          </Nav>

          <Form className="d-flex mx-auto position-relative" style={{ width: '40%' }}>
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search for tracks, artists, or playlists"
                aria-label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button variant="outline-light">
                {isSearching ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <FaSearch />
                )}
              </Button>
            </InputGroup>

            {(results?.tracks?.length || results?.artists?.length || results?.playlists?.length) > 0 && (
              <div className="position-absolute bg-white text-dark p-2 rounded shadow" style={{
                top: '100%',
                left: 0,
                width: '100%',
                zIndex: 1050,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {results.tracks.length > 0 && (
                  <>
                    <div className="fw-bold mb-1">🎵 Tracks</div>
                    {results.tracks.map(track => (
                      <div key={`track-${track.TrackID}`} className="mb-2 cursor-pointer" onClick={() => onTrackSelect?.(track)}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{track.Title}</strong>
                            <div className="text-muted small">{track.Artist}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {results.artists.length > 0 && (
                  <>
                    <div className="fw-bold mt-2 mb-1">👤 Artists</div>
                    {results.artists.map(artist => (
                      <div key={`artist-${artist.UserID}`} className="mb-2 border-bottom pb-1">
                        {artist.Username}
                      </div>
                    ))}
                  </>
                )}

                {results.playlists.length > 0 && (
                  <>
                    <div className="fw-bold mt-2 mb-1">📂 Playlists</div>
                    {results.playlists.map(playlist => (
                      <div key={`playlist-${playlist.PlaylistID}`} className="mb-2 border-bottom pb-1">
                        <strong>{playlist.Title}</strong><br />
                        <small className="text-muted">User ID: {playlist.UserID}</small>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </Form>

          <Nav>
            {user ? (
              <>
                <Nav.Link as={Link} to="/notifications">
                  <FaBell size={20} />
                </Nav.Link>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="dark" id="user-dropdown" className="d-flex align-items-center">
                    <FaUser size={20} className="me-2" />
                    {user.username}
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ width: '220px' }}>
                    <Dropdown.Item as={Link} to={`/profile/${user.id}`}>
                      <FaUser className="me-2" /> Profile
                    </Dropdown.Item>
                    
                    <Dropdown.Divider />
                    
                    {/* Creator Dashboard Section */}
                    <Dropdown.Item as={Link} to="/creator-dashboard" className="fw-bold text-primary">
                      <FaPlusCircle className="me-2" /> Creator Dashboard
                    </Dropdown.Item>
                    
                    <Dropdown.Divider />
                    
                    {/* Library Section */}
                    <Dropdown.Item as={Link} to="/library" className="fw-bold text-primary">
                      <FaHeadphones className="me-2" /> My Library
                    </Dropdown.Item>
                    <div className="ps-4 pe-2">
                      <Dropdown.Item as={Link} to="/liked-tracks" className="mb-1 py-1">
                        <FaMusic className="me-2" /> Liked Tracks
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/liked-albums" className="mb-1 py-1">
                        <FaCompactDisc className="me-2" /> Liked Albums
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/liked-playlists" className="mb-1 py-1">
                        <FaList className="me-2" /> Liked Playlists
                      </Dropdown.Item>
                    </div>
                    
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" /> Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                </>
            ) : (
              <div className="d-flex gap-2">
                <Button variant="outline-light" size="sm" onClick={openLoginModal}>
                  Sign In
                </Button>
                <Button variant="outline-light" size="sm" onClick={openRegisterModal}>
                  Sign Up
                </Button>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;