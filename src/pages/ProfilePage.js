import React from 'react';
import { Container, Row, Col, Card, Image, Button, ListGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaCalendar, FaSignOutAlt, FaMusic, FaHeart } from 'react-icons/fa';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Container>
      <Row className="mt-4">
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body className="text-center">
              <div className="position-relative">
                <Image
                  src={user?.ProfilePicture || 'https://via.placeholder.com/150'}
                  roundedCircle
                  className="mb-3"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
                <Button 
                  variant="light" 
                  size="sm" 
                  className="position-absolute bottom-0 end-0"
                  title="Change Profile Picture"
                >
                  <FaUser />
                </Button>
              </div>
              <Card.Title className="fs-4 mb-3">{user?.Username}</Card.Title>
              <Card.Subtitle className="mb-3 text-muted">{user?.Role || 'Listener'}</Card.Subtitle>
              <Card.Text>{user?.Bio || 'No bio yet'}</Card.Text>
              <Button 
                variant="danger" 
                onClick={handleLogout}
                className="w-100"
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </Button>
            </Card.Body>
          </Card>

          <Card className="mt-4 shadow-sm">
            <Card.Header>Profile Information</Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <FaEnvelope className="me-2 text-muted" />
                {user?.Email}
              </ListGroup.Item>
              <ListGroup.Item>
                <FaCalendar className="me-2 text-muted" />
                Joined: {new Date(user?.CreatedAt).toLocaleDateString()}
              </ListGroup.Item>
              <ListGroup.Item>
                <FaMusic className="me-2 text-muted" />
                Subscription: {user?.SubscriptionType || 'Free'}
              </ListGroup.Item>
              <ListGroup.Item>
                <FaHeart className="me-2 text-muted" />
                Followers: {user?.FollowersCount || 0}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>
              <h4 className="mb-0">My Playlists</h4>
            </Card.Header>
            <Card.Body>
              {user?.playlists?.length > 0 ? (
                user.playlists.map(playlist => (
                  <Card key={playlist.id} className="mb-2">
                    <Card.Body>
                      <Card.Title>{playlist.title}</Card.Title>
                      <Card.Text>{playlist.trackCount} tracks</Card.Text>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <div className="text-center py-5 text-muted">
                  <FaMusic size={48} className="mb-3" />
                  <h5>No Playlists Yet</h5>
                  <p>Create your first playlist to start organizing your music!</p>
                  <Button variant="primary">Create Playlist</Button>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="mt-4 shadow-sm">
            <Card.Header>
              <h4 className="mb-0">Recent Activity</h4>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>No recent activity</ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
