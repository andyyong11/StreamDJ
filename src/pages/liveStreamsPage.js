import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaHeadphones } from 'react-icons/fa';

const LiveStreamsPage = () => {
  // Mock data for live streams
  const liveStreams = [
    {
      id: 1,
      title: 'Sunset Grooves',
      dj: 'DJ Ocean',
      listeners: 1320,
      image: 'https://via.placeholder.com/400x250',
    },
    {
      id: 2,
      title: 'Midnight Beats',
      dj: 'BeatWitch',
      listeners: 845,
      image: 'https://via.placeholder.com/400x250',
    },
    {
      id: 3,
      title: 'Techno Party',
      dj: 'PulseRider',
      listeners: 2104,
      image: 'https://via.placeholder.com/400x250',
    },
    {
      id: 4,
      title: 'Jazz on Air',
      dj: 'Smooth Flow',
      listeners: 605,
      image: 'https://via.placeholder.com/400x250',
    },
    {
      id: 5,
      title: 'Lo-Fi Chill',
      dj: 'ChillHopGuy',
      listeners: 950,
      image: 'https://via.placeholder.com/400x250',
    },
  ];

  return (
    <Container style={{ paddingTop: '80px' }}>
      <h2 className="mb-4">Live DJ Streams</h2>
      <Row>
        {liveStreams.map((stream) => (
          <Col md={4} className="mb-4" key={stream.id}>
            <Card className="h-100 shadow-sm">
              <div className="position-relative">
                <Card.Img variant="top" src={stream.image} />
                <Badge bg="danger" className="position-absolute top-0 start-0 m-2">
                  LIVE
                </Badge>
                <Badge bg="dark" className="position-absolute bottom-0 end-0 m-2">
                  <FaHeadphones className="me-1" />
                  {stream.listeners.toLocaleString()}
                </Badge>
              </div>
              <Card.Body>
                <Card.Title>{stream.title}</Card.Title>
                <Card.Text>By {stream.dj}</Card.Text>
                <Button variant="primary" className="w-100">
                  Join Stream
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default LiveStreamsPage;
