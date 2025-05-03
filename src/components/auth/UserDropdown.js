import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaMusic, FaVideo, FaSignOutAlt, FaCaretDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './UserDropdown.css';

const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  // Mobile version - simple links
  const mobileVersion = (
    <div className="profile-links mobile-only">
      <Link to={`/profile/${user.id}`} className="nav-link">
        <FaUser /> Profile
      </Link>
      
      <div className="nav-section-header">My Content</div>
      <Link to="/my-tracks" className="nav-link">
        My Tracks
      </Link>
      <Link to="/albums" className="nav-link">
        My Albums
      </Link>
      <Link to="/my-playlists" className="nav-link">
        My Playlists
      </Link>
      
      <div className="nav-section-header">Liked Content</div>
      <Link to="/liked-tracks" className="nav-link">
        Liked Tracks
      </Link>
      <Link to="/liked-albums" className="nav-link">
        Liked Albums
      </Link>
      <Link to="/liked-playlists" className="nav-link">
        Liked Playlists
      </Link>
      
      <Link to="/dj-console" className="nav-link">
        <FaVideo /> DJ Console
      </Link>
      <button onClick={handleLogout} className="nav-link logout-link">
        <FaSignOutAlt /> Logout
      </button>
    </div>
  );

  // Desktop version - dropdown only
  const desktopVersion = (
    <div className="user-dropdown desktop-only" ref={dropdownRef}>
      <button 
        className="user-dropdown-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="user-avatar">
          {getInitials(user.username)}
        </div>
        <span className="username">{user.username}</span>
        <FaCaretDown className={`dropdown-caret ${isOpen ? 'open' : ''}`} />
      </button>

      <div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
        <Link to={`/profile/${user.id}`} className="dropdown-item">
          <FaUser /> Profile
        </Link>
        
        <div className="dropdown-divider"></div>
        <h6 className="dropdown-header">My Content</h6>
        <Link to="/my-tracks" className="dropdown-item">
          My Tracks
        </Link>
        <Link to="/albums" className="dropdown-item">
          My Albums
        </Link>
        <Link to="/my-playlists" className="dropdown-item">
          My Playlists
        </Link>
        
        <div className="dropdown-divider"></div>
        <h6 className="dropdown-header">Liked Content</h6>
        <Link to="/liked-tracks" className="dropdown-item">
          Liked Tracks
        </Link>
        <Link to="/liked-albums" className="dropdown-item">
          Liked Albums
        </Link>
        <Link to="/liked-playlists" className="dropdown-item">
          Liked Playlists
        </Link>
        
        <div className="dropdown-divider"></div>
        <Link to="/dj-console" className="dropdown-item">
          <FaVideo /> DJ Console
        </Link>
        <button onClick={handleLogout} className="dropdown-item logout">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mobileVersion}
      {desktopVersion}
    </>
  );
};

export default UserDropdown; 

