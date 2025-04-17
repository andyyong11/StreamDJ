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
      <Link to="/library" className="nav-link">
        <FaMusic /> My Library
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
        <Link to="/library" className="dropdown-item">
          <FaMusic /> My Library
        </Link>
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

