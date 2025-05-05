import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { FaPlus, FaMusic } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AddToPlaylistModal = ({ show, handleClose, track }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [adding, setAdding] = useState(false);

  // Fetch user's playlists when the modal opens
  useEffect(() => {
    if (show && user) {
      fetchUserPlaylists();
    }
  }, [show, user]);

  const fetchUserPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/playlists/user/${user.id}`);
      if (response?.data) {
        setPlaylists(response.data);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('Could not load your playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlaylist = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    setCreatingNew(false);
  };

  const handleToggleCreateNew = () => {
    setCreatingNew(!creatingNew);
    setSelectedPlaylistId(null);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    try {
      setAdding(true);
      setError(null);
      
      // Create a new playlist
      const createResponse = await api.post('/api/playlists', {
        title: newPlaylistName,
        description: `Playlist created for ${track.Title}`,
        userId: user.id
      });
      
      if (createResponse?.data?.id) {
        // Add the track to the newly created playlist
        await api.post(`/api/playlists/${createResponse.data.id}/tracks`, {
          trackId: track.TrackID
        });
        
        setSuccess(`Track added to your new playlist "${newPlaylistName}"`);
        setNewPlaylistName('');
        setCreatingNew(false);
        
        // Refresh playlists
        fetchUserPlaylists();
        
        // Auto-close after a delay
        setTimeout(() => {
          handleClose();
          setSuccess(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      setError('Please select a playlist');
      return;
    }

    try {
      setAdding(true);
      setError(null);
      
      // Add track to the selected playlist
      await api.post(`/api/playlists/${selectedPlaylistId}/tracks`, {
        trackId: track.TrackID
      });
      
      const playlist = playlists.find(p => p.PlaylistID === selectedPlaylistId);
      setSuccess(`Track added to "${playlist?.Title || 'playlist'}"`);
      
      // Auto-close after a delay
      setTimeout(() => {
        handleClose();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Error adding to playlist:', err);
      setError('Failed to add track to playlist. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleModalClose = () => {
    // Reset state
    setSelectedPlaylistId(null);
    setCreatingNew(false);
    setNewPlaylistName('');
    setError(null);
    setSuccess(null);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleModalClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add to Playlist</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {track && (
          <div className="mb-3">
            <strong>Track: </strong> {track.Title}
          </div>
        )}
        
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-3">
            {success}
          </Alert>
        )}
        
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading playlists...</span>
            </Spinner>
          </div>
        ) : (
          <>
            {playlists.length === 0 ? (
              <div className="text-center py-2 mb-3">
                <p className="mb-0">You don't have any playlists yet.</p>
              </div>
            ) : (
              <ListGroup className="mb-3">
                {playlists.map(playlist => (
                  <ListGroup.Item 
                    key={playlist.PlaylistID}
                    action
                    active={selectedPlaylistId === playlist.PlaylistID}
                    onClick={() => handleSelectPlaylist(playlist.PlaylistID)}
                    className="d-flex align-items-center"
                  >
                    <FaMusic className="me-2" />
                    <div>
                      <div>{playlist.Title}</div>
                      <small className="text-muted">{playlist.TrackCount || 0} tracks</small>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
            
            {creatingNew ? (
              <Form className="mb-3">
                <Form.Group>
                  <Form.Label>New Playlist Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    autoFocus
                  />
                </Form.Group>
              </Form>
            ) : (
              <Button 
                variant="outline-primary" 
                className="w-100 mb-3"
                onClick={handleToggleCreateNew}
              >
                <FaPlus className="me-1" /> Create New Playlist
              </Button>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalClose}>
          Cancel
        </Button>
        {creatingNew ? (
          <Button 
            variant="primary" 
            onClick={handleCreatePlaylist}
            disabled={adding || !newPlaylistName.trim()}
          >
            {adding ? 'Creating...' : 'Create & Add'}
          </Button>
        ) : (
          <Button 
            variant="primary" 
            onClick={handleAddToPlaylist}
            disabled={adding || !selectedPlaylistId}
          >
            {adding ? 'Adding...' : 'Add to Playlist'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default AddToPlaylistModal; 