import React from 'react';
import { SERVER_URL } from '../../config/apiConfig';

/**
 * CoverImage component for displaying cover artwork consistently across the app
 * 
 * @param {Object} props
 * @param {string} props.src - The source URL of the image
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.type - Type of cover: 'album', 'track', 'playlist', 'genre'
 * @param {number} props.width - Width of image container (default 100%)
 * @param {number} props.height - Height of image container (default: 100%)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.rounded - Rounded style: 'sm', 'md', 'lg', 'circle' (default: 'md')
 * @param {function} props.onClick - Click handler function
 * @param {object} props.style - Additional inline styles
 */
const CoverImage = ({ 
  src,
  alt = 'Cover Image',
  type = 'album',
  width = '100%',
  height = '100%',
  className = '',
  rounded = 'md',
  onClick,
  style = {}
}) => {
  // Format image URL properly
  const formatImageUrl = (url, type) => {
    // For debugging
    console.log(`Formatting image URL for ${type}:`, { originalUrl: url });
    
    // Handle null/undefined urls
    if (!url) {
      console.log(`No URL provided for ${type}, using default`);
      
      // Use actual filenames from the directory for default images
      if (type === 'album') {
        return `/images/Default Album.png`;
      } else if (type === 'playlist') {
        return `/images/Default Playlist.png`;
      } else if (type === 'track') {
        return `/images/Default Track.png`;
      } else if (type === 'genre') {
        return `/images/Default Album.png`; // Generic fallback
      }
      
      // Generic fallback for any other type
      return `/images/Default Album.png`;
    }
    
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
    // Log the error for debugging
    console.error(`Image load error for ${type}:`, {
      src: e.target.src,
      error: 'Failed to load image'
    });

    e.target.onerror = null; // Prevent infinite error loop
    
    // Use appropriate fallback image
    if (type === 'album') {
      e.target.src = `/images/Default Album.png`;
    } else if (type === 'playlist') {
      e.target.src = `/images/Default Playlist.png`;
    } else if (type === 'track') {
      e.target.src = `/images/Default Track.png`;
    } else if (type === 'genre') {
      e.target.src = `/images/Default Album.png`;
    } else {
      e.target.src = `/images/Default Album.png`;
    }
  };

  // Calculate rounded values
  const getRoundedClass = () => {
    switch (rounded) {
      case 'sm': return 'rounded';
      case 'lg': return 'rounded-lg';
      case 'circle': return 'rounded-circle';
      case 'md':
      default: return 'rounded-md';
    }
  };

  // Combined style from props and calculated values
  const combinedStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    objectFit: 'cover',
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  return (
    <img
      src={formatImageUrl(src, type)}
      alt={alt}
      className={`${getRoundedClass()} ${className}`}
      style={combinedStyle}
      onError={handleImageError}
      onClick={onClick}
    />
  );
};

export default CoverImage; 