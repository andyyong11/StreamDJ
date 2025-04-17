import React from 'react';
import { Container, Row, Col, Card, Button, Carousel, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaHeadphones, FaMicrophone, FaEllipsisH, FaUsers, FaStar } from 'react-icons/fa';
import '../App.css';

const HomePage = () => {
  // Mock data for featured content
  const featuredPlaylists = [
    { id: 1, title: 'Summer Hits 2023', creator: 'StreamDJ', image: 'https://thumbs.dreamstime.com/b/happy-new-year-happy-new-year-greeting-card-colorful-fireworks-sparkling-burning-number-beautiful-holiday-web-banner-248472064.jpg', tracks: 25 },
    { id: 2, title: 'Chill Vibes', creator: 'DJ Relaxx', image: 'https://lofigirl.com/wp-content/uploads/2023/02/DAY_UPDATE_ILLU.jpg', tracks: 18 },
    { id: 3, title: 'Workout Mix', creator: 'FitBeats', image: 'https://thumbs.dreamstime.com/b/weightlifter-clapping-hands-preparing-workout-gym-focus-dust-112033565.jpg', tracks: 32 },
    { id: 4, title: 'EDM Anthems', creator: 'ElectroMaster', image: 'https://www.ikmultimedia.com/products/stedm/main-banner/mobile.jpg', tracks: 40 }
  ];

  const liveStreams = [
    { id: 1, title: 'Friday Night Party', dj: 'DJ Sparkle', listeners: 1243, image: 'https://via.placeholder.com/300' },
    { id: 2, title: 'Ambient Sounds', dj: 'ChillWave', listeners: 856, image: 'https://via.placeholder.com/300' },
    { id: 3, title: 'Hip Hop Mix', dj: 'BeatMaster', listeners: 2105, image: 'https://via.placeholder.com/300' }
  ];

  const topArtists = [
    { id: 1, name: 'ElectroQueen', genre: 'Electronic', image: 'https://via.placeholder.com/150', followers: '1.2M' },
    { id: 2, name: 'BeatMaster', genre: 'Hip Hop', image: 'https://via.placeholder.com/150', followers: '980K' },
    { id: 3, name: 'RockLegend', genre: 'Rock', image: 'https://via.placeholder.com/150', followers: '1.5M' },
    { id: 4, name: 'JazzMaster', genre: 'Jazz', image: 'https://via.placeholder.com/150', followers: '750K' },
    { id: 5, name: 'PopStar', genre: 'Pop', image: 'https://via.placeholder.com/150', followers: '2.3M' }
  ];

  const recentTracks = [
    { id: 1, title: 'Summer Groove', artist: 'BeachDJ', duration: '3:45', plays: 1250000 },
    { id: 2, title: 'Midnight City', artist: 'Urban Beats', duration: '4:12', plays: 980000 },
    { id: 3, title: 'Chill Wave', artist: 'Ambient Master', duration: '5:30', plays: 750000 },
    { id: 4, title: 'Dance Floor', artist: 'Party Mix', duration: '3:22', plays: 2100000 },
    { id: 5, title: 'Deep House', artist: 'Club Masters', duration: '6:15', plays: 1800000 }
  ];

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <div className="hero-section">
        <Carousel className="hero-carousel">
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://crossfadr.com/wp-content/uploads/2018/10/deephousepic.jpg"
              alt="First slide"
            />
            <Carousel.Caption className="hero-caption">
              <h1>Welcome to StreamDJ</h1>
              <p>Your ultimate music streaming platform for DJs and music lovers.</p>
              <div className="hero-buttons">
                <Button variant="primary" size="lg" className="me-3">
                  <FaPlay className="me-2" /> Start Listening
                </Button>
                <Button variant="outline-light" size="lg">Explore</Button>
              </div>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src="https://t3.ftcdn.net/jpg/04/08/99/00/240_F_408990068_A8QzYIfgChv66j71u5eavcIKA6NC2ML3.jpg"
              alt="Second slide"
            />
            <Carousel.Caption className="hero-caption">
              <h1>Live DJ Sessions</h1>
              <p>Join live streams from top DJs around the world.</p>
              <Button variant="primary" size="lg">
                <FaHeadphones className="me-2" /> Join Now
              </Button>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </div>

      <Container>
        {/* Featured Playlists */}
        <section className="page-section">
          <div className="section-header">
            <h2 className="section-title">Featured Playlists</h2>
            <p className="section-subtitle">Curated collections for every mood</p>
          </div>
          <Row className="g-4">
            {featuredPlaylists.map(playlist => (
              <Col md={3} key={playlist.id}>
                <Card className="playlist-card h-100">
                  <Card.Img variant="top" src={playlist.image} />
                  <Card.Body>
                    <Card.Title>{playlist.title}</Card.Title>
                    <Card.Text className="text-muted">By {playlist.creator}</Card.Text>
                    <Badge bg="light" text="dark" className="mb-3">
                      {playlist.tracks} tracks
                    </Badge>
                    <div className="card-actions">
                      <Button variant="primary" size="sm">
                        <FaPlay className="me-2" /> Play
                      </Button>
                      <Button variant="outline-secondary" size="sm">
                        <FaHeart />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Live Streams */}
        <section className="page-section">
          <div className="section-header">
            <h2 className="section-title">Live Now</h2>
            <p className="section-subtitle">Join the party with live DJ sessions</p>
          </div>
          <Row className="g-4">
            {liveStreams.map(stream => (
              <Col md={4} key={stream.id}>
                <Card className="stream-card h-100">
                  <Card.Img variant="top" src={stream.image} />
                  <div className="live-badge">LIVE</div>
                  <Card.Body>
                    <Card.Title>{stream.title}</Card.Title>
                    <Card.Text className="text-muted">By {stream.dj}</Card.Text>
                    <div className="stream-stats">
                      <span>
                        <FaUsers className="me-2" />
                        {stream.listeners.toLocaleString()} listeners
                      </span>
                    </div>
                    <Button variant="primary" className="w-100">
                      <FaHeadphones className="me-2" /> Join Stream
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header text-center">
            <h2 className="section-title">Why Choose StreamDJ?</h2>
            <p className="section-subtitle">Experience music like never before</p>
          </div>
          <Row className="g-4">
            <Col md={4}>
              <div className="feature-card">
                <FaMusic className="feature-icon" />
                <h3>Millions of Tracks</h3>
                <p>Access to a vast library of music from around the world.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-card">
                <FaHeadphones className="feature-icon" />
                <h3>High Quality Audio</h3>
                <p>Enjoy crystal clear sound with our premium audio quality.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-card">
                <FaMicrophone className="feature-icon" />
                <h3>Live DJ Sessions</h3>
                <p>Experience live performances from top DJs around the globe.</p>
              </div>
            </Col>
          </Row>
        </section>

        {/* Popular Tracks */}
        <section className="page-section">
          <div className="section-header">
            <h2 className="section-title">Popular Tracks</h2>
            <p className="section-subtitle">What's hot right now</p>
          </div>
          <Card className="tracks-card">
            <Card.Body>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Artist</th>
                    <th>Duration</th>
                    <th>Plays</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentTracks.map((track, index) => (
                    <tr key={track.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaPlay className="me-2 text-primary" />
                          {track.title}
                        </div>
                      </td>
                      <td>{track.artist}</td>
                      <td>{track.duration}</td>
                      <td>
                        <FaUsers className="me-2" />
                        {track.plays.toLocaleString()}
                      </td>
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
    </div>
  );
};

export default HomePage;