import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Nav, Tab, Dropdown, DropdownButton, Modal, Form } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaEllipsisH, FaCompactDisc, FaList, FaLink } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserListModal from '../components/modals/UserListModal';
import AlbumCard from '../components/cards/AlbumCard';
import TrackActionMenu from '../components/modals/TrackActionMenu';
import AddToPlaylistModal from '../components/modals/AddToPlaylistModal';
import DeleteTrackModal from '../components/modals/DeleteTrackModal';
import '../styles/PlayButton.css';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fileType, setFileType] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setProfileData(data);
        } else {
          if (response.status === 401) {
            console.warn('Unauthorized - logging out');
            logout();
          } else {
            console.error('Error fetching profile data:', data.message || data.error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };

    if (token) fetchProfileData();
  }, [id, token, logout]);

  const handleTabChange = (tab) => {
    if (tab.startsWith('creator-') || tab.startsWith('library-')) {
      const routes = {
        'creator-dashboard': '/creator-dashboard',
        'creator-tracks': '/creator-dashboard/my-tracks',
        'creator-albums': '/creator-dashboard/my-albums',
        'creator-playlists': '/creator-dashboard/my-playlists',
        'library-tracks': '/liked-tracks',
        'library-albums': '/liked-albums',
        'library-playlists': '/liked-playlists',
      };
      if (routes[tab]) navigate(routes[tab]);
    } else {
      setActiveTab(tab);
    }
  };

  // Toggle follow status
  const handleToggleFollow = async () => {
    if (!currentUser || !currentUser.id) {
      // Open login modal instead of navigation
      if (openLoginModal) {
        openLoginModal();
      }
      return;
    }
    
    try {
      setError(prev => ({ ...prev, followToggle: null }));
      setLoading(prev => ({ ...prev, followToggle: true }));
      
      if (isFollowing) {
        const response = await api.delete(`/api/users/${currentUser.id}/unfollow/${id}`);
        if (response?.data?.success) {
          setIsFollowing(false);
          // Decrement follower count
          if (profileData) {
            setProfileData({
              ...profileData,
              FollowersCount: Math.max(0, (profileData.FollowersCount || 0) - 1)
            });
          }
        }
      } else {
        const response = await api.post(`/api/users/${currentUser.id}/follow/${id}`);
        if (response?.data?.success) {
          setIsFollowing(true);
          // Increment follower count
          if (profileData) {
            setProfileData({
              ...profileData,
              FollowersCount: (profileData.FollowersCount || 0) + 1
            });
          }
        }
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
      setError(prev => ({ 
        ...prev, 
        followToggle: 'Could not update follow status. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, followToggle: false }));
    }
  };

  // Update the formatNumber function to better format play counts
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    
    // Convert to number if it's a string
    const count = typeof num === 'string' ? parseInt(num, 10) : num;
    
    if (isNaN(count)) return '0';
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  // Format track duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play track
  const handlePlayTrack = (track) => {
    if (playTrack) {
      playTrack(track, tracks);
    }
  };

  // Handle play playlist
  const handlePlayPlaylist = (playlistId) => {
    navigate(`/playlists/${playlistId}`);
  };

  // Handle showing followers
  const handleShowFollowers = (e) => {
    e.preventDefault();
    setShowFollowersModal(true);
  };
  
  // Handle showing following
  const handleShowFollowing = (e) => {
    e.preventDefault();
    setShowFollowingModal(true);
  };

  // Add handlers for track actions
  const handleAddToPlaylist = (track) => {
    setSelectedTrack(track);
    setShowAddToPlaylistModal(true);
  };

  const handleDeleteTrack = (track) => {
    setSelectedTrack(track);
    setShowDeleteTrackModal(true);
  };

  const handleTrackDeleted = (trackId) => {
    // Filter out the deleted track from the tracks list
    setTracks(prev => prev.filter(track => track.TrackID !== trackId));
    setShowDeleteTrackModal(false);
  };

  // Render playlists section
  const renderPlaylists = () => {
    if (loading.playlists) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading playlists...</span>
          </Spinner>
        </div>
      );
    }

    if (error.playlists) {
      return <Alert variant="danger">{error.playlists}</Alert>;
    }

    if (playlists.length === 0) {
      return <p className="text-muted">No playlists found.</p>;
    }

    return (
      <>
        {/* My Playlists */}
        <section className="mb-5">
          <h3 className="mb-4">{profileData.Username}'s Playlists</h3>
          <Row>
            {/* Add logic here to render playlists dynamically */}
          </Row>
        </section>

        {/* Albums section */}
        <section className="mb-5">
          <h3 className="mb-4">Recently Played by {profileData.Username}</h3>
          <Card>
            <Card.Body>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Plays</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Add logic here to render recently played tracks dynamically */}
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </section>
      </>
    );
  };

  const handleFileUpload = async () => {
    if (file && fileType) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`http://localhost:5001/api/users/${id}/upload-${fileType}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          setProfileData((prevData) => ({
            ...prevData,
            [fileType === 'avatar' ? 'ProfilePicture' : 'Banner']: data[fileType === 'avatar' ? 'ProfilePicture' : 'Banner'],
          }));
          setShowModal(false);
        } else {
          console.error('Failed to upload file:', data.message || data.error);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleDropdownClick = (type) => {
    setFileType(type);
    setShowModal(true);
  };

  if (!profileData) return <p>Loading...</p>;

  // Default placeholder values for avatar and banner
  const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'; // Gravatar placeholder
  const defaultBanner = 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png'; // Placeholder banner image

  return (
    <Container>
      {/* Profile Banner */}
      <Card className="mb-4">
        <Card.Img
          src={profileData.Banner || defaultBanner}  // Ensure that the placeholder is used if no banner
          alt="Profile Banner"
          className="rounded"
        />
        <Card.ImgOverlay className="d-flex flex-column justify-content-end">
          <Row className="align-items-center">
            <Col md={3} className="text-center">
              {/* Ensure that the placeholder is used if no profile picture */}
              <img
                src={profileData.ProfilePicture || defaultAvatar} 
                alt={profileData.Username}
                className="rounded-circle border border-white"
                style={{ width: '120px', height: '120px' }}
              />
            </Col>
            <Col md={6}>
              <h2 className="text-white">{profileData.Username}</h2>
              <p className="text-light">{profileData.Bio}</p>
              <Badge bg="primary" className="me-2">
                <FaUserFriends /> {profileData.FollowersCount} Followers
              </Badge>
              <Badge bg="secondary">
                <FaMusic /> {profileData.SubscriptionType}
              </Badge>
            </Col>
            <Col md={3} className="text-end">
              <div className="d-flex justify-content-end align-items-center gap-2">
                <Button variant="danger">
                  <FaHeart /> Follow
                </Button>
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="light"
                    className="no-caret"
                    id="dropdown-custom-toggle"
                  >
                    <FaEllipsisH />
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleDropdownClick('avatar')}>
                      Edit Avatar
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleDropdownClick('banner')}>
                      Edit Banner
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Col>
          </Row>
        </Card.ImgOverlay>
      </Card>

      {/* Social Links */}
      {profileData.SocialLinks && profileData.SocialLinks !== null && Object.keys(profileData.SocialLinks).length > 0 && (
        <section className="mb-4">
          <h4>Social Links</h4>
          <Row>
            {Object.keys(profileData.SocialLinks).map((social, index) => (
              <Col key={index} md={4}>
                <Button
                  variant="outline-primary"
                  href={profileData.SocialLinks[social]}
                  target="_blank"
                >
                  <FaLink className="me-2" /> {social}
                </Button>
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* Navigation Tabs */}
      <Tab.Container id="profile-tabs" activeKey={activeTab} onSelect={handleTabChange}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="overview">Overview</Nav.Link>
          </Nav.Item>

          {currentUser && currentUser.id === parseInt(id) && (
            <>
              <Nav.Item>
                <Nav.Link eventKey="creator-dashboard">Creator Dashboard</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="creator-tracks">
                  <FaMusic className="me-1" /> My Tracks
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="creator-albums">
                  <FaCompactDisc className="me-1" /> My Albums
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="creator-playlists">
                  <FaList className="me-1" /> My Playlists
                </Nav.Link>
              </Nav.Item>

              {/* Library */}
              <Nav.Item>
                <Nav.Link eventKey="library-tracks">Liked Tracks</Nav.Link>
              </Nav.Item>
            </>
          )}
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="overview">
            {renderOverviewContent()}
          </Tab.Pane>
          
          <Tab.Pane eventKey="tracks">
            <h3 className="mb-4">All Tracks by {profileData.Username}</h3>
            {renderTracksContent()}
          </Tab.Pane>
          
          <Tab.Pane eventKey="albums">
            <h3 className="mb-4">Albums by {profileData.Username}</h3>
            {renderAlbums()}
          </Tab.Pane>
          
          <Tab.Pane eventKey="playlists">
            <h3 className="mb-4">Playlists by {profileData.Username}</h3>
            {renderPlaylists()}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Modal for File Upload */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload {fileType === 'avatar' ? 'Avatar' : 'Banner'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="fileUpload">
            <Form.Label>Select {fileType === 'avatar' ? 'Avatar' : 'Banner'}</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleFileUpload}>
            Upload
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProfilePage;