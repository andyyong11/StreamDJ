import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaHeadphones } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const LiveStreamsPage = () => {
  const { token } = useAuth();
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch('http://localhost:5001/api/streams/live', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch live streams');
        }
        const data = await response.json();
        setLiveStreams(data);

      } catch (err) {
        console.error('Error fetching live streams:', err);
        setError('Failed to load live streams. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStreams();

    // Set up polling for live updates
    const pollInterval = setInterval(fetchLiveStreams, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [token]);

  if (loading) {
    return (
      <Container style={{ paddingTop: '80px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading live streams...</p>
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

      <h2 className="mb-4">Live DJ Streams</h2>
      
      {liveStreams.length > 0 ? (
        <Row>
          {liveStreams.map((stream) => (
            <Col md={4} className="mb-4" key={stream.StreamID}>
              <Card className="h-100 shadow-sm">
                <div className="position-relative">
                  <Card.Img variant="top" src={stream.ThumbnailUrl || "https://via.placeholder.com/400x250"} />
                  <Badge bg="danger" className="position-absolute top-0 start-0 m-2">
                    LIVE
                  </Badge>
                  <Badge bg="dark" className="position-absolute bottom-0 end-0 m-2">
                    <FaHeadphones className="me-1" />
                    {stream.ListenerCount?.toLocaleString() || 0}
                  </Badge>
                </div>
                <Card.Body>
                  <Card.Title>{stream.Title}</Card.Title>
                  <Card.Text>By {stream.Username}</Card.Text>
                  <Button variant="primary" className="w-100" href={`/stream/${stream.StreamID}`}>
                    Join Stream
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center">
          <p className="text-muted">No live streams available at the moment.</p>
          <p>Check back later or start your own stream!</p>
          <Button variant="primary" href="/stream/create">
            Start Streaming
          </Button>
        </div>
      )}
    </Container>
  );
};

export default LiveStreamsPage;
