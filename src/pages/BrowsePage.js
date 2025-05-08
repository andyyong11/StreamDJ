import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlay, FaPlus, FaSearch } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const BrowsePage = ({ playTrack }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const playlistId = queryParams.get('addToPlaylist');
  
  useEffect(() => {
    fetchTracks();
  }, []);
  
  const fetchTracks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/tracks?limit=50');
      if (!response.ok) {
        throw new Error(`Error fetching tracks: ${response.status}`);
      }
      const data = await response.json();
      setTracks(data);
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
      const response = await fetch(`http://localhost:5001/api/tracks/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error(`Error searching tracks: ${response.status}`);
      }
      const data = await response.json();
      setTracks(data);
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
      const response = await fetch(`http://localhost:5001/api/playlists/${playlistId}/tracks`, {
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
  
  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{playlistId ? 'Add Tracks to Playlist' : 'Browse Tracks'}</h1>
        {playlistId && (
          <Button 
            variant="outline-primary" 
            onClick={() => navigate(`/playlists/${playlistId}`)}
          >
            Back to Playlist
          </Button>
        )}
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
              <tr 
                key={track.TrackID} 
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
                  <img
                    src={track.CoverArt ? `http://localhost:5001/${track.CoverArt}` : 'https://placehold.co/100x100?text=No+Cover'}
                    alt={track.Title}
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/100x100?text=No+Cover';
                    }}
                  />
                  <span>{track.Title}</span>
                </td>
                <td>{track.ArtistName || 'Unknown Artist'}</td>
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
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="info">
          {searchTerm ? 'No tracks found matching your search.' : 'No tracks available.'}
        </Alert>
      )}
    </Container>
  );
};

export default BrowsePage; 