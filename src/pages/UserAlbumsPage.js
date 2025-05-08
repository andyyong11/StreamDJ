import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaCompactDisc } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import AlbumCard from '../components/cards/AlbumCard';

const UserAlbumsPage = () => {
  const { userId } = useParams(); // If viewing another user's albums
  const navigate = useNavigate();
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Determine if this is the current user's album collection
  const isCurrentUser = user && (!userId || user.id === parseInt(userId));
  const targetUserId = userId || (user ? user.id : null);
  
  // Handle playing an album
  const handlePlayAlbum = (album) => {
    navigate(`/albums/${album.AlbumID}?autoplay=true`);
  };
  
  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/albums/user/${targetUserId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch albums');
        }
        
        const albumsData = await response.json();
        setAlbums(albumsData);
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlbums();
  }, [targetUserId]);
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading albums...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Albums</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }
  
  if (!targetUserId) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Authentication Required</Alert.Heading>
          <p>Please log in to view albums.</p>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isCurrentUser ? 'My Albums' : 'User Albums'}</h2>
        
        {isCurrentUser && (
          <Button 
            variant="success" 
            onClick={() => navigate('/upload-album')}
          >
            <FaPlus className="me-2" /> Create New Album
          </Button>
        )}
      </div>
      
      {albums.length === 0 ? (
        <Alert variant="info">
          <Alert.Heading>No Albums Found</Alert.Heading>
          <p>
            {isCurrentUser 
              ? "You haven't created any albums yet. Click 'Create New Album' to get started." 
              : "This user hasn't created any albums yet."}
          </p>
        </Alert>
      ) : (
        <Row>
          {albums.map(album => (
            <Col key={album.AlbumID} sm={6} md={4} lg={3} className="mb-4">
              <AlbumCard album={album} onPlayClick={handlePlayAlbum} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default UserAlbumsPage; 