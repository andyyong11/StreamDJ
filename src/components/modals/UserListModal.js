import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import api from '../../services/api';

const UserListModal = ({ show, onHide, userId, type, title }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (!show || !userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let endpoint;
        if (type === 'followers') {
          endpoint = `/api/users/${userId}/followers`;
        } else if (type === 'following') {
          endpoint = `/api/users/${userId}/following`;
        } else {
          throw new Error('Invalid user list type');
        }
        
        const response = await api.get(endpoint);
        if (response?.data) {
          setUsers(response.data);
        }
      } catch (err) {
        console.error(`Error fetching ${type}:`, err);
        setError(`Could not load ${type}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [show, userId, type]);
  
  const handleClose = () => {
    onHide();
  };
  
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || type}</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : users.length === 0 ? (
          <p className="text-center text-muted">No users found</p>
        ) : (
          <ListGroup>
            {users.map(user => (
              <ListGroup.Item key={user.UserID} className="d-flex align-items-center py-3">
                <div 
                  className="rounded-circle overflow-hidden me-3" 
                  style={{ width: '40px', height: '40px', flexShrink: 0 }}
                >
                  {user.ProfileImage ? (
                    <img 
                      src={user.ProfileImage.startsWith('http') 
                          ? user.ProfileImage 
                          : `http://localhost:5001/${user.ProfileImage.replace(/^\/+/, '')}`} 
                      alt={user.Username}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/40?text=User';
                      }}
                    />
                  ) : (
                    <FaUserCircle size={40} className="text-secondary" />
                  )}
                </div>
                
                <div className="flex-grow-1">
                  <h6 className="mb-0">
                    <Link 
                      to={`/profile/${user.UserID}`} 
                      className="text-decoration-none"
                      onClick={handleClose}
                    >
                      {user.Username}
                    </Link>
                  </h6>
                  {user.Bio && (
                    <p className="text-muted small mb-0 text-truncate">
                      {user.Bio}
                    </p>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserListModal; 