/**
 * API Configuration for StreamDJ
 */

// Base API URL (from environment variable or fallback to relative URL to avoid CORS)
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Media URLs - for accessing uploaded files
export const MEDIA_BASE_URL = `${API_BASE_URL}/uploads`;

// Absolute URLs for when we need to use the full server path
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';

// Common API endpoints
export const API_ENDPOINTS = {
  // Authentication
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  
  // User endpoints
  users: '/api/users',
  user: (id) => `/api/users/${id}`,
  topUsers: '/api/users/top',
  recentListens: (userId) => `/api/users/${userId}/recent-listens`,
  
  // Tracks
  tracks: '/api/tracks',
  track: (id) => `/api/tracks/${id}`,
  likedTracks: (userId) => `/api/tracks/liked/${userId}`,
  popularTracks: '/api/tracks/popular',
  
  // Playlists
  playlists: '/api/playlists',
  playlist: (id) => `/api/playlists/${id}`,
  userPlaylists: (userId) => `/api/playlists/user/${userId}`,
  featuredPlaylists: '/api/playlists/featured',
  playlistCoverArt: (id) => `/api/playlists/${id}/cover-art`,
  
  // Albums 
  albums: '/api/albums',
  album: (id) => `/api/albums/${id}`,
  userAlbums: (userId) => `/api/albums/user/${userId}`,
  popularAlbums: '/api/albums/popular',
  
  // Streaming
  streams: '/api/streams',
  stream: (id) => `/api/streams/${id}`,
  activeStreams: '/api/streams/active',
  
  // Recommendations
  trending: '/api/trending',
  recommendations: (userId) => `/api/recommendations/${userId}`,
  collabRecommendations: (userId) => `/api/recommendations/collab/${userId}`,
  genreRecommendations: (userId) => `/api/recommendations/recent-genre/${userId}`,
};

// Default request timeout in milliseconds
export const DEFAULT_TIMEOUT = 15000;

// Formatting helpers
export const formatApiUrl = (endpoint) => {
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// Format media URLs with proper server URL for images
export const formatMediaUrl = (path) => {
  if (!path) return null;
  
  // If it's already a complete URL, just return it
  if (path.startsWith('http')) return path;
  
  // If we're on the server domain or using a proxy, we can use relative URLs
  // Otherwise, use the full server URL for images
  
  // For proxy setup in development, we use relative URLs which will be proxied
  if (process.env.NODE_ENV === 'development') {
    return `/${path.replace(/^\/+/, '')}`;
  }
  
  // In production, use the full server URL unless we're configured not to
  return `${SERVER_URL}/${path.replace(/^\/+/, '')}`;
};

export default {
  API_BASE_URL,
  MEDIA_BASE_URL,
  SERVER_URL,
  API_ENDPOINTS,
  DEFAULT_TIMEOUT,
  formatApiUrl,
  formatMediaUrl
}; 