import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaPlay, FaHeart, FaMusic } from 'react-icons/fa';
import '../styles/PlayButton.css';

const DiscoverPage = () => {
  // Mock data
  const trendingPlaylists = [
    { id: 1, title: 'Global Top 50', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Musicothek.jpg/800px-Musicothek.jpg', creator: 'StreamDJ', tracks: 50 },
    { id: 2, title: 'Hip Hop Heat', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Hip-hop_music_concert.jpg/800px-Hip-hop_music_concert.jpg', creator: 'RapVibes', tracks: 40 },
    { id: 3, title: 'Electronic Essentials', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Electronic_Music_Festival.jpg/800px-Electronic_Music_Festival.jpg', creator: 'ElectroMaster', tracks: 35 },
    { id: 4, title: 'Jazz Lounge', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Cool_jazz_session.jpg/800px-Cool_jazz_session.jpg', creator: 'SmoothJazz', tracks: 25 }
  ];

  const genres = [
    { id: 1, name: 'Hip Hop', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/A_hip-hop_dancer_in_Washington_DC.jpg/800px-A_hip-hop_dancer_in_Washington_DC.jpg' },
    { id: 2, name: 'Electronic', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Techno_Club.jpg/800px-Techno_Club.jpg' },
    { id: 3, name: 'Pop', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Pop_music_concert.jpg/800px-Pop_music_concert.jpg' },
    { id: 4, name: 'Jazz', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Jazz_en_La_Costa-2.jpg/800px-Jazz_en_La_Costa-2.jpg' },
    { id: 5, name: 'Rock', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Metal_Concert_Romania.jpg/800px-Metal_Concert_Romania.jpg' }
  ];

  const newReleases = [
    { id: 1, title: 'Skybound', artist: 'NovaBeats', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Sound_Studio_Setup.jpg/800px-Sound_Studio_Setup.jpg', duration: '3:42' },
    { id: 2, title: 'Midnight Drive', artist: 'NightVibe', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/City_Lights_at_Night.jpg/800px-City_Lights_at_Night.jpg', duration: '4:15' },
    { id: 3, title: 'Electric Dreams', artist: 'SynthWave', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Synthesizer_Studio.jpg/800px-Synthesizer_Studio.jpg', duration: '3:58' }
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
                <div className="position-relative">
                  <Card.Img variant="top" src={pl.image} />
                  <Button 
                    variant="success"
                    className="play-button"
                  >
                    <FaPlay />
                  </Button>
                </div>
                <Card.Body>
                  <Card.Title>{pl.title}</Card.Title>
                  <Card.Text>By {pl.creator} • {pl.tracks} tracks</Card.Text>
                  <div className="d-flex justify-content-end">
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
                <div className="position-relative">
                  <Card.Img variant="top" src={release.image} />
                  <Button 
                    variant="success"
                    className="play-button"
                  >
                    <FaPlay />
                  </Button>
                </div>
                <Card.Body>
                  <Card.Title>{release.title}</Card.Title>
                  <Card.Text>By {release.artist}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <span><FaMusic className="me-1" /> {release.duration}</span>
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
