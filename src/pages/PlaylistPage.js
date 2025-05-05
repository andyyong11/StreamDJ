import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaEllipsisH } from 'react-icons/fa';
import api from '../services/api';

const PlaylistPage = ({ playTrack }) => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For demo purposes - using mock data if the API call fails
        try {
          const response = await api.get(`/api/playlists/${id}`);
          setPlaylist(response.data);
          
          // Fetch tracks in playlist
          const tracksResponse = await api.get(`/api/playlists/${id}/tracks`);
          setTracks(tracksResponse.data || []);
        } catch (apiError) {
          console.error('Error fetching playlist data:', apiError);
          
          // Mock playlist data if API fails
          setPlaylist({
            PlaylistID: id,
            Title: `Featured Playlist ${id}`,
            Description: 'A collection of amazing tracks',
            CreatedBy: 'StreamDJ',
            CreatedAt: new Date().toISOString(),
            CoverURL: 'https://via.placeholder.com/300',
            TrackCount: 5
          });
          
          // Mock tracks data
          setTracks([
            { TrackID: 1, Title: 'Summer Groove', Artist: 'BeachDJ', Duration: 225, PlayCount: 1250000 },
            { TrackID: 2, Title: 'Midnight City', Artist: 'Urban Beats', Duration: 252, PlayCount: 980000 },
            { TrackID: 3, Title: 'Chill Wave', Artist: 'Ambient Master', Duration: 330, PlayCount: 750000 },
            { TrackID: 4, Title: 'Dance Floor', Artist: 'Party Mix', Duration: 202, PlayCount: 2100000 },
            { TrackID: 5, Title: 'Deep House', Artist: 'Club Masters', Duration: 375, PlayCount: 1800000 }
          ]);
        }
      } catch (error) {
        console.error('Error loading playlist:', error);
        setError('Failed to load playlist. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistData();
  }, [id]);

  // Format track duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play single track
  const handlePlayTrack = (track) => {
    if (playTrack) {
      playTrack(track, tracks);
    }
  };

  // Play the entire playlist
  const handlePlayPlaylist = () => {
    if (tracks.length > 0 && playTrack) {
      playTrack(tracks[0], tracks);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger">{error}</div>
        <Button as={Link} to="/" variant="primary">Go Back Home</Button>
      </Container>
    );
  }

  if (!playlist) {
    return (
      <Container className="py-5">
        <div className="alert alert-warning">Playlist not found</div>
        <Button as={Link} to="/" variant="primary">Go Back Home</Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0">
            <Card.Img 
              variant="top" 
              src={playlist.CoverURL || 'https://via.placeholder.com/300'} 
              className="img-fluid shadow"
              style={{ borderRadius: '8px' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/300x300';
              }}
            />
          </Card>
        </Col>
        <Col md={8}>
          <div className="h-100 d-flex flex-column justify-content-end">
            <div>
              <small className="text-muted">PLAYLIST</small>
              <h1 className="display-4 fw-bold">{playlist.Title}</h1>
              <p className="text-muted">{playlist.Description}</p>
              <p>
                <span className="fw-bold">Created by:</span> {playlist.CreatedBy}
                <br />
                <span className="text-muted">{tracks.length} songs</span>
              </p>
              <div className="d-flex mt-3">
                <Button 
                  variant="success" 
                  size="lg" 
                  className="me-2"
                  onClick={handlePlayPlaylist}
                >
                  <FaPlay className="me-2" /> Play
                </Button>
                <Button variant="outline-danger" size="lg">
                  <FaHeart />
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Table hover className="mt-4">
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
              {tracks.map((track, index) => (
                <tr key={track.TrackID}>
                  <td>{index + 1}</td>
                  <td>{track.Title}</td>
                  <td>{track.Artist}</td>
                  <td>{formatDuration(track.Duration)}</td>
                  <td>{track.PlayCount?.toLocaleString() || '0'}</td>
                  <td className="text-end">
                    <Button 
                      variant="link" 
                      className="text-success p-0 me-2"
                      onClick={() => handlePlayTrack(track)}
                    >
                      <FaPlay />
                    </Button>
                    <Button variant="link" className="text-secondary p-0">
                      <FaEllipsisH />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
};

export default PlaylistPage;
