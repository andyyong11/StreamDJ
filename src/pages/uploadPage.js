import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Nav } from 'react-bootstrap';
import { FaUpload, FaFileAudio, FaImage, FaCompactDisc } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import UploadAlbumForm from './UploadAlbumPage';
import genreOptions from '../utils/genreOptions';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const UploadPage = () => {
  const [uploadType, setUploadType] = useState('track'); // 'track' or 'album'

  return (
    <Container className="my-4">
      <Card className="mb-4">
        <Card.Header>
          <Nav variant="tabs" defaultActiveKey="track">
            <Nav.Item>
              <Nav.Link 
                eventKey="track" 
                onClick={() => setUploadType('track')}
                active={uploadType === 'track'}
              >
                <FaFileAudio className="me-2" /> Upload Track
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="album" 
                onClick={() => setUploadType('album')}
                active={uploadType === 'album'}
              >
                <FaCompactDisc className="me-2" /> Upload Album
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
      </Card>

      {uploadType === 'track' ? <UploadTrackForm /> : <UploadAlbumForm />}
    </Container>
  );
};

const UploadTrackForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    userId: user?.id || '', // Use the current user's ID instead of hardcoded 1
    title: '',
    genre: '',
    duration: '',
    artist: '',
    featuredArtists: [],
    audioFile: null,
    coverArt: null,
  });
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      
      // If this is an audio file, get its duration automatically
      if (name === 'audioFile' && files[0]) {
        setIsLoadingDuration(true);
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(files[0]);
        
        audio.addEventListener('loadedmetadata', () => {
          // Round to nearest second
          const durationInSeconds = Math.round(audio.duration);
          setFormData((prev) => ({ ...prev, duration: durationInSeconds.toString() }));
          setIsLoadingDuration(false);
          URL.revokeObjectURL(objectUrl);
        });
        
        audio.addEventListener('error', () => {
          console.error('Error loading audio file');
          setIsLoadingDuration(false);
          URL.revokeObjectURL(objectUrl);
        });
        
        audio.src = objectUrl;
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    // Validate that we have a user ID
    if (!formData.userId) {
      alert('You must be logged in to upload tracks');
      setIsUploading(false);
      return;
    }
    
    const body = new FormData();
    body.append('userId', formData.userId);
    body.append('title', formData.title);
    body.append('artist', formData.artist);
    body.append('genre', formData.genre);
    
    // Ensure duration is included with a default value if not set
    const duration = formData.duration ? formData.duration : '0';
    console.log('Using duration value:', duration);
    body.append('duration', duration);
    
    body.append('audioFile', formData.audioFile);
    body.append('coverArt', formData.coverArt);
    
    // Handle featured artists
    if (formData.featuredArtists && formData.featuredArtists.length > 0) {
      // Join array into comma-separated string
      body.append('featuredArtists', formData.featuredArtists.join(','));
    } else {
      body.append('featuredArtists', '');
    }

    console.log('Submitting track with user ID:', formData.userId);

    try {
      console.log('Submitting form data...');
      const res = await fetch('http://localhost:5001/api/tracks/upload', {
        method: 'POST',
        body,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming the token is stored in localStorage
        }
      });

      if (res.ok) {
        alert('Track uploaded successfully!');
        
        // Clear all track-related API caches
        api.clearCacheFor('/api/tracks/by-user');
        api.clearCacheFor('/api/tracks/search');
        api.clearCacheFor('/api/tracks/search-all');
        api.clearCacheFor('/api/tracks'); 
        
        // For a more aggressive approach, clear the entire API cache
        // This ensures all data is refreshed including search results
        api.clearCache();
        
        // Reset form
        setFormData({
          userId: user?.id || '',
          title: '',
          genre: '',
          duration: '',
          artist: '',
          featuredArtists: [],
          audioFile: null,
          coverArt: null,
        });
        
        // Navigate to the creator dashboard after a short delay
        setTimeout(() => {
          navigate('/my-tracks');
        }, 500);
      } else {
        alert('Upload failed.');
      }
    } catch (error) {
      console.error('Error uploading track:', error);
      alert('Failed to upload track. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container>
      <Card className="p-4 shadow-lg">
        <Card.Title className="mb-4">Upload New Track</Card.Title>
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              placeholder="Track Title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Artist Name (Primary)</Form.Label>
            <Form.Control
              type="text"
              name="artist"
              placeholder="Artist"
              value={formData.artist}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Featured Artists (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="featuredArtists"
              placeholder="e.g. coolDude99, beatQueen, vibemaster"
              value={formData.featuredArtists.join(', ')}
              onChange={(e) => {
                const usernames = e.target.value
                  .split(',')
                  .map(name => name.trim())
                  .filter(name => name !== '');
                setFormData((prev) => ({ ...prev, featuredArtists: usernames }));
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Genre</Form.Label>
            <Form.Select
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
            >
              <option value="">Select a genre</option>
              {genreOptions.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Audio File <FaFileAudio /></Form.Label>
              <Form.Control
                type="file"
                name="audioFile"
                accept="audio/*"
                onChange={handleChange}
                required
              />
              {isLoadingDuration && (
                <Form.Text className="text-muted">
                  Calculating duration from audio file...
                </Form.Text>
              )}
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Cover Art <FaImage /></Form.Label>
              <Form.Control
                type="file"
                name="coverArt"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </Col>
          </Row>

          <Button variant="primary" type="submit" className="mt-3" disabled={isUploading}>
            <FaUpload className="me-2" /> Upload Track
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default UploadPage;