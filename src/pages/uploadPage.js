import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Nav } from 'react-bootstrap';
import { FaUpload, FaFileAudio, FaImage, FaCompactDisc } from 'react-icons/fa';
import UploadAlbumForm from './UploadAlbumPage';
import genreOptions from '../utils/genreOptions';

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
  const [formData, setFormData] = useState({
    userId: 1,
    title: '',
    genre: '',
    duration: '',
    artist: '',
    featuredArtists: [],
    audioFile: null,
    coverArt: null,
  });
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);

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
    const body = new FormData();
    body.append('userId', formData.userId);
    body.append('title', formData.title);
    body.append('artist', formData.artist);
    body.append('genre', formData.genre);
    body.append('duration', formData.duration);
    body.append('audioFile', formData.audioFile);
    body.append('coverArt', formData.coverArt);
    formData.featuredArtists.forEach((username) =>
      body.append('featuredArtists[]', username)
    );

    try {
      const res = await fetch('http://localhost:5001/api/tracks/upload', {
        method: 'POST',
        body,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming the token is stored in localStorage
        }
      });

      if (res.ok) {
        alert('Track uploaded successfully!');
        // Reset form
        setFormData({
          userId: 1,
          title: '',
          genre: '',
          duration: '',
          artist: '',
          featuredArtists: [],
          audioFile: null,
          coverArt: null,
        });
      } else {
        alert('Upload failed.');
      }
    } catch (error) {
      console.error('Error uploading track:', error);
      alert('Failed to upload track. Please try again.');
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

          <Form.Group className="mb-3">
            <Form.Label>Duration (in seconds)</Form.Label>
            <Form.Control
              type="number"
              name="duration"
              placeholder={isLoadingDuration ? "Detecting duration..." : "e.g., 180"}
              value={formData.duration}
              onChange={handleChange}
              required
              disabled={isLoadingDuration}
            />
            <Form.Text className="text-muted">
              {isLoadingDuration 
                ? "Calculating duration from audio file..." 
                : "Duration will be automatically detected from the audio file."}
            </Form.Text>
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

          <Button variant="primary" type="submit" className="mt-3">
            <FaUpload className="me-2" /> Upload Track
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default UploadPage;