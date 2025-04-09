import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const LibraryPage = () => {
  const { token, user } = useAuth();
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) return;

      try {
        setLoading(true);
        setError(null);

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        // Fetch user's playlists
        const playlistsResponse = await fetch(`http://localhost:5001/api/users/${user.id}/playlists`, { headers });
        if (!playlistsResponse.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const playlistsData = await playlistsResponse.json();
        setSavedPlaylists(playlistsData);

        // Fetch user's liked tracks
        const tracksResponse = await fetch(`http://localhost:5001/api/users/${user.id}/liked-tracks`, { headers });
        if (!tracksResponse.ok) {
          throw new Error('Failed to fetch liked tracks');
        }
        const tracksData = await tracksResponse.json();
        setLikedTracks(tracksData);

      } catch (err) {
        console.error('Error fetching library data:', err);
        setError('Failed to load your library. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  if (loading) {
    return (
      <Container style={{ paddingTop: '80px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your library...</p>
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

      {/* Saved Playlists */}
      <section className="mb-5">
        <h2 className="mb-4">Your Playlists</h2>
        {savedPlaylists.length > 0 ? (
          <Row>
            {savedPlaylists.map(playlist => (
              <Col md={3} key={playlist.PlaylistID} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img variant="top" src="https://via.placeholder.com/300" />
                  <Card.Body>
                    <Card.Title>{playlist.Title}</Card.Title>
                    <Card.Text>
                      {playlist.Quantity || 0} tracks
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
          <div className="text-center">
            <p className="text-muted">You haven't created any playlists yet.</p>
            <Button variant="primary" as={Link} to="/discover">
              Discover Music
            </Button>
          </div>
        )}
      </section>

      {/* Liked Tracks */}
      <section className="mb-5">
        <h2 className="mb-4">Liked Tracks</h2>
        {likedTracks.length > 0 ? (
          <Card className="shadow-sm">
            <Card.Body>
              <table className="table table-hover">
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
                  {likedTracks.map((track, index) => (
                    <tr key={track.TrackID}>
                      <td>{index + 1}</td>
                      <td>{track.Title}</td>
                      <td>{track.Artist || 'Unknown Artist'}</td>
                      <td>{formatDuration(track.Duration)}</td>
                      <td>
                        <Button variant="success" size="sm">
                          <FaPlay />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Body>
          </Card>
        ) : (
          <div className="text-center">
            <p className="text-muted">You haven't liked any tracks yet.</p>
            <Button variant="primary" as={Link} to="/discover">
              Discover Music
            </Button>
          </div>
        )}
      </section>
    </Container>
  );
};

export default LibraryPage;
