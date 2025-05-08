// components/Topbar.js
import React, { useState, useEffect } from 'react';
import { Form, Button, InputGroup, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Topbar = ({ onTrackSelect, openLoginModal, openRegisterModal }) => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tracks: [], artists: [], playlists: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 1) {
        setIsSearching(true);
        const timestamp = Date.now();
        api.clearCacheFor('/api/tracks/search-all');
        try {
          const response = await api.get(`/api/tracks/search-all?query=${encodeURIComponent(query)}&_t=${timestamp}`);
          setResults({
            tracks: response?.data?.tracks || [],
            artists: response?.data?.artists || [],
            playlists: response?.data?.playlists || []
          });
        } catch {
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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="topbar d-flex align-items-center justify-content-between px-3 py-2 text-white">
      {/* Search Bar */}
      <Form className="d-flex position-relative flex-grow-1 me-3" style={{ maxWidth: '500px', minWidth: 0 }}>
        <InputGroup className="w-100">
          <Form.Control
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow-1"
            style={{ minWidth: 0 }}
          />
          <Button variant="outline-light">
            {isSearching ? <span className="spinner-border spinner-border-sm" /> : <FaSearch />}
          </Button>
        </InputGroup>

        {/* Search Results Dropdown */}
        {results.tracks.length + results.artists.length + results.playlists.length > 0 && (
          <div className="search-dropdown bg-white text-dark p-2 rounded shadow" style={{ top: '100%', zIndex: 2050 }}>
            {results.tracks.length > 0 && (
              <>
                <div className="fw-bold mb-1">🎵 Tracks</div>
                {results.tracks.map((track) => (
                  <div key={track.TrackID} className="mb-2" onClick={() => onTrackSelect?.(track)}>
                    <strong>{track.Title}</strong> <small className="text-muted">by {track.Artist}</small>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Form>

      {/* User Actions */}
      <div className="d-flex align-items-center gap-3 flex-shrink-0">
        {user ? (
          <>
            <Link to="/notifications" className="text-white">
              <FaBell size={20} />
            </Link>
            <Dropdown align="end">
              <Dropdown.Toggle variant="dark" className="d-flex align-items-center">
                <FaUser className="me-2" />
                <span className="d-none d-sm-inline">{user.username}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to={`/profile/${user.id}`}>Profile</Dropdown.Item>
                <Dropdown.Item as={Link} to="/creator-dashboard">Creator Dashboard</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </>
        ) : (
          <>
            <Button variant="outline-light" size="sm" onClick={openLoginModal}>Sign In</Button>
            <Button variant="outline-light" size="sm" onClick={openRegisterModal}>Sign Up</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Topbar;