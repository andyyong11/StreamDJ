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
  const isOwnProfile = !userId || (user && userId === user.id.toString());

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const endpoint = userId 
          ? `http://localhost:5001/api/albums/user/${userId}`
          : 'http://localhost:5001/api/albums/my-albums';
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch albums');
        }
        
        const data = await response.json();
        setAlbums(data);
      } catch (err) {
        console.error('Error fetching albums:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlbums();
  }, [userId, user]);

  const handlePlayAlbum = (album) => {
    navigate(`/albums/${album.AlbumID}?autoplay=true`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading albums...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{isOwnProfile ? 'My Albums' : "User's Albums"}</h1>
        
        {isOwnProfile && (
          <Button variant="primary" onClick={() => navigate('/upload-album')}>
            <FaPlus className="me-2" /> Create New Album
          </Button>
        )}
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {isOwnProfile && (
        <Alert variant="info" className="mb-4">
          To manage or delete your albums, please visit the Creator Dashboard section.
        </Alert>
      )}
      
      {albums.length === 0 ? (
        <div className="text-center py-5">
          <FaCompactDisc size={48} className="text-muted mb-3" />
          <h3>No albums found</h3>
          {isOwnProfile && (
            <div className="mt-3">
              <Button variant="primary" onClick={() => navigate('/upload-album')}>
                Create Your First Album
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Row>
          {albums.map(album => (
            <Col md={3} sm={6} key={album.AlbumID} className="mb-4">
              <AlbumCard
                album={album}
                onPlayClick={handlePlayAlbum}
                showDelete={false}
              />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default UserAlbumsPage; 