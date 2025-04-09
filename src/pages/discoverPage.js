import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const DiscoverPage = () => {
  const { token } = useAuth();
  const [trendingPlaylists, setTrendingPlaylists] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const genres = [
    { id: 1, name: 'Hip Hop', image: 'https://via.placeholder.com/250x150?text=Hip+Hop' },
    { id: 2, name: 'Electronic', image: 'https://via.placeholder.com/250x150?text=Electronic' },
    { id: 3, name: 'Pop', image: 'https://via.placeholder.com/250x150?text=Pop' },
    { id: 4, name: 'Jazz', image: 'https://via.placeholder.com/250x150?text=Jazz' },
    { id: 5, name: 'Rock', image: 'https://via.placeholder.com/250x150?text=Rock' }
  ];

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        };

        // Fetch trending playlists
        const playlistsResponse = await fetch('http://localhost:5001/api/playlists?limit=4', { headers });
        if (!playlistsResponse.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const playlistsData = await playlistsResponse.json();
        setTrendingPlaylists(playlistsData);

        // Fetch new releases (latest tracks)
        const tracksResponse = await fetch('http://localhost:5001/api/tracks?limit=3&sort=created_at', { headers });
        if (!tracksResponse.ok) {
          throw new Error('Failed to fetch tracks');
        }
        const tracksData = await tracksResponse.json();
        setNewReleases(tracksData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <Container style={{ paddingTop: '80px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading content...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container style={{ paddingTop: '80px' }}>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Trending Playlists */}
      <section className="mb-5">
        <h2 className="mb-4">Trending Playlists</h2>
        <Row>
          {trendingPlaylists.map(playlist => (
            <Col md={3} key={playlist.PlaylistID} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src="https://via.placeholder.com/300" />
                <Card.Body>
                  <Card.Title>{playlist.Title}</Card.Title>
                  <Card.Text>
                    By {playlist.Username || 'Unknown'} • {playlist.Quantity || 0} tracks
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
          {newReleases.map(track => (
            <Col md={4} key={track.TrackID} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={track.CoverArt || "https://via.placeholder.com/300"} />
                <Card.Body>
                  <Card.Title>{track.Title}</Card.Title>
                  <Card.Text>By {track.Artist || 'Unknown Artist'}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <span><FaMusic className="me-1" /> {formatDuration(track.Duration)}</span>
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
