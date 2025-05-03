import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH } from 'react-icons/fa';

const ProfilePage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = 'http://localhost:5001';

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const [userRes, playlistsRes, tracksRes] = await Promise.all([
          fetch(`${BASE_URL}/api/users/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch(`${BASE_URL}/api/users/${id}/playlists`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch(`${BASE_URL}/api/users/${id}/recent-tracks`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        if (!userRes.ok || !playlistsRes.ok || !tracksRes.ok) {
          throw new Error('One or more requests failed');
        }

        const userData = await userRes.json();
        const playlistData = await playlistsRes.json();
        const trackData = await tracksRes.json();

        setUser(userData);
        setPlaylists(playlistData);
        setRecentTracks(trackData);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-5">
        <p>{error}</p>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="text-center py-5">
        <p>User not found.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Card className="mb-4">
        <Card.Img src={user.banner} alt="Profile Banner" className="rounded" />
        <Card.ImgOverlay className="d-flex flex-column justify-content-end">
          <Row className="align-items-center">
            <Col md={3} className="text-center">
              <img
                src={user.avatar}
                alt={user.name}
                className="rounded-circle border border-white"
                style={{ width: '120px', height: '120px' }}
              />
            </Col>
            <Col md={6}>
              <h2 className="text-white">{user.name}</h2>
              <p className="text-light">{user.bio}</p>
              <Badge bg="primary" className="me-2">
                <FaUserFriends /> {user.followers} Followers
              </Badge>
              <Badge bg="secondary">
                <FaMusic /> {user.following} Following
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

      <section className="mb-5">
        <h3 className="mb-4">{user.name}'s Playlists</h3>
        <Row>
          {playlists.length ? (
            playlists.map(playlist => (
              <Col md={4} key={playlist.id} className="mb-4">
                <Card className="shadow-sm">
                  <Card.Img variant="top" src={playlist.image} />
                  <Card.Body>
                    <Card.Title>{playlist.title}</Card.Title>
                    <Card.Text>{playlist.tracks} tracks</Card.Text>
                    <Button variant="success" size="sm">
                      <FaPlay className="me-1" /> Play
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col className="text-center">
              <p>No playlists available.</p>
            </Col>
          )}
        </Row>
      </section>

      <section className="mb-5">
        <h3 className="mb-4">Recently Played by {user.name}</h3>
        {recentTracks.length ? (
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
                  {recentTracks.map((track, index) => (
                    <tr key={track.id}>
                      <td>{index + 1}</td>
                      <td>{track.title}</td>
                      <td>{track.duration}</td>
                      <td>{track.plays.toLocaleString()}</td>
                      <td>
                        <Button variant="link" className="p-0">
                          <FaEllipsisH />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Body>
          </Card>
        ) : (
          <p>No recent tracks available.</p>
        )}
      </section>
    </Container>
  );
};

export default ProfilePage;