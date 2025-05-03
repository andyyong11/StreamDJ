import React, { useState } from 'react';
import { Modal, Form, Button, Alert, ModalHeader } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ show, handleClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithRetry } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use the new retry mechanism
      await loginWithRetry(email, password);
      
      // Close the modal and refresh the current page
      handleClose();
      
      // Force refresh the current page to reload components with user data
      window.location.reload();
    } catch (err) {
      console.error('Login error:', err);
      
      // Show appropriate error message
      if (err.message.includes('Network Error')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Login to StreamDJ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className='mb-3'>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter email"
            />
          </Form.Group>
          <Form.Group className='mb-3'>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </Form.Group>
          <div className="d-grid gap-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Logging in...' : "Login"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>    
  );
};

export default LoginModal;