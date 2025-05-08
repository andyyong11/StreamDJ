import React from 'react';
import { FaUser } from 'react-icons/fa';
import { SERVER_URL } from '../../config/apiConfig';

/**
 * ProfileImage component for displaying user profile images consistently across the app
 * 
 * @param {Object} props
 * @param {string} props.src - The source URL of the image
 * @param {string} props.alt - Alt text for the image
 * @param {number} props.size - Size of the image in pixels (default: 120)
 * @param {boolean} props.clickable - Whether the image should have a pointer cursor
 * @param {function} props.onClick - Click handler function
 * @param {boolean} props.showPlaceholder - Whether to show a placeholder icon when no image (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const ProfileImage = ({ 
  src,
  alt = 'User',
  size = 120,
  clickable = false,
  onClick,
  showPlaceholder = true,
  className = ''
}) => {
  // Format image URL properly
  const formatImageUrl = (url) => {
    if (!url) return null;
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's a path to a local image in /images
    if (url.startsWith('/images/')) {
      return url;
    }
    
    // Handle uploads/ prefix
    if (url.startsWith('uploads/')) {
      return `${SERVER_URL}/${url}`;
    }
    
    // Handle paths without uploads/ prefix
    if (!url.startsWith('/')) {
      return `${SERVER_URL}/uploads/${url}`;
    }
    
    // Handle paths with leading slash
    return `${SERVER_URL}${url}`;
  };

  // Handle image loading error
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/Default Profile.png';
  };

  const formattedSrc = formatImageUrl(src);
  
  return (
    <div 
      className={`d-flex justify-content-center ${className}`}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {formattedSrc ? (
        <img
          src={formattedSrc}
          alt={alt}
          className="rounded-circle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'cover',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
          onError={handleImageError}
        />
      ) : showPlaceholder ? (
        <div 
          className="rounded-circle d-flex justify-content-center align-items-center bg-light"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}
        >
          <FaUser style={{ width: '40%', height: '40%' }} className="text-secondary" />
        </div>
      ) : null}
    </div>
  );
};

export default ProfileImage; 