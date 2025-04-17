import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateField = (name, value) => {
    const errors = [];
    switch (name) {
      case 'username':
        if (value.length < 4) {
          errors.push('Username must be at least 4 characters long');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          errors.push('Username can only contain letters, numbers, and underscores');
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push('Please enter a valid email address');
        }
        break;
      case 'password':
        if (value.length < 8) {
          errors.push('Must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])/.test(value)) {
          errors.push('Must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          errors.push('Must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(value)) {
          errors.push('Must contain at least one number');
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          errors.push('Passwords must match');
        }
        break;
      default:
        return [];
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Only validate if the field has been touched
    if (touchedFields[name]) {
      const fieldErrors = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors
      }));

      // Update confirm password validation when password changes
      if (name === 'password' && formData.confirmPassword) {
        const confirmErrors = validateField('confirmPassword', formData.confirmPassword);
        setErrors(prev => ({
          ...prev,
          confirmPassword: confirmErrors
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
    const fieldErrors = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key]);
      if (fieldErrors.length > 0) {
        newErrors[key] = fieldErrors;
      }
    });

    if (!termsAccepted) {
      newErrors.terms = ['You must accept the Terms of Service and Privacy Policy'];
    }

    setErrors(newErrors);
    // Mark all fields as touched when submitting
    setTouchedFields({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Username already exists') {
          setErrors(prev => ({
            ...prev,
            username: ['Username is already taken']
          }));
          throw new Error('Username is already taken');
        } else if (data.error === 'Email already exists') {
          setErrors(prev => ({
            ...prev,
            email: ['Email address is already registered']
          }));
          throw new Error('Email address is already registered');
        } else {
          throw new Error(data.error || 'Registration failed');
        }
      }

      setRegistrationSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldErrors = (fieldName) => {
    const fieldErrors = errors[fieldName];
    if (!touchedFields[fieldName] || !fieldErrors || fieldErrors.length === 0) return null;
    return (
      <div className="invalid-feedback d-block">
        {fieldErrors.map((error, index) => (
          <div key={index}>{error}</div>
        ))}
      </div>
    );
  };

  const passwordRequirements = [
    'Must be at least 8 characters long',
    'Must contain at least one uppercase letter',
    'Must contain at least one lowercase letter',
    'Must contain at least one number'
  ];

  const renderPasswordGuidelines = () => {
    // Show guidelines if fields haven't been touched yet
    if (!touchedFields.password && !touchedFields.confirmPassword) {
      return (
        <Form.Text className="text-muted mt-2">
          <div>Password requirements:</div>
          <ul className="mt-1 mb-0">
            {passwordRequirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
            <li>Passwords must match</li>
          </ul>
        </Form.Text>
      );
    }
    return null;
  };

  if (registrationSuccess) {
    return (
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow">
              <Card.Body className="p-4 text-center">
                <h2 className="mb-4">Registration Successful!</h2>
                <Alert variant="success">
                  Your account has been created successfully. You can now log in to access your account.
                </Alert>
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/login')}
                  >
                    Proceed to Login
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Create Your StreamDJ Account</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>
                    Username
                  </Form.Label>
                  <Form.Control 
                    type="text" 
                    name="username"
                    placeholder="Choose a username" 
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touchedFields.username && !!errors.username?.length}
                    required
                  />
                  {renderFieldErrors('username')}
                </Form.Group>

                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control 
                    type="email" 
                    name="email"
                    placeholder="Enter email" 
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touchedFields.email && !!errors.email?.length}
                    required
                  />
                  {renderFieldErrors('email')}
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="password"
                    placeholder="Create a password" 
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touchedFields.password && !!errors.password?.length}
                    required
                  />
                  {renderFieldErrors('password')}
                </Form.Group>

                <Form.Group className="mb-3" controlId="formConfirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="confirmPassword"
                    placeholder="Confirm your password" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touchedFields.confirmPassword && !!errors.confirmPassword?.length}
                    required
                  />
                  {renderFieldErrors('confirmPassword')}
                </Form.Group>

                {/* Show password requirements before validation */}
                {renderPasswordGuidelines()}

                <Form.Group className="mb-3" controlId="formTerms">
                  <Form.Check 
                    type="checkbox" 
                    label="I agree to the Terms of Service and Privacy Policy"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      setTouchedFields(prev => ({ ...prev, terms: true }));
                    }}
                    isInvalid={touchedFields.terms && !!errors.terms}
                    required
                  />
                  {renderFieldErrors('terms')}
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-3">
                <p>Already have an account? <Link to="/login">Login</Link></p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;