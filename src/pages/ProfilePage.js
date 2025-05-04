import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Nav, Tab } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaEllipsisH, FaCompactDisc, FaList, FaLink } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);

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

  const renderOverviewContent = () => {
    return (
      <>
        {/* My Playlists */}
        <section className="mb-5">
          <h3 className="mb-4">{profileData.Username}'s Playlists</h3>
          <Row>
            {/* Add logic here to render playlists dynamically */}
          </Row>
        </section>

        {/* Recently Played Tracks */}
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

  if (!profileData) return <p>Loading...</p>;

  // Default placeholder values for avatar and banner
  const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  const defaultBanner = 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png';

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
              <Button variant="danger" className="me-2">
                <FaHeart /> Follow
              </Button>
              <Button variant="light">
                <FaEllipsisH />
              </Button>
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
                <Nav.Link eventKey="library-tracks">
                  <FaMusic className="me-1" /> Liked Tracks
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="library-albums">
                  <FaCompactDisc className="me-1" /> Liked Albums
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="library-playlists">
                  <FaList className="me-1" /> Liked Playlists
                </Nav.Link>
              </Nav.Item>
            </>
          )}
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="overview">
            {renderOverviewContent()}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default ProfilePage;