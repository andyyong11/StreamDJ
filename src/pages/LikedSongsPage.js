import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaPlay } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const LikedSongsPage = ({ onTrackSelect }) => {
  const { user } = useAuth(); // ✅ call it here
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    if (!user || !user.id) return;

    fetch(`http://localhost:5001/api/library/${user.id}/liked-songs`) // ✅ NOTE: /api/library not /api/users
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(err => console.error('Failed to fetch liked songs:', err));
  }, [user]);

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Liked Songs</h2>
      {tracks.length === 0 ? (
        <p>No liked songs found.</p>
      ) : (
        <Row>
          {tracks.map(track => (
            <Col md={3} key={track.TrackID} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={`http://localhost:5001/${track.CoverArt}`} />
                <Card.Body>
                  <Card.Title>{track.Title}</Card.Title>
                  <Card.Text>{track.Artist}</Card.Text>
                  <Button variant="success" size="sm" onClick={() => onTrackSelect(track)}>
                    <FaPlay className="me-1" /> Play
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default LikedSongsPage;