import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import axios from 'axios';

const StreamControls = ({ streamId, streamData, onStreamUpdated, viewerCount = 0 }) => {
  const [title, setTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (streamData) {
      setTitle(streamData.Title || '');
    }
  }, [streamData]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset to current values when entering edit mode
      setTitle(streamData.Title || '');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5001/api/streams/${streamId}`,
        { title },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Stream details updated successfully');
        setIsEditing(false);
        if (onStreamUpdated) {
          onStreamUpdated({
            ...streamData,
            Title: title
          });
        }
      } else {
        setError(response.data.error || 'Failed to update stream');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      console.error('Error updating stream:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!window.confirm('Are you sure you want to end this stream?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/streams/${streamId}/end`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        navigate('/live-streams');
      } else {
        setError(response.data.error || 'Failed to end stream');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      console.error('Error ending stream:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="stream-controls-container">
      <Card.Header className="d-flex justify-content-between align-items-center bg-dark text-white">
        <div className="d-flex align-items-center">
          <h5 className="mb-0">Stream Controls</h5>
          <Badge 
            bg="danger" 
            className="ms-2 d-flex align-items-center"
            style={{ fontSize: '0.85rem', padding: '0.35em 0.65em' }}
          >
            <FaEye className="me-1" /> {viewerCount} Live Viewers
          </Badge>
        </div>
        <Button 
          variant="outline-light" 
          size="sm" 
          onClick={toggleEdit}
          disabled={isLoading}
        >
          {isEditing ? 'Cancel' : 'Edit Details'}
        </Button>
      </Card.Header>
      <Card.Body className="bg-dark text-white">
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {isEditing ? (
          <Form onSubmit={handleUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>Stream Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter stream title"
                maxLength={100}
                required
                className="bg-dark text-white border-secondary"
              />
              <Form.Text className="text-muted">
                Viewer count will be automatically added to your title
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        ) : (
          <div>
            <h5>{title || 'Untitled Stream'}</h5>
            <p className="text-muted mb-0">
              <small>Live viewers are automatically tracked and displayed with your stream.</small>
            </p>
          </div>
        )}
        
        <hr className="border-secondary" />
        
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <p className="mb-0"><strong>Stream ID:</strong> {streamId}</p>
            <p className="mb-0"><small className="text-muted">Stream Key: {streamData?.StreamKey}</small></p>
            <p className="mb-0 mt-1">
              <Badge bg="dark" className="border border-light">
                <FaEye className="me-1" /> {viewerCount} watching now
              </Badge>
            </p>
          </div>
          <Button
            variant="danger"
            onClick={handleEndStream}
            disabled={isLoading}
          >
            End Stream
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StreamControls; 