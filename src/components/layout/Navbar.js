import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaUser, FaUpload, FaSignOutAlt } from 'react-icons/fa';
import logo from '../../logo.svg';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = ({ onTrackSelect }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    playlists: []
  });

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 1) {
        try {
          const res = await fetch(`http://localhost:5001/api/tracks/search-all?query=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults({
            tracks: data.tracks || [],
            artists: data.artists || [],
            playlists: data.playlists || []
          });
        } catch (err) {
          console.error('Search error:', err);
          setResults({ tracks: [], artists: [], playlists: [] });
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
                <Nav.Link as={Link} to="/library">Library</Nav.Link>
                <Nav.Link as={Link} to="/upload"><FaUpload className="me-1" /> Upload</Nav.Link>
              </>
            )}
            <Nav.Link as={Link} to="/liveStreams">Live Streams</Nav.Link>
            {user && (
              <Nav.Link as={Link} to="/upload:id">
                <FaUpload className="me-1" />
                Upload Music
              </Nav.Link>
            )}
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
                <FaSearch />
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
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to={`/profile/${user.id}`}>
                      <FaUser className="me-2" /> Profile
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" /> Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Button as={Link} to="/login" variant="outline-light" size="sm">
                  Sign In
                </Button>
                <Button as={Link} to="/register" variant="primary" size="sm">
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