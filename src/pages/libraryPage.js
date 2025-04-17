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
    <Container>
      {/* Your Playlists */}
      <section>
        <h2 className="mb-4">Your Playlists</h2>
        <Row>
          {savedPlaylists.map(playlist => (
            <Col md={4} key={playlist.id}>
              <Card className="simple-card mb-4">
                <Card.Img variant="top" src={playlist.image} />
                <Card.Body>
                  <h5>{playlist.title}</h5>
                  <p className="text-muted">
                    By {playlist.creator} • {playlist.tracks} tracks
                  </p>
                  <div className="d-flex justify-content-between">
                    <Button variant="success" className="neon-play-btn">
                      <FaPlay /> Play
                    </Button>
                    <Button variant="outline-danger" className="like-btn">
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
      <section>
        <h2 className="mb-4">Liked Tracks</h2>
        <table className="table">
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
      </section>

      {/* Followed Artists */}
      <section>
        <h2 className="mb-4">Followed Artists</h2>
        <Row>
          {followedArtists.map(artist => (
            <Col md={4} key={artist.id}>
              <Card className="text-center simple-card mb-4">
                <Card.Body>
                  <h3>{artist.name}</h3>
                  <p>{artist.followers} followers</p>
                  <Button variant="outline-primary" as={Link} to={`/profile/${artist.id}`}>
                    View Profile
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Container>
  );
};

export default LibraryPage;
