import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge } from 'react-bootstrap';
import { FaUpload, FaFileAudio, FaImage, FaPlus, FaTrash } from 'react-icons/fa';
import genreOptions from '../utils/genreOptions';

const UploadAlbumForm = () => {
  const [albumData, setAlbumData] = useState({
    title: '',
    releaseDate: '',
    description: '',
    coverArt: null,
    genre: '',
  });

  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState({
    title: '',
    file: null,
    trackNumber: '',
    duration: 0,
  });
  const [isLoadingDuration, setIsLoadingDuration] = useState(false);

  const handleAlbumChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setAlbumData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setAlbumData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTrackChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setCurrentTrack((prev) => ({ ...prev, [name]: files[0] }));
      
      // If this is an audio file, automatically detect its duration
      if (name === 'file' && files[0]) {
        setIsLoadingDuration(true);
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(files[0]);
        
        audio.addEventListener('loadedmetadata', () => {
          // Round to nearest second
          const durationInSeconds = Math.round(audio.duration);
          setCurrentTrack((prev) => ({ ...prev, duration: durationInSeconds }));
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
      setCurrentTrack((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addTrack = () => {
    if (!currentTrack.title || !currentTrack.file) {
      alert('Track title and file are required');
      return;
    }

    // Generate track number if not provided
    const trackNumber = currentTrack.trackNumber 
      ? parseInt(currentTrack.trackNumber) 
      : tracks.length + 1;

    setTracks([...tracks, { ...currentTrack, trackNumber }]);
    setCurrentTrack({
      title: '',
      file: null,
      trackNumber: (tracks.length + 2).toString(), // Auto-increment for next track
      duration: 0,
    });
  };

  const removeTrack = (index) => {
    const updatedTracks = [...tracks];
    updatedTracks.splice(index, 1);
    
    // Renumber tracks if needed
    const renumberedTracks = updatedTracks.map((track, idx) => ({
      ...track,
      trackNumber: idx + 1,
    }));
    
    setTracks(renumberedTracks);
    
    // Update current track number to be the next one
    setCurrentTrack(prev => ({
      ...prev,
      trackNumber: (renumberedTracks.length + 1).toString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (tracks.length === 0) {
      alert('Please add at least one track to the album');
      return;
    }

    if (!albumData.coverArt) {
      alert('Album cover art is required');
      return;
    }

    const formData = new FormData();
    
    // Album data
    formData.append('title', albumData.title);
    formData.append('releaseDate', albumData.releaseDate);
    formData.append('description', albumData.description);
    formData.append('coverArt', albumData.coverArt);
    formData.append('genre', albumData.genre);
    
    // Track data
    tracks.forEach((track, index) => {
      formData.append('tracks', track.file);
      formData.append('trackTitles', track.title);
      formData.append('trackNumbers', track.trackNumber);
      formData.append('trackDurations', track.duration || 0); // Include duration
    });

    try {
      const response = await fetch('http://localhost:5001/api/albums/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const albumId = result.data.album?.AlbumID;
        
        alert('Album created successfully!');
        
        // Navigate to the album page
        window.location.href = `/albums/${albumId}`;
      } else {
        alert(`Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading album:', error);
      alert('Failed to upload album. Please try again.');
    }
  };

  return (
    <Container className="my-4">
      <Card className="p-4 shadow-lg">
        <Card.Title className="mb-4">Upload New Album</Card.Title>
        <p className="text-muted mb-4">
          Create an album by uploading tracks. You can also add your existing tracks to this album later.
        </p>
        
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Album Details Section */}
          <Card className="mb-4 p-3 bg-light">
            <Card.Title className="mb-3">Album Details</Card.Title>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Album Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Album Title"
                    value={albumData.title}
                    onChange={handleAlbumChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Release Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="releaseDate"
                    value={albumData.releaseDate}
                    onChange={handleAlbumChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    placeholder="Album description..."
                    value={albumData.description}
                    onChange={handleAlbumChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Genre</Form.Label>
                  <Form.Select
                    name="genre"
                    value={albumData.genre}
                    onChange={handleAlbumChange}
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
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Album Cover <FaImage /></Form.Label>
                  <Form.Control
                    type="file"
                    name="coverArt"
                    accept="image/*"
                    onChange={handleAlbumChange}
                    required
                  />
                </Form.Group>
                
                {albumData.coverArt && (
                  <div className="mt-3 text-center">
                    <img 
                      src={URL.createObjectURL(albumData.coverArt)} 
                      alt="Album cover preview" 
                      style={{ 
                        maxWidth: '100%', 
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
          </Card>
          
          {/* Track List Section */}
          <Card className="mb-4 p-3 bg-light">
            <Card.Title className="mb-3">Album Tracks</Card.Title>
            
            {tracks.length > 0 && (
              <ListGroup className="mb-4">
                {tracks.map((track, index) => (
                  <ListGroup.Item 
                    key={index}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <Badge bg="secondary" className="me-2">
                        {track.trackNumber}
                      </Badge>
                      {track.title}
                      <small className="text-muted ms-2">
                        ({track.file.name})
                        {track.duration > 0 && ` - ${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}`}
                      </small>
                    </div>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => removeTrack(index)}
                    >
                      <FaTrash />
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            
            {/* Add Track Form */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Track Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Track Title"
                    value={currentTrack.title}
                    onChange={handleTrackChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Track #</Form.Label>
                  <Form.Control
                    type="number"
                    name="trackNumber"
                    placeholder="#"
                    value={currentTrack.trackNumber}
                    onChange={handleTrackChange}
                    min="1"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Audio File <FaFileAudio /></Form.Label>
                  <Form.Control
                    type="file"
                    name="file"
                    accept="audio/*"
                    onChange={handleTrackChange}
                  />
                  {isLoadingDuration && (
                    <Form.Text className="text-muted">
                      Detecting audio duration...
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={2} className="d-flex align-items-end">
                <Button 
                  variant="success" 
                  className="w-100"
                  onClick={addTrack}
                  disabled={!currentTrack.title || !currentTrack.file || isLoadingDuration}
                >
                  <FaPlus className="me-1" /> Add
                </Button>
              </Col>
            </Row>
          </Card>
          
          {/* Submit Button */}
          <div className="text-center">
            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              disabled={tracks.length === 0 || !albumData.title || !albumData.coverArt}
            >
              <FaUpload className="me-2" /> Upload Album
            </Button>
            <p className="text-muted mt-3">
              After creating your album, you'll be able to add existing tracks from your library.
            </p>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default UploadAlbumForm; 