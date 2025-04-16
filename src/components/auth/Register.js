import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaLock, FaMusic, FaInfoCircle } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    role: 'user', // Default role
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    // Username validation (2-50 characters)
    if (formData.username.length < 2 || formData.username.length > 50) {
      setError('Username must be between 2 and 50 characters');
      return false;
    }

    // Email validation (max 255 characters)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || formData.email.length > 255) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation (min 8 characters)
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          bio: formData.bio,
          role: formData.role
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.error || data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error or server is not responding. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="auth-page">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={8} lg={6} xl={4}>
          <Card className="auth-card">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="brand-text">StreamDJ</h2>
                <p className="text-muted">Join the music revolution</p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <FaInfoCircle className="me-2" />
                  {error}
                </div>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaUser className="me-2" /> Username
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose your DJ name"
                    maxLength={50}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaEnvelope className="me-2" /> Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email address"
                    maxLength={255}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaLock className="me-2" /> Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a secure password"
                    minLength={8}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center">
                    <FaLock className="me-2" /> Confirm Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    minLength={8}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="d-flex align-items-center">
                    <FaMusic className="me-2" /> Bio (Optional)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Share your music style and experience"
                    maxLength={500}
                    rows={3}
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100 mb-4 d-flex align-items-center justify-content-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Start Your DJ Journey'
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-muted">
                    Already part of the community? <Link to="/login">Sign in</Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;