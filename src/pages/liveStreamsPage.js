import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import { FaHeadphones, FaComment } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const LiveStreamsPage = () => {
  const { token, isAuthenticated } = useAuth();
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch('http://localhost:5001/api/streams', { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch live streams: ${response.statusText}`);
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

  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!selectedStream) return;

      try {
        const response = await fetch(`http://localhost:5001/api/streams/${selectedStream}/chat`);
        if (!response.ok) throw new Error('Failed to fetch chat messages');
        const messages = await response.json();
        setChatMessages(messages);
      } catch (error) {
        console.error('Error fetching chat messages:', error);
      }
    };

    fetchChatMessages();
    const chatPollInterval = setInterval(fetchChatMessages, 5000); // Poll chat every 5 seconds

    return () => clearInterval(chatPollInterval);
  }, [selectedStream]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStream || !isAuthenticated) return;

    try {
      const response = await fetch(`http://localhost:5001/api/streams/${selectedStream}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (!response.ok) throw new Error('Failed to send message');
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

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
      
      <Row>
        <Col md={selectedStream ? 8 : 12}>
          {liveStreams.length > 0 ? (
            <Row>
              {liveStreams.map((stream) => (
                <Col md={selectedStream ? 6 : 4} className="mb-4" key={stream.StreamID}>
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
                      <div className="d-flex gap-2">
                        <Button 
                          variant="primary" 
                          className="flex-grow-1"
                          onClick={() => setSelectedStream(stream.StreamID)}
                        >
                          Join Stream
                        </Button>
                        <Button 
                          variant="outline-primary"
                          onClick={() => setSelectedStream(stream.StreamID)}
                        >
                          <FaComment />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center">
              <p className="text-muted">No live streams available at the moment.</p>
              <p>Check back later or start your own stream!</p>
              {isAuthenticated ? (
                <Button variant="primary" href="/stream/create">
                  Start Streaming
                </Button>
              ) : (
                <Button variant="primary" as={Link} to="/login">
                  Login to Start Streaming
                </Button>
              )}
            </div>
          )}
        </Col>
        
        {selectedStream && (
          <Col md={4}>
            <Card className="chat-container">
              <Card.Header>Live Chat</Card.Header>
              <Card.Body className="chat-messages" style={{ height: '400px', overflowY: 'auto' }}>
                {chatMessages.map((msg) => (
                  <div key={msg.MessageID} className="mb-2">
                    <strong>{msg.Username}:</strong> {msg.Message}
                  </div>
                ))}
                {!isAuthenticated && (
                  <div className="text-center text-muted">
                    <p>Please <Link to="/login">login</Link> to participate in chat</p>
                  </div>
                )}
              </Card.Body>
              {isAuthenticated && (
                <Card.Footer>
                  <Form onSubmit={handleSendMessage}>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button type="submit" disabled={!newMessage.trim()}>
                        Send
                      </Button>
                    </div>
                  </Form>
                </Card.Footer>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default LiveStreamsPage;
