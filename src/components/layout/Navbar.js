import React, { useState } from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUpload } from 'react-icons/fa';
import logo from '../../logo.svg';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from '../auth/UserDropdown';
import './Navbar.css';

const NavigationBar = ({ onTrackSelect }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    playlists: []
  });

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navbar-custom">
      <Container fluid="lg">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img src={logo} alt="StreamDJ Logo" height="30" className="d-inline-block align-top me-2" />
          StreamDJ
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/discover">Discover</Nav.Link>
            <Nav.Link as={Link} to="/library">Library</Nav.Link>
            <Nav.Link as={Link} to="/streams">Live Streams</Nav.Link>
          </Nav>

          <div className="nav-search-container">
            <Form className="d-flex align-items-center position-relative w-100">
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder="Search for tracks, artists, or playlists"
                  aria-label="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                />
                <Button variant="outline-light">
                  <FaSearch />
                </Button>
              </InputGroup>

              {showResults && (results.tracks.length > 0 || results.artists.length > 0 || results.playlists.length > 0) && (
                <div className="search-results-dropdown">
                  {results.tracks.length > 0 && (
                    <div className="results-section">
                      <h6 className="results-title">Tracks</h6>
                      {results.tracks.map(track => (
                        <div key={`track-${track.TrackID}`} className="search-result-item" onClick={() => onTrackSelect?.(track)}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="result-title">{track.Title}</div>
                              <div className="result-subtitle">{track.Artist}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.artists.length > 0 && (
                    <div className="results-section">
                      <h6 className="results-title">Artists</h6>
                      {results.artists.map(artist => (
                        <div key={`artist-${artist.UserID}`} className="search-result-item">
                          {artist.Username}
                        </div>
                      ))}
                    </div>
                  )}

                  {results.playlists.length > 0 && (
                    <div className="results-section">
                      <h6 className="results-title">Playlists</h6>
                      {results.playlists.map(playlist => (
                        <div key={`playlist-${playlist.PlaylistID}`} className="search-result-item">
                          <div className="result-title">{playlist.Title}</div>
                          <div className="result-subtitle">by {playlist.Username}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Form>
          </div>

          <div className="user-actions">
            {user ? (
              <>
                <Link to="/upload" className="upload-btn">
                  <FaUpload /> Upload
                </Link>
                <UserDropdown user={user} />
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline-light">
                  Sign In
                </Button>
                <Button as={Link} to="/register" variant="success">
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;