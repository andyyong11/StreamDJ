import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../../services/api';

const DeleteTrackModal = ({ show, handleClose, track, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!track?.TrackID) return;
    
    try {
      setDeleting(true);
      setError(null);
      
      await api.delete(`/api/tracks/${track.TrackID}`);
      
      // Notify parent component about successful deletion
      if (onDelete) {
        onDelete(track.TrackID);
      }
      
      // Close the modal
      handleClose();
    } catch (err) {
      console.error('Error deleting track:', err);
      setError('Failed to delete track. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Track</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        <p>Are you sure you want to delete "{track?.Title}"?</p>
        <p className="text-danger">This action cannot be undone.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={deleting}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Deleting...
            </>
          ) : 'Delete Track'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteTrackModal; 