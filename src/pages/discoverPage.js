import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeart, FaMusic } from 'react-icons/fa';

const DiscoverPage = () => {
  // Mock data
  const trendingPlaylists = [
    { id: 1, title: 'Global Top 50', image: 'https://via.placeholder.com/300', creator: 'StreamDJ', tracks: 50 },
    { id: 2, title: 'Hip Hop Heat', image: 'https://via.placeholder.com/300', creator: 'RapVibes', tracks: 40 },
    { id: 3, title: 'Electronic Essentials', image: 'https://via.placeholder.com/300', creator: 'ElectroMaster', tracks: 35 },
    { id: 4, title: 'Jazz Lounge', image: 'https://via.placeholder.com/300', creator: 'SmoothJazz', tracks: 25 }
  ];

  const genres = [
    { id: 1, name: 'Hip Hop', image: 'https://via.placeholder.com/250x150?text=Hip+Hop' },
    { id: 2, name: 'Electronic', image: 'https://via.placeholder.com/250x150?text=Electronic' },
    { id: 3, name: 'Pop', image: 'https://via.placeholder.com/250x150?text=Pop' },
    { id: 4, name: 'Jazz', image: 'https://via.placeholder.com/250x150?text=Jazz' },
    { id: 5, name: 'Rock', image: 'https://via.placeholder.com/250x150?text=Rock' }
  ];

  const newReleases = [
    { id: 1, title: 'Skybound', artist: 'NovaBeats', image: 'https://via.placeholder.com/300', duration: '3:42' },
    { id: 2, title: 'Midnight Drive', artist: 'NightVibe', image: 'https://via.placeholder.com/300', duration: '4:15' },
    { id: 3, title: 'Electric Dreams', artist: 'SynthWave', image: 'https://via.placeholder.com/300', duration: '3:58' }
  ];

  return (
    <Container style={{ paddingTop: '80px' }}>
      {/* Trending Playlists */}
      <section className="mb-5">
        <h2 className="mb-4">Trending Playlists</h2>
        <Row>
          {trendingPlaylists.map(pl => (
            <Col md={3} key={pl.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={pl.image} />
                <Card.Body>
                  <Card.Title>{pl.title}</Card.Title>
                  <Card.Text>By {pl.creator} • {pl.tracks} tracks</Card.Text>
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

      {/* Genres */}
      <section className="mb-5">
        <h2 className="mb-4">Browse by Genre</h2>
        <Row>
          {genres.map(genre => (
            <Col md={2} key={genre.id} className="mb-4 text-center">
              <Card className="h-100 border-0">
                <Card.Img src={genre.image} className="rounded mb-2" />
                <Card.Body className="p-0">
                  <h6>{genre.name}</h6>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* New Releases */}
      <section className="mb-5">
        <h2 className="mb-4">New Releases</h2>
        <Row>
          {newReleases.map(release => (
            <Col md={4} key={release.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={release.image} />
                <Card.Body>
                  <Card.Title>{release.title}</Card.Title>
                  <Card.Text>By {release.artist}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <span><FaMusic className="me-1" /> {release.duration}</span>
                    <Button variant="primary" size="sm">
                      <FaPlay className="me-1" /> Play
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Container>
  );
};

export default DiscoverPage;
