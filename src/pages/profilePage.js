import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH } from 'react-icons/fa';

const ProfilePage = () => {
  // Get the profile ID from the URL
  const { id } = useParams();

  // Mock user data based on ID
  const users = {
    1: {
      name: 'DJ Sparkle',
      followers: '1.2M',
      following: 345,
      avatar: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x400',
      bio: 'Bringing the best beats to your ears. Live DJ, music producer, and sound enthusiast.'
    },
    2: {
      name: 'BeatMaster',
      followers: '980K',
      following: 210,
      avatar: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x400',
      bio: 'Hip Hop is life. Bringing the best rap beats and remixes to the stage.'
    },
    3: {
      name: 'ElectroQueen',
      followers: '1.5M',
      following: 500,
      avatar: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x400',
      bio: 'Electronic beats and house music to keep the party going all night.'
    }
  };

  // Get user data; if ID is not found, default to user 1
  const user = users[id] || users[1];

  // Mock playlists
  const playlists = [
    { id: 1, title: 'My Favorite Mixes', tracks: 20, image: 'https://via.placeholder.com/300' },
    { id: 2, title: 'Chill Out Sessions', tracks: 15, image: 'https://via.placeholder.com/300' },
    { id: 3, title: 'Top Hits', tracks: 30, image: 'https://via.placeholder.com/300' },
  ];

  // Mock recent tracks
  const recentTracks = [
    { id: 1, title: 'Summer Groove', duration: '3:45', plays: 1250000 },
    { id: 2, title: 'Midnight City', duration: '4:12', plays: 980000 },
    { id: 3, title: 'Chill Wave', duration: '5:30', plays: 750000 },
  ];

  return (
    <Container style={{ paddingTop: '80px' }}>
      {/* Profile Banner */}
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

      {/* My Playlists */}
      <section className="mb-5">
        <h3 className="mb-4">{user.name}'s Playlists</h3>
        <Row>
          {playlists.map(playlist => (
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
          ))}
        </Row>
      </section>

      {/* Recently Played Tracks */}
      <section className="mb-5">
        <h3 className="mb-4">Recently Played by {user.name}</h3>
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
      </section>
    </Container>
  );
};

export default ProfilePage;
