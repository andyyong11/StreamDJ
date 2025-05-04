import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaSave, FaArrowLeft, FaImage } from 'react-icons/fa';

const EditAlbumPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    releaseDate: '',
    description: '',
    coverArt: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  
  // Fetch album details
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
        
        // Initialize form with album data
        setFormData({
          title: albumData.Title || '',
          releaseDate: albumData.ReleaseDate ? new Date(albumData.ReleaseDate).toISOString().split('T')[0] : '',
          description: albumData.Description || '',
          coverArt: null // File uploads start empty
        });
        
        if (albumData.CoverArtURL) {
          setPreviewImage(`http://localhost:5001/${albumData.CoverArtURL}`);
        }
        
      } catch (err) {
        console.error('Error fetching album details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlbumDetails();
  }, [albumId]);
  
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
      alert('Album title is required');
      return;
    }
    
    try {
      setSaving(true);
      
      // Create FormData object for the API call
      const apiFormData = new FormData();
      apiFormData.append('title', formData.title);
      
      if (formData.releaseDate) {
        apiFormData.append('releaseDate', formData.releaseDate);
      }
      
      if (formData.description) {
        apiFormData.append('description', formData.description);
      }
      
      if (formData.coverArt) {
        apiFormData.append('coverArt', formData.coverArt);
      }
      
      // Send the update request
      const response = await fetch(`http://localhost:5001/api/albums/${albumId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: apiFormData
      });
      
      if (!response.ok) {
        throw new Error('Failed to update album');
      }
      
      // Navigate back to album page on success
      navigate(`/albums/${albumId}`);
      
    } catch (err) {
      console.error('Error updating album:', err);
      setError(err.message);
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading album details...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate(-1)}>
            Go Back
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
          <p>The album you are trying to edit could not be found.</p>
          <Button variant="outline-primary" onClick={() => navigate('/albums')}>
            Go to Albums
          </Button>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate(`/albums/${albumId}`)}
      >
        <FaArrowLeft className="me-2" /> Back to Album
      </Button>
      
      <Card>
        <Card.Header>
          <h4 className="mb-0">Edit Album</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Album Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Release Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Album description..."
                  />
                </Form.Group>
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
                      alt="Album cover preview" 
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'contain',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '5px'
                      }} 
                    />
                  </div>
                )}
              </Col>
            </Row>
            
            <Alert variant="info" className="mt-3">
              <Alert.Heading>Need to manage tracks?</Alert.Heading>
              <p>
                To add or remove tracks from this album, go back to the album page after saving changes.
                You can add your existing tracks to this album from there.
              </p>
            </Alert>
            
            <div className="d-flex justify-content-end mt-3">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => navigate(`/albums/${albumId}`)}
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
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditAlbumPage; 