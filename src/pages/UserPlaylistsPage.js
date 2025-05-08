import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import PlaylistCard from '../components/cards/PlaylistCard';

const UserPlaylistsPage = () => {
  const { userId } = useParams(); // If viewing another user's playlists
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isOwnProfile = !userId || (user && userId === user.id.toString());

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const endpoint = userId 
          ? `http://localhost:5001/api/playlists/user/${userId}`
          : 'http://localhost:5001/api/playlists/my-playlists';
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        
        const data = await response.json();
        setPlaylists(data);
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaylists();
  }, [userId, user]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading playlists...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isOwnProfile ? 'My Playlists' : "User's Playlists"}</h1>
        
        {isOwnProfile && (
          <Button variant="primary" onClick={() => navigate('/create-playlist')}>
            <FaPlus className="me-2" /> Create New Playlist
          </Button>
        )}
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {isOwnProfile && (
        <Alert variant="info" className="mb-4">
          To manage or delete your playlists, please visit the Creator Dashboard section.
        </Alert>
      )}
      
      {playlists.length === 0 ? (
        <div className="text-center py-5">
          <h3>No playlists found</h3>
          {isOwnProfile && (
            <div className="mt-3">
              <Button variant="primary" onClick={() => navigate('/create-playlist')}>
                Create Your First Playlist
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Row>
          {playlists.map(playlist => (
            <Col md={3} sm={6} key={playlist.PlaylistID} className="mb-4">
              <PlaylistCard
                playlist={playlist}
                onPlayClick={() => navigate(`/playlists/${playlist.PlaylistID}?autoplay=true`)}
                showDelete={false}
              />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default UserPlaylistsPage; 