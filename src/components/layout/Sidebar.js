// components/Sidebar.js
import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaCompass, FaHeadphones, FaUpload, FaBroadcastTower } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/cdlogo.png';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="sidebar text-white d-flex flex-column p-3">
      {/* Logo and App Title */}
      <div className="d-flex align-items-center mb-4">
        <img
          src={logo}
          alt="App Logo"
          className="me-2"
          style={{ width: '40px', height: '40px', borderRadius: '5px' }}
        />
        <span className="fs-5 fw-bold">StreamDJ</span>
      </div>

      {/* Navigation Links */}
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/" className="text-white mb-2">
          <FaHome className="me-2" /> Home
        </Nav.Link>

        <Nav.Link as={Link} to="/discover" className="text-white mb-2">
          <FaCompass className="me-2" /> Discover
        </Nav.Link>

        {user && (
          <>
            <Nav.Link as={Link} to={`/library/${user.id}`} className="text-white mb-2">
              <FaHeadphones className="me-2" /> Library
            </Nav.Link>

            <div className="ms-4 mb-2">
              <Nav.Link as={Link} to="/creator-dashboard/my-tracks" className="text-white small">
                • My Tracks
              </Nav.Link>
              <Nav.Link as={Link} to="/creator-dashboard/my-albums" className="text-white small">
                • My Albums
              </Nav.Link>
              <Nav.Link as={Link} to="/creator-dashboard/my-playlists" className="text-white small">
                • My Playlists
              </Nav.Link>
            </div>

            <Nav.Link as={Link} to="/upload" className="text-white mb-2">
              <FaUpload className="me-2" /> Upload
            </Nav.Link>
          </>
        )}

        <Nav.Link as={Link} to="/liveStreams" className="text-white">
          <FaBroadcastTower className="me-2" /> Live Streams
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;