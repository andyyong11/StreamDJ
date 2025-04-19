import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CreateStreamPage = () => {
  const [title, setTitle] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generateStreamKey = () => {
    // Generate a random stream key
    const key = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
    setStreamKey(key);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/streams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          userId: user?.id || 1,
          streamUrl: `https://streamdj.com/${streamKey}`,
          status: 'active'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create stream');
      }

      const data = await response.json();
      setSuccess('Stream created successfully! You can now start streaming using OBS.');
      navigate(`/stream/${streamKey}`);
    } catch (error) {
      setError(error.message || 'Failed to create stream. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Create New Stream</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Stream Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your stream title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={50}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Stream Key</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={streamKey}
                  readOnly
                  placeholder="Click generate to get your stream key"
                />
                <Button variant="secondary" onClick={generateStreamKey}>
                  Generate
                </Button>
              </div>
              <Form.Text className="text-muted">
                You'll need this key to stream using OBS. Keep it secret!
              </Form.Text>
            </Form.Group>

            <div className="mt-4">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={!title || !streamKey || isLoading}
              >
                Create Stream
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <h5>How to Stream</h5>
          <ol className="mb-0">
            <li>Create your stream by filling out the form above</li>
            <li>Open OBS Studio</li>
            <li>Go to Settings > Stream</li>
            <li>Select "Custom" as the service</li>
            <li>Set Server URL to: rtmp://localhost:1935/live</li>
            <li>Set Stream Key to the generated key above</li>
            <li>Click "Start Streaming" in OBS when ready</li>
          </ol>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateStreamPage; 