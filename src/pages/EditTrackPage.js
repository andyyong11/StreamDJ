import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaSave, FaArrowLeft, FaMusic, FaImage } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import genreOptions from '../utils/genreOptions';
import api from '../services/api';

const EditTrackPage = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: '',
    coverArt: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  
  // Fetch track details
  useEffect(() => {
    const fetchTrackDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/tracks/${trackId}`);
        
        if (response?.data) {
          setTrack(response.data);
          
          // Initialize form with track data
          setFormData({
            title: response.data.Title || '',
            artist: response.data.Artist || '',
            genre: response.data.Genre || '',
            coverArt: null // File uploads start empty
          });
          
          if (response.data.CoverArt) {
            const coverArtUrl = response.data.CoverArt.startsWith('http') 
              ? response.data.CoverArt 
              : `http://localhost:5001/${response.data.CoverArt.replace(/^\/+/, '')}`;
            setPreviewImage(coverArtUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching track details:', err);
        setError(err.message || 'Failed to fetch track details');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && trackId) {
      fetchTrackDetails();
    }
  }, [trackId, user]);
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'coverArt' && files && files[0]) {
      setFormData(prev => ({ ...prev, coverArt: files[0] }));
      setPreviewImage(URL.createObjectURL(files[0]));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      alert('Track title is required');
      return;
    }
    
    try {
      setSaving(true);
      
      // Create FormData object for the API call
      const apiFormData = new FormData();
      apiFormData.append('title', formData.title);
      
      if (formData.artist) {
        apiFormData.append('artist', formData.artist);
      }
      
      if (formData.genre) {
        apiFormData.append('genre', formData.genre);
      }
      
      if (formData.coverArt) {
        apiFormData.append('coverArt', formData.coverArt);
      }
      
      // Send the update request using the api service
      const response = await api.put(`/api/tracks/${trackId}`, apiFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Track updated successfully:', response.data);
      
      // Navigate back to creator dashboard on success
      navigate('/creator-dashboard/my-tracks');
      
    } catch (err) {
      console.error('Error updating track:', err);
      // Extract the error message from the response if available
      let errorMessage = 'Failed to update track';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading track details...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!track) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Track Not Found</Alert.Heading>
          <p>The requested track could not be found.</p>
          <Button variant="outline-primary" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <FaMusic className="me-2" /> Edit Track
            </h3>
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              <FaArrowLeft className="me-2" /> Back
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Track Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Artist</Form.Label>
                  <Form.Control
                    type="text"
                    name="artist"
                    value={formData.artist}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Genre</Form.Label>
                  <Form.Select
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                  >
                    <option value="">Select a genre</option>
                    {genreOptions.map(genre => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaImage className="me-2" /> Cover Art
                  </Form.Label>
                  <Form.Control
                    type="file"
                    name="coverArt"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Leave empty to keep current cover
                  </Form.Text>
                </Form.Group>
                
                {previewImage && (
                  <div className="mt-3 text-center">
                    <img 
                      src={previewImage} 
                      alt="Track cover preview" 
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '5px'
                      }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/300x300';
                      }}
                    />
                  </div>
                )}
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditTrackPage; 