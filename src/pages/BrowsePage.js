import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlay, FaPlus, FaSearch, FaTimes, FaBug } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { SERVER_URL } from '../config/apiConfig';
import genreOptions from '../utils/genreOptions';

const BrowsePage = ({ playTrack }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeGenre, setActiveGenre] = useState(null);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [noMatchingTracks, setNoMatchingTracks] = useState(false);
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const playlistId = queryParams.get('addToPlaylist');
  const genreId = queryParams.get('genre');
  
  // For debugging - to see cover art path info
  const [debugMode, setDebugMode] = useState(false);
  
  // Load genres
  useEffect(() => {
    const loadDefaultGenres = async () => {
      try {
        setLoadingGenres(true);
        // Create genre objects from the genreOptions array
        const mappedGenres = genreOptions.map((genre, index) => ({
          GenreID: index + 1,
          Name: genre
        }));
        
        setGenres(mappedGenres);
        
        // Set active genre if provided in URL
        if (genreId) {
          setActiveGenre(parseInt(genreId, 10));
        }
      } catch (err) {
        console.error('Error loading genres:', err);
      } finally {
        setLoadingGenres(false);
      }
    };
    
    loadDefaultGenres();
  }, [genreId]);
  
  useEffect(() => {
    fetchTracks();
  }, [activeGenre]);
  
  const fetchTracks = async () => {
    try {
      setLoading(true);
      setNoMatchingTracks(false);
      let url = `${SERVER_URL}/api/tracks?limit=100`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching tracks: ${response.status}`);
      }
      const data = await response.json();
      
      // Debug: Log track data to examine cover art paths
      console.log('Track data sample:', data.slice(0, 3));
      console.log('Cover art paths:', data.map(track => track.CoverArt).slice(0, 10));
      
      // Debug: Log unique genres from tracks
      const uniqueGenres = [...new Set(data.map(track => track.Genre))];
      console.log('Unique track genres:', uniqueGenres);
      
      // If a genre filter is active, filter tracks client-side
      if (activeGenre) {
        const selectedGenreName = genres.find(g => g.GenreID === activeGenre)?.Name || '';
        console.log('Selected genre:', selectedGenreName);
        
        const filteredTracks = data.filter(track => {
          // Use more strict genre matching to prevent mismatches
          const trackGenre = String(track.Genre || '').toLowerCase().trim();
          const genreName = selectedGenreName.toLowerCase().trim();
          
          // Debug single track genre match
          console.log(`Track: "${track.Title}", Genre: "${trackGenre}", Selected: "${genreName}"`);
          
          // Only match if the track genre contains the exact genre name or vice versa
          // Don't use partial string matching to avoid false positives
          return (
            trackGenre === genreName || // Exact match
            (trackGenre && genreName && (
              // Only accept partial matches if they're at word boundaries
              trackGenre.split(/\s+/).some(word => word === genreName) ||
              genreName.split(/\s+/).some(word => word === trackGenre) ||
              // Or if one is a compound word of the other (e.g., "hip-hop" vs "hip hop")
              genreName.replace('-', ' ') === trackGenre ||
              trackGenre.replace('-', ' ') === genreName
            ))
          );
        });
        
        console.log(`Filtered from ${data.length} to ${filteredTracks.length} tracks`);
        
        // If no tracks match the genre filter, set a flag
        if (filteredTracks.length === 0) {
          setNoMatchingTracks(true);
          setTracks([]);
        } else {
          setTracks(filteredTracks);
        }
      } else {
      setTracks(data);
      }
    } catch (err) {
      console.error('Error loading tracks:', err);
      setError('Failed to load tracks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchTracks();
      return;
    }
    
    try {
      setSearching(true);
      setNoMatchingTracks(false);
      let url = `${SERVER_URL}/api/tracks/search?q=${encodeURIComponent(searchTerm)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error searching tracks: ${response.status}`);
      }
      const data = await response.json();
      
      // If a genre filter is active, filter search results client-side
      if (activeGenre) {
        const selectedGenreName = genres.find(g => g.GenreID === activeGenre)?.Name || '';
        console.log('Search with selected genre:', selectedGenreName);
        
        const filteredTracks = data.filter(track => {
          // Use more strict genre matching to prevent mismatches
          const trackGenre = String(track.Genre || '').toLowerCase().trim();
          const genreName = selectedGenreName.toLowerCase().trim();
          
          // Only match if the track genre contains the exact genre name or vice versa
          // Don't use partial string matching to avoid false positives
          return (
            trackGenre === genreName || // Exact match
            (trackGenre && genreName && (
              // Only accept partial matches if they're at word boundaries
              trackGenre.split(/\s+/).some(word => word === genreName) ||
              genreName.split(/\s+/).some(word => word === trackGenre) ||
              // Or if one is a compound word of the other (e.g., "hip-hop" vs "hip hop")
              genreName.replace('-', ' ') === trackGenre ||
              trackGenre.replace('-', ' ') === genreName
            ))
          );
        });
        
        console.log(`Filtered search from ${data.length} to ${filteredTracks.length} tracks`);
        
        // If no tracks match the genre filter, set a flag
        if (filteredTracks.length === 0) {
          setNoMatchingTracks(true);
          setTracks([]);
        } else {
          setTracks(filteredTracks);
        }
      } else {
      setTracks(data);
      }
    } catch (err) {
      console.error('Error searching tracks:', err);
      setError('Failed to search tracks. Please try again later.');
    } finally {
      setSearching(false);
    }
  };
  
  const addToPlaylist = async (track) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!playlistId) {
      // If no playlist ID was provided, let the user choose from their playlists
      navigate(`/library`);
      return;
    }
    
    try {
      setAddingToPlaylist({ ...addingToPlaylist, [track.TrackID]: true });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${SERVER_URL}/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackId: track.TrackID })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add track to playlist: ${response.status}`);
      }
      
      setSuccessMessage(`"${track.Title}" added to playlist successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding track to playlist:', err);
      setError(`Failed to add track to playlist: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setAddingToPlaylist({ ...addingToPlaylist, [track.TrackID]: false });
    }
  };
  
  const clearGenreFilter = () => {
    setActiveGenre(null);
    setNoMatchingTracks(false);
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('genre');
    navigate(newUrl.pathname + newUrl.search);
  };
  
  const setGenreFilter = (genreId) => {
    setActiveGenre(genreId);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('genre', genreId);
    navigate(newUrl.pathname + newUrl.search);
  };
  
  // Helper function to format image URL
  const formatImageUrl = (coverArtPath) => {
    if (!coverArtPath) {
      console.log('No cover art path provided, using placeholder');
      return 'https://placehold.co/100x100?text=No+Cover';
    }
    
    // If it's already a full URL, return as is
    if (coverArtPath.startsWith('http')) {
      console.log('Full URL detected:', coverArtPath);
      return coverArtPath;
    }
    
    // Check for relative path without beginning slash
    if (coverArtPath.startsWith('uploads/')) {
      const fullUrl = `${SERVER_URL}/${coverArtPath}`;
      console.log(`Formatted image URL (uploads): ${coverArtPath} -> ${fullUrl}`);
      return fullUrl;
    }
    
    // If path already has a slash, don't add another
    const formattedPath = coverArtPath.startsWith('/') 
      ? coverArtPath 
      : `/${coverArtPath}`;
    
    // Final URL
    const fullUrl = `${SERVER_URL}${formattedPath}`;
    console.log(`Formatted image URL: ${coverArtPath} -> ${fullUrl}`);
    return fullUrl;
  };
  
  // Alternative cover image component with multiple fallbacks for better reliability
  const CoverImage = ({ track }) => {
    const [error, setError] = useState(false);
    const fallbackImage = 'https://placehold.co/100x100?text=No+Cover';
    
    // Try different path formats if the default one fails
    const tryAlternativePath = () => {
      if (track.CoverArt) {
        // If current path includes SERVER_URL, try without it
        if (error && track.CoverArt.includes(SERVER_URL)) {
          const relativePath = track.CoverArt.replace(SERVER_URL, '');
          return `${SERVER_URL}/${relativePath.replace(/^\/+/, '')}`;
        }
        
        // Try with uploads prefix if not present
        if (error && !track.CoverArt.includes('uploads/')) {
          return `${SERVER_URL}/uploads/${track.CoverArt.replace(/^\/+/, '')}`;
        }
      }
      
      return fallbackImage;
    };
    
    return (
      <img
        src={error ? tryAlternativePath() : formatImageUrl(track.CoverArt)}
        alt={track.Title}
        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
        onError={(e) => {
          console.log(`Failed to load image for track: ${track.Title}`);
          setError(true);
          e.target.onerror = null; // Prevent infinite error loop
        }}
      />
    );
  };
  
  // Debug component for displaying track info
  const TrackDebugInfo = ({ track }) => {
    if (!debugMode) return null;
    
    const standardUrl = formatImageUrl(track.CoverArt);
    const uploadsUrl = track.CoverArt ? `${SERVER_URL}/uploads/${track.CoverArt.replace(/^\/+/, '')}` : null;
    const directUrl = track.CoverArt ? `${SERVER_URL}${track.CoverArt.startsWith('/') ? '' : '/'}${track.CoverArt}` : null;
    
    return (
      <div className="mt-2 p-2 bg-light rounded small">
        <div className="d-flex gap-3 mb-2">
          <div>
            <strong>Standard Format:</strong><br/>
            <img 
              src={standardUrl} 
              alt="Standard format" 
              style={{width: 50, height: 50, objectFit: 'cover'}}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="mt-1">{standardUrl?.substring(0, 30)}...</div>
          </div>
          
          <div>
            <strong>Uploads Path:</strong><br/>
            <img 
              src={uploadsUrl} 
              alt="Uploads path" 
              style={{width: 50, height: 50, objectFit: 'cover'}}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="mt-1">{uploadsUrl?.substring(0, 30)}...</div>
          </div>
          
          <div>
            <strong>Direct Path:</strong><br/>
            <img 
              src={directUrl} 
              alt="Direct path" 
              style={{width: 50, height: 50, objectFit: 'cover'}}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="mt-1">{directUrl?.substring(0, 30)}...</div>
          </div>
        </div>
        
        <div><strong>Track ID:</strong> {track.TrackID}</div>
        <div><strong>Raw Cover Path:</strong> {track.CoverArt || 'None'}</div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading tracks...</p>
      </Container>
    );
  }
  
  // Find active genre name
  const activeGenreName = activeGenre 
    ? genres.find(g => g.GenreID === activeGenre)?.Name || 'Unknown Genre'
    : null;
  
  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{playlistId ? 'Add Tracks to Playlist' : 'Browse Tracks'}</h1>
        <div>
        {playlistId && (
          <Button 
            variant="outline-primary" 
            onClick={() => navigate(`/playlists/${playlistId}`)}
              className="me-2"
          >
            Back to Playlist
          </Button>
        )}
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => setDebugMode(!debugMode)}
            title="Toggle debug mode"
          >
            <FaBug /> {debugMode ? 'Hide Debug' : 'Debug'}
          </Button>
        </div>
      </div>
      
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Form onSubmit={handleSearch} className="mb-4">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search for tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={searching}>
            {searching ? <Spinner size="sm" animation="border" /> : <FaSearch />}
          </Button>
        </InputGroup>
      </Form>
      
      {/* Genre filters */}
      <div className="mb-4">
        <h5 className="mb-2">Genre Filters:</h5>
        <div className="d-flex flex-wrap gap-2">
          <Button
            variant={activeGenre === null ? "primary" : "outline-primary"}
            size="sm"
            onClick={clearGenreFilter}
          >
            All Genres
          </Button>
          
          {genres.map(genre => (
            <Button
              key={genre.GenreID}
              variant={activeGenre === genre.GenreID ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setGenreFilter(genre.GenreID)}
            >
              {genre.Name}
            </Button>
          ))}
        </div>
      </div>
      
      {activeGenre && (
        <Alert variant="info" className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Filtered by:</strong> {activeGenreName}
          </div>
          <Button variant="outline-info" size="sm" onClick={clearGenreFilter}>
            <FaTimes /> Clear
          </Button>
        </Alert>
      )}
      
      {noMatchingTracks && activeGenre && (
        <Alert variant="warning">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <strong>No tracks found:</strong> There are no tracks with the genre "{activeGenreName}" in the database.
              <p className="mb-0 small mt-1">
                Tip: Some tracks in the system use custom genre names. 
                Try the "All Genres" filter to see all available tracks.
              </p>
            </div>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={clearGenreFilter}
            >
              Show All Tracks
            </Button>
          </div>
        </Alert>
      )}
      
      {tracks.length > 0 ? (
        <Table hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Track</th>
              <th>Artist</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => (
              <React.Fragment key={track.TrackID || index}>
              <tr 
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td style={{ width: '40px' }}>
                  {hoveredRow === index ? (
                    <FaPlay 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => playTrack(track)}
                    />
                  ) : (
                    index + 1
                  )}
                </td>
                <td className="d-flex align-items-center gap-2">
                    <CoverImage track={track} />
                  <span>{track.Title}</span>
                </td>
                  <td>{track.ArtistName || track.Artist || 'Unknown Artist'}</td>
                <td>{track.Duration || '0:00'}</td>
                <td>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => addToPlaylist(track)}
                    disabled={addingToPlaylist[track.TrackID]}
                  >
                    {addingToPlaylist[track.TrackID] ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <>
                        <FaPlus className="me-1" /> 
                        {playlistId ? 'Add to Playlist' : 'Add to Library'}
                      </>
                    )}
                  </Button>
                </td>
              </tr>
                {debugMode && (
                  <tr>
                    <td colSpan={5}>
                      <TrackDebugInfo track={track} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      ) : !noMatchingTracks ? (
        <Alert variant="info">
          {searchTerm ? 'No tracks found matching your search.' : 'No tracks available.'}
          {activeGenre && ' You might want to try a different genre filter.'}
        </Alert>
      ) : null}
    </Container>
  );
};

export default BrowsePage; 