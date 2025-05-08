import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ListGroup, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaMusic, FaTrash, FaPen, FaArrowLeft, FaPlay } from 'react-icons/fa';
import '../styles/PlayButton.css';
import { useAuth } from '../context/AuthContext';

const AlbumPage = ({ playTrack }) => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [trackNumber, setTrackNumber] = useState('');
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [trackToRemove, setTrackToRemove] = useState(null);
  const [showDeleteAlbumModal, setShowDeleteAlbumModal] = useState(false);
  const [deleteAlbumLoading, setDeleteAlbumLoading] = useState(false);
  
  // Fetch the album details when the component loads
  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/albums/${albumId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch album details');
        }
        
        const albumData = await response.json();
        setAlbum(albumData);
        setTracks(albumData.tracks || []);
        
        // Also fetch user's tracks for the add track feature
        await fetchUserTracks();
      } catch (err) {
        console.error('Error fetching album details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlbumDetails();
  }, [albumId]);
  
  // Fetch the user's tracks that are not already in this album
  const fetchUserTracks = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/tracks/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user tracks');
      }
      
      const userTracksData = await response.json();
      
      // Filter out tracks that are already in the album
      const existingTrackIds = tracks.map(track => track.TrackID);
      const availableTracks = userTracksData.filter(track => 
        !existingTrackIds.includes(track.TrackID)
      );
      
      setUserTracks(availableTracks);
    } catch (err) {
      console.error('Error fetching user tracks:', err);
    }
  };
  
  // Handle adding a track to the album
  const handleAddTrack = async () => {
    if (!selectedTrack) {
      alert('Please select a track to add');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5001/api/albums/${albumId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          trackId: selectedTrack,
          trackNumber: trackNumber ? parseInt(trackNumber) : tracks.length + 1
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add track to album');
      }
      
      // Refresh the album data
      const updatedResponse = await fetch(`http://localhost:5001/api/albums/${albumId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!updatedResponse.ok) {
        throw new Error('Failed to refresh album data');
      }
      
      const updatedAlbum = await updatedResponse.json();
      setAlbum(updatedAlbum);
      setTracks(updatedAlbum.tracks || []);
      
      // Refresh the user's available tracks
      await fetchUserTracks();
      
      // Close the modal
      setShowAddTrackModal(false);
      setSelectedTrack(null);
      setTrackNumber('');
      
    } catch (err) {
      console.error('Error adding track to album:', err);
      alert(`Failed to add track: ${err.message}`);
    }
  };
  
  // Handle removing a track from the album
  const confirmRemoveTrack = (trackId) => {
    setTrackToRemove(trackId);
    setShowRemoveConfirmation(true);
  };
  
  const handleRemoveTrack = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/albums/${albumId}/tracks/${trackToRemove}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove track from album');
      }
      
      // Refresh the album data
      const updatedResponse = await fetch(`http://localhost:5001/api/albums/${albumId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!updatedResponse.ok) {
        throw new Error('Failed to refresh album data');
      }
      
      const updatedAlbum = await updatedResponse.json();
      setAlbum(updatedAlbum);
      setTracks(updatedAlbum.tracks || []);
      
      // Refresh the user's available tracks
      await fetchUserTracks();
      
      // Close the modal
      setShowRemoveConfirmation(false);
      
    } catch (err) {
      console.error('Error removing track from album:', err);
      alert(`Failed to remove track: ${err.message}`);
    }
  };
  
  // Handle delete album
  const handleDeleteAlbum = async () => {
    try {
      setDeleteAlbumLoading(true);
      const response = await fetch(`http://localhost:5001/api/albums/${albumId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete album');
      }
      
      setDeleteAlbumLoading(false);
      setShowDeleteAlbumModal(false);
      navigate('/albums');
    } catch (err) {
      console.error('Error deleting album:', err);
      alert(`Failed to delete album: ${err.message}`);
      setDeleteAlbumLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h3>Loading album details...</h3>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Album</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!album) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Album Not Found</Alert.Heading>
          <p>The requested album could not be found.</p>
          <Button variant="outline-primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  // Check if current user is the album owner
  const isOwner = user && album && user.id === album.UserID;
  
  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" /> Back
      </Button>
      
      <Row className="mb-4">
        <Col md={4}>
          {album.CoverArtURL && (
            <Card className="mb-3">
              <Card.Img 
                src={album.CoverArtURL.startsWith('http') 
                  ? album.CoverArtURL 
                  : `http://localhost:5001/${album.CoverArtURL.replace(/^\/+/, '')}`}
                alt={album.Title} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/300x300';
                }}
              />
            </Card>
          )}
        </Col>
        
        <Col md={8}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="display-5">{album.Title}</Card.Title>
              
              <Card.Text className="text-muted">
                {album.ReleaseDate && (
                  <span>Released: {new Date(album.ReleaseDate).toLocaleDateString()}</span>
                )}
              </Card.Text>
              
              {album.Description && (
                <Card.Text>{album.Description}</Card.Text>
              )}
              
              <div className="mt-3 action-buttons-container">
                {isOwner && (
                  <>
                    <Button 
                      variant="outline-primary" 
                      className="creator-action-btn me-2"
                      onClick={() => navigate(`/edit-album/${albumId}`)}
                    >
                      <FaPen />
                    </Button>
                    
                    <Button
                      variant="outline-danger"
                      className="creator-action-btn"
                      onClick={() => setShowDeleteAlbumModal(true)}
                    >
                      <FaTrash />
                    </Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Tracks</h4>
          {isOwner && (
            <Button 
              variant="success" 
              size="sm"
              className="d-flex align-items-center"
              onClick={() => {
                fetchUserTracks();
                setShowAddTrackModal(true);
              }}
            >
              <FaPlus className="me-2" /> Add Existing Track
            </Button>
          )}
        </Card.Header>
        
        <ListGroup variant="flush">
          {tracks.length === 0 ? (
            <ListGroup.Item className="text-center py-4">
              <p className="text-muted mb-0">No tracks in this album yet.</p>
            </ListGroup.Item>
          ) : (
            tracks
              .sort((a, b) => a.TrackNumber - b.TrackNumber)
              .map(track => (
                <ListGroup.Item 
                  key={track.TrackID}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <Badge bg="secondary" className="me-3">
                      {track.TrackNumber || '-'}
                    </Badge>
                    <div>
                      <h5 className="mb-0">{track.Title}</h5>
                      <small className="text-muted">
                        {track.Duration && `${Math.floor(track.Duration / 60)}:${String(track.Duration % 60).padStart(2, '0')}`}
                      </small>
                    </div>
                  </div>
                  
                  <div className="action-buttons-container">
                    <Button 
                      variant="success"
                      className="creator-action-btn me-2"
                      onClick={() => playTrack && playTrack(track, tracks)}
                    >
                      <FaPlay />
                    </Button>
                    {isOwner && (
                      <Button 
                        variant="outline-danger" 
                        className="creator-action-btn"
                        onClick={() => confirmRemoveTrack(track.TrackID)}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              ))
          )}
        </ListGroup>
      </Card>
      
      {/* Modal for adding existing tracks to album */}
      <Modal show={showAddTrackModal} onHide={() => setShowAddTrackModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Existing Track to Album</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userTracks.length === 0 ? (
            <Alert variant="info">
              <p className="mb-0">You don't have any tracks available to add to this album.</p>
              <hr />
              <p className="mb-0">Upload tracks first in the <a href="/upload">Upload</a> section, then add them to this album.</p>
            </Alert>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Track</Form.Label>
                <Form.Select 
                  value={selectedTrack || ''}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                >
                  <option value="">Select a track...</option>
                  {userTracks.map(track => (
                    <option key={track.TrackID} value={track.TrackID}>
                      {track.Title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Track Number</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1"
                  placeholder={`${tracks.length + 1}`}
                  value={trackNumber}
                  onChange={(e) => setTrackNumber(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Leave blank to add as track #{tracks.length + 1}
                </Form.Text>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddTrackModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddTrack}
            disabled={!selectedTrack || userTracks.length === 0}
          >
            Add to Album
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Confirmation Modal for Track Removal */}
      <Modal show={showRemoveConfirmation} onHide={() => setShowRemoveConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove this track from the album?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRemoveConfirmation(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRemoveTrack}
          >
            Remove
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Album Confirmation Modal */}
      <Modal show={showDeleteAlbumModal} onHide={() => setShowDeleteAlbumModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Album</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the album "{album?.Title}"?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteAlbumModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteAlbum}
            disabled={deleteAlbumLoading}
          >
            {deleteAlbumLoading ? 'Deleting...' : 'Delete Album'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AlbumPage; 