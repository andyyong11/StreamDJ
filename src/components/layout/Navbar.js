import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Nav,
  Container,
  Form,
  Button,
  InputGroup,
  Dropdown,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaBell,
  FaUser,
  FaUpload,
  FaSignOutAlt,
  FaMusic,
  FaCompactDisc,
  FaList,
  FaHeadphones,
  FaPlusCircle,
} from 'react-icons/fa';
import logo from '../assets/cdlogo.png';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = ({ onTrackSelect, openLoginModal, openRegisterModal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    playlists: [],
  });

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 1) {
        try {
          const res = await fetch(
            `http://localhost:5001/api/tracks/search-all?query=${encodeURIComponent(query)}`
          );
          const data = await res.json();
          setResults({
            tracks: data.tracks || [],
            artists: data.artists || [],
            playlists: data.playlists || [],
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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="py-2 px-3 shadow-sm" style={{ height: '64px' }}>
      <Container fluid className="d-flex justify-content-between align-items-center">
        {/* Left Section - Logo & Links */}
        <div className="d-flex align-items-center gap-4">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
            <img src={logo} alt="StreamDJ Logo" height="36" />
            <span className="fw-bold fs-5 text-white">StreamDJ</span>
          </Navbar.Brand>
          <Nav className="d-none d-lg-flex gap-3">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/discover">Discover</Nav.Link>
            <Nav.Link as={Link} to="/liveStreams">Live</Nav.Link>
            {user && <Nav.Link as={Link} to="/library">Library</Nav.Link>}
          </Nav>
        </div>

        {/* Center - Search */}
        <Form className="d-none d-lg-block w-50 mx-auto position-relative">
          <InputGroup className="bg-white rounded-pill">
            <Form.Control
              type="search"
              placeholder="Search for tracks, artists, or playlists"
              className="rounded-start-pill border-0 ps-3"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="light" className="rounded-end-pill border-0">
              <FaSearch />
            </Button>
          </InputGroup>

          {(results.tracks.length || results.artists.length || results.playlists.length) > 0 && (
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
                    <div
                      key={`track-${track.TrackID}`}
                      className="mb-2 cursor-pointer"
                      onClick={() => onTrackSelect?.(track)}
                    >
                      <div>
                        <strong>{track.Title}</strong>
                        <div className="text-muted small">{track.Artist}</div>
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

        {/* Right Section - Actions */}
        <div className="d-flex align-items-center gap-3">
          {user ? (
            <>
              <Nav.Link as={Link} to="/upload" className="text-white">
                <FaUpload size={18} />
              </Nav.Link>
              <Nav.Link as={Link} to="/notifications" className="text-white">
                <FaBell size={18} />
              </Nav.Link>
              <Dropdown align="end">
                <Dropdown.Toggle variant="dark" className="p-0 d-flex align-items-center gap-2 bg-transparent border-0">
                  <FaUser size={20} />
                  <span className="d-none d-md-inline text-white">{user.username}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ width: '220px' }}>
                  <Dropdown.Item as={Link} to={`/profile/${user.id}`}>
                    <FaUser className="me-2" /> Profile
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/creator-dashboard" className="fw-bold text-primary">
                    <FaPlusCircle className="me-2" /> Creator Dashboard
                  </Dropdown.Item>
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
              <Button variant="outline-light" size="sm" onClick={openLoginModal}>Sign In</Button>
              <Button variant="light" size="sm" onClick={openRegisterModal}>Sign Up</Button>
            </div>
          )}
        </div>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;