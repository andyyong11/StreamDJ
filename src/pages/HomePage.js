import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaHeadphones, FaMicrophone, FaEllipsisH } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { token, loading } = useAuth();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [popularTracks, setPopularTracks] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      try {
        setContentLoading(true);
        setError(null);
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        try {
          // Fetch featured playlists
          const playlistsResponse = await fetch('http://localhost:5001/api/playlists?limit=4', { headers });
          
          if (playlistsResponse.ok) {
            const playlistsData = await playlistsResponse.json();
            setFeaturedPlaylists(playlistsData);
          } else {
            console.log('Failed to fetch playlists:', playlistsResponse.status);
            if (playlistsResponse.status === 401) {
              setError('Authentication required to view content');
            }
          }
        } catch (err) {
          console.error('Error fetching playlists:', err);
        }

        try {
          // Fetch popular tracks
          const tracksResponse = await fetch('http://localhost:5001/api/tracks?limit=5', { headers });
          
          if (tracksResponse.ok) {
            const tracksData = await tracksResponse.json();
            setPopularTracks(tracksData);
          } else {
            console.log('Failed to fetch tracks:', tracksResponse.status);
          }
        } catch (err) {
          console.error('Error fetching tracks:', err);
        }

      } catch (err) {
        console.error('Error in data fetching:', err);
        setError(err.message);
      } finally {
        setContentLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const noContentMessage = (
    <div className="text-center my-4">
      <p className="text-muted">No content available</p>
    </div>
  );

  return (
    <Container>
      {/* Hero Banner */}
      <Carousel className="mb-5">
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://crossfadr.com/wp-content/uploads/2018/10/deephousepic.jpg" // example Unsplash direct image
            alt="First slide"
            style={{ height: '400px', objectFit: 'cover', borderRadius: '10px' }}
          />
          <Carousel.Caption>
            <h3>Welcome to StreamDJ</h3>
            <p>Your ultimate music streaming platform for DJs and music lovers.</p>
            <Button variant="primary" className="me-2">Start Listening</Button>
            <Button variant="outline-light">Explore</Button>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://t3.ftcdn.net/jpg/04/08/99/00/240_F_408990068_A8QzYIfgChv66j71u5eavcIKA6NC2ML3.jpg"
            alt="Second slide"
            style={{ height: '400px', objectFit: 'cover', borderRadius: '10px' }}
          />
          <Carousel.Caption>
            <h3>Live DJ Sessions</h3>
            <p>Join live streams from top DJs around the world.</p>
            <Button variant="primary">Join Now</Button>
            {!token ? (
              <>
                <Button as={Link} to="/login" variant="primary" className="me-2">Log In</Button>
                <Button as={Link} to="/register" variant="outline-light">Sign Up</Button>
              </>
            ) : (
              <>
                <Button variant="primary" className="me-2">Start Listening</Button>
                <Button variant="outline-light">Explore</Button>
              </>
            )}
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!token && !loading && (
        <div className="alert alert-info mb-4" role="alert">
          <Link to="/login" className="alert-link">Log in</Link> or <Link to="/register" className="alert-link">sign up</Link> to access your personalized music experience!
        </div>
      )}

      {contentLoading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading content...</p>
        </div>
      ) : (
        <>
          {/* Featured Playlists */}
          <section className="mb-5">
            <h2 className="mb-4">Featured Playlists</h2>
            {featuredPlaylists.length > 0 ? (
              <Row>
                {featuredPlaylists.map(playlist => (
                  <Col md={3} key={playlist.PlaylistID} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Img variant="top" src="https://via.placeholder.com/300" />
                      <Card.Body>
                        <Card.Title>{playlist.Title}</Card.Title>
                        <Card.Text>
                          By {playlist.Username} • {playlist.Quantity} tracks
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
            ) : (
              noContentMessage
            )}
            <div className="text-center mt-3">
              <Button variant="outline-primary" as={Link} to="/discover">View All Playlists</Button>
            </div>
          </section>

          {/* Popular Tracks */}
          <section className="mb-5">
            <h2 className="mb-4">Popular Tracks</h2>
            {popularTracks.length > 0 ? (
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
            ) : (
              noContentMessage
            )}
          </section>
        </>
      )}

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