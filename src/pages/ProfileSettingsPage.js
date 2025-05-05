import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    profileImage: null,
    bannerImage: null
  });
  
  // Preview state
  const [previews, setPreviews] = useState({
    profileImage: null,
    bannerImage: null
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) {
        navigate('/login');
        return;
      }
      
      try {
        const response = await api.get(`/api/users/${user.id}`);
        if (response?.data) {
          setFormData({
            username: response.data.Username || '',
            bio: response.data.Bio || '',
            profileImage: null,
            bannerImage: null
          });
          
          // Set previews if images exist
          if (response.data.ProfileImage) {
            setPreviews(prev => ({
              ...prev,
              profileImage: response.data.ProfileImage.startsWith('http')
                ? response.data.ProfileImage
                : `http://localhost:5001/${response.data.ProfileImage.replace(/^\/+/, '')}`
            }));
          }
          
          if (response.data.BannerImage) {
            setPreviews(prev => ({
              ...prev,
              bannerImage: response.data.BannerImage.startsWith('http')
                ? response.data.BannerImage
                : `http://localhost:5001/${response.data.BannerImage.replace(/^\/+/, '')}`
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Could not load your profile data. Please try again later.');
      }
    };
    
    fetchUserData();
  }, [user, navigate]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(files[0]);
      setPreviews(prev => ({
        ...prev,
        [name]: previewUrl
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    if (!user || !user.id) {
      setError('You must be logged in to update your profile.');
      setLoading(false);
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('bio', formData.bio);
      
      if (formData.profileImage) {
        formDataToSend.append('profileImage', formData.profileImage);
      }
      
      if (formData.bannerImage) {
        formDataToSend.append('bannerImage', formData.bannerImage);
      }
      
      const response = await api.put(`/api/users/${user.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response?.data) {
        setSuccess(true);
        // Update auth context user info if needed
        if (updateUser) {
          updateUser({
            ...user,
            username: formData.username
          });
        }
        
        // Navigate back to profile after short delay
        setTimeout(() => {
          navigate(`/profile/${user.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          You need to be logged in to access this page.
        </Alert>
        <Button 
          variant="primary" 
          onClick={() => navigate('/login')}
        >
          Log In
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Edit Profile</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          Profile updated successfully!
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </Form.Group>
            
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Profile Image</Form.Label>
                  <Form.Control
                    type="file"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {previews.profileImage && (
                    <div className="mt-3">
                      <p>Preview:</p>
                      <img 
                        src={previews.profileImage} 
                        alt="Profile Preview" 
                        className="rounded-circle"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Banner Image</Form.Label>
                  <Form.Control
                    type="file"
                    name="bannerImage"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {previews.bannerImage && (
                    <div className="mt-3">
                      <p>Preview:</p>
                      <img 
                        src={previews.bannerImage} 
                        alt="Banner Preview" 
                        className="img-fluid rounded"
                        style={{ maxHeight: '100px', width: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex gap-3">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
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
                ) : 'Save Changes'}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProfileSettingsPage; 