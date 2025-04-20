import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart } from 'react-icons/fa';

const LibraryPage = () => {
  // Mock data
  const savedPlaylists = [
    { id: 1, title: 'Lo-Fi Study', creator: 'DJ Focus', image: 'https://via.placeholder.com/300', tracks: 22 },
    { id: 2, title: 'Late Night Chill', creator: 'RelaxBeats', image: 'https://via.placeholder.com/300', tracks: 30 }
  ];

  const likedTracks = [
    { id: 1, title: 'Dreaming', artist: 'NightWave', duration: '3:25' },
    { id: 2, title: 'Skyline', artist: 'LoFiZone', duration: '4:02' },
    { id: 3, title: 'Rainy Mood', artist: 'Quiet Storm', duration: '3:58' }
  ];

  const followedArtists = [
    { id: 1, name: 'DJ Chill', genre: 'Lo-Fi', image: 'https://via.placeholder.com/150', followers: '820K' },
    { id: 2, name: 'BassBeats', genre: 'Electronic', image: 'https://via.placeholder.com/150', followers: '1.1M' }
  ];

  return (
    <Container style={{ paddingTop: '80px' }}>
      {/* Saved Playlists */}
      <section className="mb-5">
        <h2 className="mb-4">Your Playlists</h2>
        <Row>
          {savedPlaylists.map(playlist => (
            <Col md={3} key={playlist.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={playlist.image} />
                <Card.Body>
                  <Card.Title>{playlist.title}</Card.Title>
                  <Card.Text>
                    By {playlist.creator} • {playlist.tracks} tracks
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <Button variant="success" size="sm">
                      <FaPlay className="me-1" /> Play
                    </Button>
                    <Button variant="outline-danger" size="sm">
                      <FaHeart />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Liked Tracks */}
      <section className="mb-5">
        <h2 className="mb-4">Liked Tracks</h2>
        <Card className="shadow-sm">
          <Card.Body>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {likedTracks.map((track, index) => (
                  <tr key={track.id}>
                    <td>{index + 1}</td>
                    <td>{track.title}</td>
                    <td>{track.artist}</td>
                    <td>{track.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Body>
        </Card>
      </section>

      {/* Followed Artists */}
      <section className="mb-5">
        <h2 className="mb-4">Followed Artists</h2>
        <Row>
          {followedArtists.map(artist => (
            <Col md={3} key={artist.id} className="mb-4 text-center">
              <Card className="h-100 shadow-sm p-3">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="rounded-circle mb-2"
                  style={{ width: '100px', height: '100px' }}
                />
                <h5>{artist.name}</h5>
                <p className="text-muted">{artist.genre}</p>
                <p className="small">{artist.followers} followers</p>
                <Button variant="outline-primary" size="sm" as={Link} to={`/profile/${artist.id}`}>
                  View Profile
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Container>
  );
};

export default LibraryPage;
