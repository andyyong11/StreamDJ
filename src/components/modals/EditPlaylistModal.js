import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../../services/api';

const EditPlaylistModal = ({ show, handleClose, playlist, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with playlist data when modal shows
  React.useEffect(() => {
    if (show && playlist) {
      setFormData({
        title: playlist.Title || '',
        description: playlist.Description || '',
        isPublic: playlist.IsPublic !== false
      });
    }
  }, [show, playlist]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (!formData.title.trim()) {
        setError('Playlist title is required');
        setLoading(false);
        return;
      }
      
      // Update playlist via API
      const response = await api.put(`/api/playlists/${playlist.PlaylistID || playlist.id}`, {
        title: formData.title,
        description: formData.description,
        isPublic: formData.isPublic
      });
      
      // Call the onUpdate callback with updated data
      if (onUpdate && response?.data) {
        onUpdate(response.data);
      }
      
      // Close the modal
      handleClose();
    } catch (err) {
      console.error('Error updating playlist:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to update playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Playlist</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description (optional)"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Public playlist"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
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
      </Modal.Footer>
    </Modal>
  );
};

export default EditPlaylistModal; 