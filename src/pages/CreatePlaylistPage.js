import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CreatePlaylistPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a playlist title');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to create a playlist');
      }
      
      // Log the user info to confirm we have a valid user
      const storedUser = localStorage.getItem('user');
      console.log('Current user from localStorage:', storedUser);
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      console.log('User ID from localStorage:', userObj?.id || userObj?.UserID);
      
      // Ensure we use proper casing and include user ID
      const playlistData = {
        title: title, // Try lowercase for some APIs
        Title: title, // Try uppercase for some APIs
        description: description || "", // Try lowercase
        Description: description || "", // Try uppercase
        is_public: isPublic, // Try snake_case 
        isPublic: isPublic, // Try camelCase
        IsPublic: isPublic, // Try PascalCase
        // Include user ID if available
        user_id: userObj?.id || userObj?.UserID,
        userId: userObj?.id || userObj?.UserID,
        UserId: userObj?.id || userObj?.UserID,
        UserID: userObj?.id || userObj?.UserID,
      };
      
      console.log("Attempting to create playlist with data:", playlistData);
      
      const response = await fetch('http://localhost:5001/api/playlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(playlistData)
      });
      
      console.log("Response status:", response.status);
      
      // Try to get the response text for debugging
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      // Parse the JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed response data:", responseData);
      } catch (e) {
        console.log("Could not parse response as JSON, error:", e);
      }
      
      if (!response.ok) {
        throw new Error((responseData && responseData.error) 
          ? responseData.error 
          : `Failed to create playlist: ${response.status} ${response.statusText}`);
      }
      
      console.log('Playlist created successfully:', responseData);
      
      // If we have a cover image and a playlist ID, upload the image
      const playlistId = responseData?.PlaylistID || responseData?.playlistId || responseData?.id;
      if (coverImage && playlistId) {
        try {
          await uploadCoverImage(playlistId, coverImage, token);
        } catch (err) {
          console.error('Failed to upload cover image:', err);
          // Continue anyway since playlist was created
        }
      }
      
      // Reset the form for creating another playlist
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setCoverImage(null);
      setCoverPreview(null);
      
      // Show success message and offer options
      const createAnother = window.confirm('Playlist created successfully! Would you like to create another playlist?');
      
      if (createAnother) {
        // Stay on the page with form reset
        window.scrollTo(0, 0);
      } else {
        // Navigate to the newly created playlist
        if (playlistId) {
          navigate(`/playlists/${playlistId}`);
        } else {
          // If no ID is returned, go back to library page
          console.log("No playlist ID in response, navigating to library");
          navigate('/library');
        }
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.message || 'An error occurred while creating the playlist');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle cover image upload separately
  const uploadCoverImage = async (playlistId, image, token) => {
    console.log(`Uploading cover image for playlist ${playlistId}...`);
    
    const formData = new FormData();
    formData.append('coverImage', image);
    
    const response = await fetch(`http://localhost:5001/api/playlists/${playlistId}/cover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload cover image: ${response.status}`);
    }
    
    console.log('Cover image uploaded successfully');
    return true;
  };
  
  // For debugging - show JSON that will be sent
  const getDebugData = () => {
    return {
      Title: title,
      Description: description || "",
      IsPublic: isPublic
    };
  };
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Create a New Playlist</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* For debugging */}
            <div className="mb-3" style={{display: 'none'}}>
              <pre>{JSON.stringify(getDebugData(), null, 2)}</pre>
            </div>
            <div className="d-flex mb-4">
              <div className="me-4">
                <div 
                  className="playlist-cover-preview"
                  style={{
                    width: '200px',
                    height: '200px',
                    backgroundColor: '#e9ecef',
                    backgroundImage: coverPreview ? `url(${coverPreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                  }}
                >
                  {!coverPreview && <span className="text-muted">Playlist Cover</span>}
                </div>
                <Form.Group controlId="coverImage" className="mt-2">
                  <Form.Label>Cover Image (optional)</Form.Label>
                  <Form.Control 
                    type="file" 
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                </Form.Group>
              </div>
              
              <div className="flex-grow-1">
                <Form.Group className="mb-3" controlId="playlistTitle">
                  <Form.Label>Playlist Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Give your playlist a name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="playlistDescription">
                  <Form.Label>Description (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add an optional description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="isPublic"
                    label="Make playlist public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <Form.Text className="text-muted">
                    Public playlists can be discovered and listened to by anyone.
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => navigate('/library')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Playlist'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreatePlaylistPage; 