import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaUser, FaUpload } from 'react-icons/fa';
import logo from '../../logo.svg';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    playlists: []
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 1) {
        fetch(`http://localhost:5001/api/tracks/search-all?query=${query}`)
          .then(res => res.json())
          .then(data => setResults(data))
          .catch(err => {
            console.error('Search error:', err);
            setResults({ tracks: [], artists: [], playlists: [] });
          });
      } else {
        setResults({ tracks: [], artists: [], playlists: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

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
            <Nav.Link as={Link} to="/library">Library</Nav.Link>
            <Nav.Link as={Link} to="/liveStreams">Live Streams</Nav.Link>
            <Nav.Link as={Link} to="/upload"><FaUpload className="me-1" /> Upload</Nav.Link>
          </Nav>

          {/* 🔍 Search Input */}
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

            {/* 🔎 Dropdown Results */}
            {/* 🔎 Simplified Dropdown Results */}
            {results.tracks.length > 0 && (
              <div className="position-absolute bg-dark text-white p-2 rounded shadow" style={{
                top: '100%',
                left: 0,
                width: '100%',
                zIndex: 1050,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {results.tracks.map((track, index) => (
                  <div
                    key={track.TrackID}
                    className="d-flex align-items-center py-2 px-3 border-bottom hover-highlight"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const audio = new Audio(`http://localhost:5001/${track.FilePath.replace(/\\/g, '/')}`);
                      audio.play();
                    }}
                  >
                    <span className="me-2">{index + 1}.</span>
                    <div>
                      <strong>{track.Title}</strong><br />
                      <span className="text-muted small">{track.Artist || 'Unknown Artist'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form>

          <Nav>
            <Nav.Link as={Link} to="/notifications">
              <FaBell size={20} />
            </Nav.Link>
            {user ? (
              <Nav.Link as={Link} to={`/profile/${user.id || 1}`}>
                <FaUser size={20} />
              </Nav.Link>
            ) : (
              <Nav.Link as={Link} to="/login">
                <FaUser size={20} />
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;