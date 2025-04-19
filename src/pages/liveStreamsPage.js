import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Alert } from 'react-bootstrap';
import { FaHeadphones, FaMicrophone, FaCopy } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';

const LiveStreamsPage = () => {
  const { user, token } = useAuth();
  const [streams, setStreams] = useState([]);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [error, setError] = useState('');
  const [streamConfig, setStreamConfig] = useState({
    rtmpUrl: 'rtmp://localhost:1935/live',
    streamKey: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Connect to socket
    const socket = socketService.connect();

    // Fetch active streams when component mounts
    const fetchActiveStreams = async () => {
      try {
        console.log('Fetching active streams...');
        const response = await fetch('http://localhost:5001/api/streams/active', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        console.log('Active streams response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to fetch streams');
        }
        
        const data = await response.json();
        console.log('Active streams data:', data);
        
        setStreams(data.map(stream => ({
          id: stream.LiveStreamID,
          title: stream.Title,
          dj: stream.UserID,
          listeners: stream.ListenerCount || 0,
          startTime: stream.StartTime,
          status: stream.Status,
          streamKey: stream.StreamKey // Make sure we're getting the stream key
        })));
      } catch (error) {
        console.error('Error fetching streams:', error);
        setError('Failed to fetch active streams');
      }
    };

    fetchActiveStreams();

    // Listen for stream events
    socket.on('stream_started', (newStream) => {
      console.log('New stream started:', newStream);
      setStreams(prevStreams => [...prevStreams, {
        id: newStream.LiveStreamID,
        title: newStream.Title,
        dj: newStream.UserID,
        listeners: newStream.ListenerCount || 0,
        startTime: newStream.StartTime,
        status: newStream.Status,
        streamKey: newStream.StreamKey
      }]);
    });

    socket.on('stream_ended', ({ streamId }) => {
      console.log('Stream ended:', streamId);
      setStreams(prevStreams => prevStreams.filter(stream => stream.id !== streamId));
    });

    return () => {
      socket.off('stream_started');
      socket.off('stream_ended');
    };
  }, [token]);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleGetStreamKey = async () => {
    try {
      setError('');
      console.log('Requesting stream key...');
      
      // Get the latest token from localStorage
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken) {
        setError('You must be logged in to get a stream key');
        return;
      }

      const response = await fetch('http://localhost:5001/api/streams/key', {
        method: 'POST',
        headers: {
          'Authorization': currentToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Stream key response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get stream key');
      }

      const data = await response.json();
      console.log('Stream key response:', data);

      if (!data.data?.streamKey) {
        throw new Error('No stream key received from server');
      }

      setStreamConfig(prev => ({
        ...prev,
        streamKey: data.data.streamKey
      }));
      setShowStreamInfo(true);
    } catch (error) {
      console.error('Error getting stream key:', error);
      setError(error.message || 'Failed to get stream key');
    }
  };

  const handleJoinStream = (streamId) => {
    console.log('Joining stream:', streamId);
    navigate(`/stream/${streamId}`);
  };

  return (
    <Container className="live-streams-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Live Streams</h1>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* Available Streams */}
      <Row>
        {streams.length === 0 ? (
          <Col>
            <Alert variant="info">
              No active streams at the moment. Start streaming or check back later!
            </Alert>
          </Col>
        ) : (
          streams.map(stream => (
            <Col md={4} key={stream.id} className="mb-4">
              <Card className="h-100 stream-card">
                <div className="position-relative">
                  <Card.Img variant="top" src={`https://picsum.photos/seed/${stream.id}/300/200`} />
                  <Badge 
                    bg="danger" 
                    className="position-absolute top-0 start-0 m-2"
                  >
                    LIVE
                  </Badge>
                  <Badge 
                    bg="dark" 
                    className="position-absolute bottom-0 end-0 m-2"
                  >
                    <FaHeadphones className="me-1" /> {stream.listeners.toLocaleString()}
                  </Badge>
                </div>
                <Card.Body>
                  <Card.Title>{stream.title}</Card.Title>
                  <div className="mb-2">
                    <div>
                      <strong>DJ:</strong> {stream.dj}<br />
                      <strong>Started:</strong> {new Date(stream.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button 
                      variant="primary" 
                      onClick={() => handleJoinStream(stream.id)}
                    >
                      Join Stream
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Stream Configuration Button and Modal */}
      {user ? (
        <>
          <div className="text-center mt-4">
            <Button variant="success" size="lg" onClick={handleGetStreamKey}>
              <FaMicrophone className="me-2" /> Get Stream Configuration
            </Button>
          </div>

          <Modal show={showStreamInfo} onHide={() => setShowStreamInfo(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Stream Configuration</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h5>OBS Settings</h5>
              <p>Use these settings in OBS to start streaming:</p>
              
              <div className="mb-3">
                <strong>RTMP URL:</strong>
                <div className="d-flex align-items-center">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={streamConfig.rtmpUrl} 
                    readOnly 
                  />
                  <Button 
                    variant="outline-secondary" 
                    className="ms-2"
                    onClick={() => handleCopyToClipboard(streamConfig.rtmpUrl)}
                  >
                    <FaCopy />
                  </Button>
                </div>
              </div>

              <div className="mb-3">
                <strong>Stream Key:</strong>
                <div className="d-flex align-items-center">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={streamConfig.streamKey} 
                    readOnly 
                  />
                  <Button 
                    variant="outline-secondary" 
                    className="ms-2"
                    onClick={() => handleCopyToClipboard(streamConfig.streamKey)}
                  >
                    <FaCopy />
                  </Button>
                </div>
              </div>

              <div className="alert alert-info">
                <strong>Instructions:</strong>
                <ol className="mb-0">
                  <li>Open OBS Studio</li>
                  <li>Go to Settings → Stream</li>
                  <li>Select "Custom" as Service</li>
                  <li>Copy and paste the RTMP URL and Stream Key</li>
                  <li>Click "OK" and start streaming!</li>
                </ol>
              </div>
              
              <div className="alert alert-warning">
                <strong>Note:</strong> This stream key is valid for 24 hours. Get a new key if you plan to stream after that.
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowStreamInfo(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      ) : (
        <div className="text-center mt-4">
          <Alert variant="info">
            Please log in to start streaming
          </Alert>
        </div>
      )}
    </Container>
  );
};

export default LiveStreamsPage;
