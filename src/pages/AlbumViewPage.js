import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaPlay, FaTrash, FaPen, FaArrowLeft, FaPlus } from 'react-icons/fa';
import api from '../services/api';
import '../styles/PlayButton.css';

const AlbumViewPage = ({ playTrack }) => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/albums/${albumId}`);
        if (response?.data) {
          setAlbum(response.data);
          if (response.data.tracks) {
            setTracks(response.data.tracks);
          }
        }
      } catch (err) {
        console.error('Error fetching album details:', err);
        setError('Failed to load album details');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [albumId]);

  const handlePlayTrack = (track) => {
    if (playTrack) {
      playTrack(track, tracks);
    }
  };

  const handleRemoveTrack = async (trackId) => {
    try {
      await api.delete(`/api/albums/${albumId}/tracks/${trackId}`);
      setTracks(tracks.filter(track => track.TrackID !== trackId));
    } catch (err) {
      console.error('Error removing track:', err);
      // Optionally show an error message
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">{error}</div>
        <Button as={Link} to="/creator-dashboard/my-albums" variant="primary">
          Back to Albums
        </Button>
      </Container>
    );
  }

  if (!album) {
    return (
      <Container className="py-4">
        <div className="alert alert-warning">Album not found</div>
        <Button as={Link} to="/creator-dashboard/my-albums" variant="primary">
          Back to Albums
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" className="mb-3" as={Link} to="/creator-dashboard/my-albums">
        <FaArrowLeft className="me-2" /> Back
      </Button>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0">
            <Card.Img
              variant="top"
              src={album.CoverArtURL ? 
                `http://localhost:5001/${album.CoverArtURL.replace(/^\/+/, '')}` : 
                'https://placehold.co/300x300?text=Album'}
              className="img-fluid shadow"
              style={{ borderRadius: '8px' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/300x300?text=Album';
              }}
            />
          </Card>
        </Col>
        <Col md={8}>
          <div className="h-100 d-flex flex-column justify-content-end">
            <div>
              <small className="text-muted">ALBUM</small>
              <h1>{album.Title}</h1>
              <p className="text-muted">Released: {new Date(album.ReleaseDate).toLocaleDateString()}</p>
              <div className="mt-3 action-buttons-container">
                <Button 
                  variant="outline-primary" 
                  className="creator-action-btn"
                  onClick={() => navigate(`/edit-album/${albumId}`)}
                >
                  <FaPen />
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Tracks</h4>
          <Button 
            variant="success" 
            size="sm"
            onClick={() => navigate(`/albums/${albumId}/add-tracks`)}
          >
            <FaPlus className="me-2" /> Add Existing Track
          </Button>
        </Card.Header>
        <Card.Body className="p-0">
          {tracks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No tracks in this album yet.</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {tracks.map((track, index) => (
                <div 
                  key={track.TrackID} 
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <Badge bg="secondary" className="me-2">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="mb-0 fw-medium">{track.Title}</div>
                      <small className="text-muted d-block">
                        {track.PlayCount || track.play_count || 0} plays
                      </small>
                    </div>
                  </div>
                  <div className="action-buttons-container">
                    <Button
                      variant="success"
                      className="creator-action-btn me-2"
                      onClick={() => handlePlayTrack(track)}
                    >
                      <FaPlay />
                    </Button>
                    <Button
                      variant="danger"
                      className="creator-action-btn"
                      onClick={() => handleRemoveTrack(track.TrackID)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AlbumViewPage; 