import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const RegisterModal = ({ show, handleClose }) => {
  const { registerWithRetry } = useAuth();
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateField = (name, value) => {
    const errors = [];
    switch (name) {
      case 'username':
        if (value.length < 4) errors.push('Username must be at least 4 characters');
        if (!/^[a-zA-Z0-9_]+$/.test(value)) errors.push('Only letters, numbers, and underscores allowed');
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push('Enter a valid email');
        break;
      case 'password':
        if (value.length < 8) errors.push('At least 8 characters');
        if (!/(?=.*[a-z])/.test(value)) errors.push('Include lowercase letter');
        if (!/(?=.*[A-Z])/.test(value)) errors.push('Include uppercase letter');
        if (!/(?=.*\d)/.test(value)) errors.push('Include a number');
        break;
      case 'confirmPassword':
        if (value !== formData.password) errors.push('Passwords must match');
        break;
      default:
        break;
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touchedFields[name]) {
      const fieldErrors = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: fieldErrors }));
      if (name === 'password' && formData.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: validateField('confirmPassword', formData.confirmPassword)
        }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key]);
      if (fieldErrors.length) newErrors[key] = fieldErrors;
    });
    if (!termsAccepted) {
      newErrors.terms = ['You must accept the terms'];
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    try {
      await registerWithRetry(
        formData.username,
        formData.email,
        formData.password
      );

      handleClose();
      
      // Force refresh the page to update UI with the logged-in state
      window.location.reload();
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific error types
      if (err.message.includes('Username')) {
        setErrors(prev => ({ ...prev, username: [err.message] }));
      } else if (err.message.includes('Email')) {
        setErrors(prev => ({ ...prev, email: [err.message] }));
      }
      
      if (err.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFieldErrors = (name) => {
    return touchedFields[name] && errors[name]?.length ? (
      <div className="invalid-feedback d-block">{errors[name].map((e, i) => <div key={i}>{e}</div>)}</div>
    ) : null;
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create an Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="registerUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text" name="username" value={formData.username}
              onChange={handleChange} onBlur={handleBlur}
              isInvalid={touchedFields.username && !!errors.username?.length}
              required
            />
            {renderFieldErrors('username')}
          </Form.Group>
          <Form.Group className="mb-3" controlId="registerEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email" name="email" value={formData.email}
              onChange={handleChange} onBlur={handleBlur}
              isInvalid={touchedFields.email && !!errors.email?.length}
              required
            />
            {renderFieldErrors('email')}
          </Form.Group>
          <Form.Group className="mb-3" controlId="registerPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password" name="password" value={formData.password}
              onChange={handleChange} onBlur={handleBlur}
              isInvalid={touchedFields.password && !!errors.password?.length}
              required
            />
            {renderFieldErrors('password')}
          </Form.Group>
          <Form.Group className="mb-3" controlId="registerConfirmPassword">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password" name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} onBlur={handleBlur}
              isInvalid={touchedFields.confirmPassword && !!errors.confirmPassword?.length}
              required
            />
            {renderFieldErrors('confirmPassword')}
          </Form.Group>
          <Form.Group className="mb-3" controlId="registerTerms">
            <Form.Check
              type="checkbox"
              label="I accept the Terms of Service and Privacy Policy"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              isInvalid={touchedFields.terms && !!errors.terms}
              required
            />
            {renderFieldErrors('terms')}
          </Form.Group>
          <div className="d-grid gap-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default RegisterModal;