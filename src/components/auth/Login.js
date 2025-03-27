import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {w ,FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call
    try {
      // In a real app, you would call your authentication API here
      console.log('Logging in with:', { email, password });
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, let's pretend login was successful
      // In a real app, you would redirect to dashboard or home page
      setLoading(false);
      
      // Redirect would happen here
      window.location.href = '/';
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Login to StreamDJ</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="Enter email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formRemember">
                  <Form.Check type="checkbox" label="Remember me" />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-3">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <hr className="my-4" />

              <div className="text-center">
                <p>Or login with:</p>
                <div className="d-flex justify-content-center gap-3">
                  <Button variant="outline-primary">
                    <FaGoogle /> Google
                  </Button>
                  <Button variant="outline-primary">
                    <FaFacebook /> Facebook
                  </Button>
                  <Button variant="outline-dark">
                    <FaApple /> Apple
                  </Button>
                </div>
              </div>

              <div className="text-center mt-3">
                <p>Don't have an account? <Link to="/register">Sign up</Link></p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;