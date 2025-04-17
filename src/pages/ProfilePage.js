import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Mock user data based on ID
  const users = {
    1: {
      name: 'DJ Sparkle',
      followers: '1.2M',
      following: 345,
      avatar: 'https://via.placeholder.com/150',
      banner: 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png',
      bio: 'Bringing the best beats to your ears. Live DJ, music producer, and sound enthusiast.'
    },
    2: {
      name: 'BeatMaster',
      followers: '980K',
      following: 210,
      avatar: 'https://via.placeholder.com/150',
      banner: 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png',
      bio: 'Hip Hop is life. Bringing the best rap beats and remixes to the stage.'
    },
    3: {
      name: 'ElectroQueen',
      followers: '1.5M',
      following: 500,
      avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCJkAoQFnKSizD__XWUr1_RhK86R8E7h8I0g&s',
      banner: 'https://i.etsystatic.com/34466454/r/il/730751/4475686453/il_fullxfull.4475686453_n0ds.jpg',
      bio: 'Electronic beats and house music to keep the party going all night.'
    }
  };

  // Get user data; if ID is not found, default to user 1
  const profileData = users[id] || users[1];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock playlists
  const playlists = [
    { id: 1, title: 'My Favorite Mixes', tracks: 20, image: 'https://preview.redd.it/heres-some-playlist-icons-in-the-style-of-liked-songs-you-v0-cahrrr1is8ee1.png?width=473&format=png&auto=webp&s=e33bfdb466d30f69fa4209b41f90dc7e41f0e609' },
    { id: 2, title: 'Chill Out Sessions', tracks: 15, image: 'https://lofigirl.com/wp-content/uploads/2023/02/DAY_UPDATE_ILLU.jpg' },
    { id: 3, title: 'Top Hits', tracks: 30, image: 'https://i.scdn.co/image/ab67616d0000b273016d1a64505bc840c5e60469' },
  ];

  // Mock recent tracks
  const recentTracks = [
    { id: 1, title: 'Summer Groove', duration: '3:45', plays: 1250000 },
    { id: 2, title: 'Midnight City', duration: '4:12', plays: 980000 },
    { id: 3, title: 'Chill Wave', duration: '5:30', plays: 750000 },
  ];

  return (
    <Container>
      {/* Profile Banner */}
      <Card className="mb-4">
        <Card.Img src={profileData.banner} alt="Profile Banner" className="rounded" />
        <Card.ImgOverlay className="d-flex flex-column justify-content-end">
          <Row className="align-items-center">
            <Col md={3} className="text-center">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="rounded-circle border border-white"
                style={{ width: '120px', height: '120px' }}
              />
            </Col>
            <Col md={6}>
              <h2 className="text-white">{profileData.name}</h2>
              <p className="text-light">{profileData.bio}</p>
              <Badge bg="primary" className="me-2">
                <FaUserFriends /> {profileData.followers} Followers
              </Badge>
              <Badge bg="secondary">
                <FaMusic /> {profileData.following} Following
              </Badge>
            </Col>
            <Col md={3} className="text-end">
              {user && user.username === id ? (
                <Button variant="danger" className="me-2" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </Button>
              ) : (
                <Button variant="danger" className="me-2">
                  <FaHeart /> Follow
                </Button>
              )}
              <Button variant="light">
                <FaEllipsisH />
              </Button>
            </Col>
          </Row>
        </Card.ImgOverlay>
      </Card>

      {/* My Playlists */}
      <section className="mb-5">
        <h3 className="mb-4">{profileData.name}'s Playlists</h3>
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
        <h3 className="mb-4">Recently Played by {profileData.name}</h3>
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
