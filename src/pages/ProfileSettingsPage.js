import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageCropper from '../components/ImageCropper';

// Helper function to get safe image URL
const getSafeImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return it as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // For local paths, ensure they start with a slash
  // Don't re-encode already encoded URLs
  if (imagePath.includes('%')) {
    // Already encoded, just ensure the path starts with /
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  }
  
  // For non-encoded paths, ensure they start with a slash and are properly encoded
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Return the path without double-encoding
  return cleanPath;
};

const ProfileSettingsPage = ({ openLoginModal }) => {
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
  
  // Cropper state
  const [cropperState, setCropperState] = useState({
    show: false,
    image: null,
    fieldName: null,
    aspect: 1
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Load user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) {
        if (openLoginModal) {
          openLoginModal();
        } else {
          navigate('/');
        }
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
              profileImage: getSafeImageUrl(response.data.ProfileImage)
            }));
          }
          
          if (response.data.BannerImage) {
            setPreviews(prev => ({
              ...prev,
              bannerImage: getSafeImageUrl(response.data.BannerImage)
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Could not load your profile data. Please try again later.');
      }
    };
    
    fetchUserData();
  }, [user, navigate, openLoginModal]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file selection to open cropper
  const handleFileSelect = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      // Create preview URL
      const imageUrl = URL.createObjectURL(files[0]);
      
      // Set cropper state
      setCropperState({
        show: true,
        image: imageUrl,
        fieldName: name,
        aspect: name === 'profileImage' ? 1 : 16/9 // 1:1 for profile, 16:9 for banner
      });
    }
  };
  
  // Handle crop complete
  const handleCropComplete = (file, preview) => {
    const { fieldName } = cropperState;
    
    // Update form data with cropped file
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
    
    // Update preview
    setPreviews(prev => ({
      ...prev,
      [fieldName]: preview
    }));
  };
  
  // Close cropper
  const handleCloseCropper = () => {
    setCropperState({
      show: false,
      image: null,
      fieldName: null,
      aspect: 1
    });
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
      // Create FormData object
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
            username: formData.username,
            bio: formData.bio
          });
        }
        
        // Navigate back to profile after short delay
        setTimeout(() => {
          navigate(`/profile/${user.id}`, { 
            state: { fromProfileEdit: true } 
          });
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
          onClick={openLoginModal || (() => navigate('/'))}
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
                    onChange={handleFileSelect}
                  />
                  <div className="form-text">
                    Best results with a square image. You'll be able to crop after selecting.
                  </div>
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
                    onChange={handleFileSelect}
                  />
                  <div className="form-text">
                    Recommended aspect ratio 16:9 (like 1920x1080). You'll be able to crop after selecting.
                  </div>
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
          
          {/* Image Cropper */}
          <ImageCropper
            show={cropperState.show}
            onHide={handleCloseCropper}
            image={cropperState.image}
            aspect={cropperState.aspect}
            circularCrop={cropperState.fieldName === 'profileImage'}
            title={cropperState.fieldName === 'profileImage' ? 'Crop Profile Image' : 'Crop Banner Image'}
            onCropComplete={handleCropComplete}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProfileSettingsPage; 