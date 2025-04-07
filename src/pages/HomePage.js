import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaHeadphones, FaMicrophone, FaEllipsisH } from 'react-icons/fa';

// Helper function to format duration
const formatDuration = (duration) => {
  if (!duration) return '--:--';
  if (typeof duration === 'string') return duration;
  
  const { hours, minutes } = duration;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes}:00`;
};

const HomePage = () => {
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [popularTracks, setPopularTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch featured playlists
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching playlists...');
        const playlistsResponse = await fetch('http://localhost:5001/api/playlists?limit=4', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Playlists Response:', playlistsResponse.status);
        if (!playlistsResponse.ok) {
          const errorData = await playlistsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch playlists');
        }

        const playlistsData = await playlistsResponse.json();
        console.log('Playlists Data:', playlistsData);
        setFeaturedPlaylists(playlistsData);

        // Fetch popular tracks
        console.log('Fetching tracks...');
        const tracksResponse = await fetch('http://localhost:5001/api/tracks?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Tracks Response:', tracksResponse.status);
        if (!tracksResponse.ok) {
          const errorData = await tracksResponse.json();
          throw new Error(errorData.error || 'Failed to fetch tracks');
        }

        const tracksData = await tracksResponse.json();
        console.log('Tracks Data:', tracksData);
        setPopularTracks(tracksData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      {/* Hero Banner */}
      <Carousel className="mb-5">
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="/images/hero-banner-1.jpg"
            alt="Welcome to StreamDJ"
            style={{ borderRadius: '10px', height: '400px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h3>Welcome to StreamDJ</h3>
            <p>Your ultimate music streaming platform for DJs and music lovers.</p>
            <Button variant="primary" className="me-2">Start Listening</Button>
            <Button variant="outline-light">Explore</Button>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {/* Featured Playlists */}
      <section className="mb-5">
        <h2 className="mb-4">Featured Playlists</h2>
        <Row>
          {featuredPlaylists.map(playlist => (
            <Col md={3} key={playlist.PlaylistID} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img 
                  variant="top" 
                  src={'/images/playlist-default.jpg'}
                  style={{ height: '180px', objectFit: 'cover' }}
                />
                <Card.Body>
                  <Card.Title>{playlist.Title}</Card.Title>
                  <Card.Text>
                    By {playlist.Username || `User ${playlist.UserID}`} • {playlist.Quantity || 0} tracks
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button variant="success" size="sm" as={Link} to={`/playlist/${playlist.PlaylistID}`}>
                      <FaPlay className="me-1" /> Play
                    </Button>
                    <small className="text-muted">
                      {new Date(playlist.CreatedAt).toLocaleDateString()}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center mt-3">
          <Button variant="outline-primary" as={Link} to="/playlists">View All Playlists</Button>
        </div>
      </section>

      {/* Popular Tracks */}
      <section className="mb-5">
        <h2 className="mb-4">Popular Tracks</h2>
        <Card>
          <Card.Body>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {popularTracks.map((track, index) => (
                  <tr key={track.TrackID}>
                    <td>{index + 1}</td>
                    <td>{track.Title}</td>
                    <td>{track.Artist}</td>
                    <td>{formatDuration(track.Duration)}</td>
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

      {/* Features Section */}
      <section className="mb-5">
        <h2 className="text-center mb-4">Why Choose StreamDJ?</h2>
        <Row>
          <Col md={4} className="text-center mb-4">
            <div className="p-3">
              <FaMusic className="display-4 mb-3 text-primary" />
              <h4>Millions of Tracks</h4>
              <p>Access to a vast library of music from around the world.</p>
            </div>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="p-3">
              <FaHeadphones className="display-4 mb-3 text-primary" />
              <h4>High Quality Audio</h4>
              <p>Enjoy crystal clear sound with our premium audio quality.</p>
            </div>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="p-3">
              <FaMicrophone className="display-4 mb-3 text-primary" />
              <h4>Live DJ Sessions</h4>
              <p>Experience live performances from top DJs around the globe.</p>
            </div>
          </Col>
        </Row>
      </section>
    </Container>
  );
};

export default HomePage;