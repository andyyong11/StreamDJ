import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

const PlaylistPage = () => {
  const { id } = useParams();

  // Mock playlist data
  const playlist = {
    id: id,
    title: 'My Awesome Playlist',
    description: 'A collection of my favorite tracks',
    tracks: [
      { id: 1, title: 'Track 1', artist: 'Artist 1', duration: '3:45' },
      { id: 2, title: 'Track 2', artist: 'Artist 2', duration: '4:20' },
      { id: 3, title: 'Track 3', artist: 'Artist 3', duration: '3:15' },
    ]
  };

  return (
    <Container>
      <Row className="mt-4">
        <Col>
          <h1>{playlist.title}</h1>
          <p>{playlist.description}</p>
        </Col>
      </Row>
      <Row>
        <Col>
          {playlist.tracks.map(track => (
            <Card key={track.id} className="mb-2">
              <Card.Body>
                <Card.Title>{track.title}</Card.Title>
                <Card.Text>
                  {track.artist} - {track.duration}
                </Card.Text>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default PlaylistPage;
