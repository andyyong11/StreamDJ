import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Alert, Form } from 'react-bootstrap';
import { FaHeadphones, FaMicrophone, FaCopy, FaEye } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';

const LiveStreamsPage = () => {
  const { user, token } = useAuth();
  const [streams, setStreams] = useState([]);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [error, setError] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamConfig, setStreamConfig] = useState({
    rtmpUrl: 'rtmp://localhost:1935/live',
    streamKey: ''
  });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [requestCooldown, setRequestCooldown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [pendingStreamKey, setPendingStreamKey] = useState('');
  const [pendingStreamTitle, setPendingStreamTitle] = useState('');

  useEffect(() => {
    // Connect to socket
    const socket = socketService.connect();

    // Fetch active streams when component mounts
    const fetchActiveStreams = async () => {
      try {
        console.log('Fetching active streams...');
        const response = await fetch('http://localhost:5001/api/streams/active', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch streams, status:', response.status);
          let errorMessage = 'Failed to fetch streams';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse the error, just use the default message
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Active streams data:', data);
        
        // Check if data is an array before mapping
        if (Array.isArray(data)) {
          setStreams(data.map(stream => ({
            id: stream.LiveStreamID,
            title: stream.Title,
            dj: stream.UserID,
            listeners: stream.ListenerCount || 0,
            startTime: stream.StartTime,
            status: stream.Status,
            streamKey: stream.StreamKey
          })));
        } else {
          console.error('Expected array of streams but got:', data);
          setStreams([]);
        }
      } catch (error) {
        console.error('Error fetching streams:', error);
        setError(error.message || 'Failed to fetch active streams');
        setStreams([]); // Make sure streams is always an array
      }
    };

    fetchActiveStreams();

    // Listen for stream events
    socket.on('stream_started', (newStream) => {
      console.log('New stream started:', newStream);
      
      // Check if this is our pending stream
      if (user && newStream.UserID === user.id && newStream.StreamKey === pendingStreamKey) {
        console.log('Our stream started successfully with key:', pendingStreamKey);
        
        // If we have a pending title different from the default, update it
        if (pendingStreamTitle && pendingStreamTitle !== newStream.Title) {
          console.log('Updating stream with our custom title:', pendingStreamTitle);
          
          // Update the stream title via API
          updateStreamTitle(newStream.LiveStreamID, pendingStreamTitle);
          
          // Add the stream with our pending title for immediate UI update
          setStreams(prevStreams => [...prevStreams, {
            id: newStream.LiveStreamID,
            title: pendingStreamTitle, // Use our pending title
            dj: newStream.UserID,
            listeners: newStream.ListenerCount || 0,
            startTime: newStream.StartTime,
            status: newStream.Status,
            streamKey: newStream.StreamKey
          }]);
          
          // Show success message
          setSuccessMessage(`Stream started successfully with title "${pendingStreamTitle}"!`);
          
          // Clear pending data
          setPendingStreamKey('');
          setPendingStreamTitle('');
          return;
        }
      }
      
      // Normal handling for other streams
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

    // Listen for stream title updates
    socket.on('stream_updated', (updatedStream) => {
      console.log('Stream updated:', updatedStream);
      setStreams(prevStreams => prevStreams.map(stream => 
        stream.id === updatedStream.LiveStreamID 
          ? {
              ...stream,
              title: updatedStream.Title
            }
          : stream
      ));
    });

    return () => {
      socket.off('stream_started');
      socket.off('stream_ended');
      socket.off('stream_updated');
    };
  }, [token, user, pendingStreamKey, pendingStreamTitle]);

  // Function to update stream title via API
  const updateStreamTitle = async (streamId, title) => {
    try {
      const response = await fetch(`http://localhost:5001/api/streams/${streamId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) {
        console.error('Failed to update stream title:', response.status);
      } else {
        console.log('Stream title updated successfully');
      }
    } catch (error) {
      console.error('Error updating stream title:', error);
    }
  };

  useEffect(() => {
    console.log('Stream config updated:', streamConfig);
  }, [streamConfig]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Load saved title from localStorage on component mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('streamTitle');
    if (savedTitle) {
      setStreamTitle(savedTitle);
      setCurrentTitle(savedTitle);
    } else {
      // Set default title
      const defaultTitle = `Stream ${new Date().toLocaleString()}`;
      setStreamTitle(defaultTitle);
    }
  }, []);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Simplified to go directly to stream configuration
  const handleStartStream = () => {
    setError('');
    if (!token) {
      setError('You must be logged in to get a stream key');
      return;
    }
    
    // If we already have a title from localStorage, use it
    if (streamTitle.trim()) {
      setCurrentTitle(streamTitle);
    } else {
      // Set a default title
      const defaultTitle = `Stream ${new Date().toLocaleString()}`;
      setStreamTitle(defaultTitle);
      setCurrentTitle(defaultTitle);
    }
    
    // Go directly to the stream configuration
    handleGetStreamKey();
  };

  // Helper function to handle rate limiting
  const handleRateLimitedRequest = async (requestFn, errorMessage) => {
    // Don't make requests if we're in cooldown
    if (requestCooldown) {
      setError('Please wait a moment before requesting another stream key');
      return null;
    }

    try {
      setRequestCooldown(true);
      const result = await requestFn();
      return result;
    } catch (error) {
      // Special handling for rate limit errors
      if (error.message && error.message.includes('429')) {
        setError('You have made too many requests. Please wait a minute and try again.');
        // Set a longer cooldown for rate limit errors
        setTimeout(() => setRequestCooldown(false), 60000); // 1 minute cooldown
      } else {
        setError(errorMessage || error.message || 'An error occurred');
        // Set a shorter cooldown for other errors
        setTimeout(() => setRequestCooldown(false), 5000); // 5 second cooldown
      }
      return null;
    }
  };

  const handleGetStreamKey = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      console.log('Opening stream configuration modal...');
      
      if (!token) {
        setError('You must be logged in to get a stream key');
        setIsLoading(false);
        return;
      }

      // Show the modal first
      setShowStreamInfo(true);
      
      // Use the existing title
      let titleToUse = streamTitle.trim();
      
      // Use the rate-limited request handler
      const makeRequest = async () => {
        console.log('Requesting stream key with title:', titleToUse);
        
        const response = await fetch('http://localhost:5001/api/streams/key', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ title: titleToUse })
        });
        
        console.log('Stream key API response status:', response.status);
        
        if (response.status === 429) {
          // Extract the message from the response if possible, or create a default message
          const text = await response.text();
          console.log('Rate limit response:', text);
          throw new Error('429: ' + (text || 'Too many requests. Please wait and try again.'));
        }
        
        if (!response.ok) {
          // For non-429 errors, try to parse as JSON
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } catch (e) {
            // If we can't parse as JSON, just use the status text
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }
        
        // If we got here, the request was successful
        const data = await response.json();
        
        if (!data.data?.streamKey) {
          throw new Error('No stream key received from server');
        }
        
        return data.data.streamKey;
      };
      
      const streamKey = await handleRateLimitedRequest(
        makeRequest, 
        'Failed to get stream key'
      );
      
      if (streamKey) {
        console.log('Setting stream key to:', streamKey);
        setStreamConfig({
          rtmpUrl: 'rtmp://localhost:1935/live',
          streamKey: streamKey
        });
        
        // Store the pending stream key and title
        setPendingStreamKey(streamKey);
        setPendingStreamTitle(titleToUse);
        
        setRetryCount(0); // Reset retry count on success
        setCurrentTitle(titleToUse);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error in handleGetStreamKey:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      // Release cooldown after a short delay
      setTimeout(() => setRequestCooldown(false), 3000);
    }
  }, [token, streamTitle, requestCooldown]);

  // Move handleTitleUpdate after the getNewStreamKey function
  // -------------------------------------------------------------------

  // Add a function to clear/reset the title
  const handleResetTitle = useCallback(() => {
    const newTitle = `Stream ${new Date().toLocaleString()}`;
    setStreamTitle(newTitle);
    setCurrentTitle(newTitle);
    localStorage.setItem('streamTitle', newTitle);
    setSuccessMessage("Title reset to default");
  }, []);

  // Add retry functionality
  const handleRetry = async () => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please try again later.');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    console.log(`Retry attempt ${retryCount + 1}/3`);
    
    // Wait a bit longer between retries
    await new Promise(resolve => setTimeout(resolve, 5000 * (retryCount + 1)));
    
    if (streamConfig.streamKey) {
      await handleTitleUpdate();
    } else {
      await handleGetStreamKey();
    }
  };

  const handleJoinStream = (streamId) => {
    console.log('Joining stream:', streamId);
    navigate(`/streams/${streamId}`);
  };

  // Function to refresh the active streams list
  const refreshActiveStreams = useCallback(async () => {
    try {
      console.log('Refreshing active streams...');
      const response = await fetch('http://localhost:5001/api/streams/active', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        console.error('Error refreshing streams:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('Refreshed active streams data:', data);
      
      setStreams(data.map(stream => ({
        id: stream.LiveStreamID,
        title: stream.Title,
        dj: stream.UserID,
        listeners: stream.ListenerCount || 0,
        startTime: stream.StartTime,
        status: stream.Status,
        streamKey: stream.StreamKey
      })));
    } catch (error) {
      console.error('Error refreshing streams:', error);
    }
  }, [token]);
  
  // Function to get a new stream key with updated title
  const getNewStreamKey = useCallback(async () => {
    console.log('Getting new stream key with title:', streamTitle);
    
    try {
      // Use the rate-limited request handler
      const makeRequest = async () => {
        const response = await fetch('http://localhost:5001/api/streams/key', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ title: streamTitle })
        });
        
        if (response.status === 429) {
          const text = await response.text();
          console.log('Rate limit response:', text);
          throw new Error('429: ' + (text || 'Too many requests. Please wait and try again.'));
        }
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } catch (e) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        
        if (!data.data?.streamKey) {
          throw new Error('No stream key received from server');
        }
        
        return data.data.streamKey;
      };
      
      const streamKey = await handleRateLimitedRequest(
        makeRequest,
        'Failed to update stream title'
      );
      
      if (streamKey) {
        console.log('Updated stream key:', streamKey);
        setStreamConfig({
          rtmpUrl: 'rtmp://localhost:1935/live',
          streamKey: streamKey
        });
        
        // Update pending stream information
        setPendingStreamKey(streamKey);
        setPendingStreamTitle(streamTitle);
        
        setRetryCount(0); // Reset retry count on success
        setError('');
        
        // Add success confirmation
        setSuccessMessage(`Stream title updated to "${streamTitle}" successfully!`);
        setLastUpdated(new Date());
        setCurrentTitle(streamTitle);
        
        // Save the title to localStorage for persistence
        localStorage.setItem('streamTitle', streamTitle);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error getting new stream key:', error);
      setError(error.message || 'Failed to update stream title');
      return false;
    }
  }, [token, streamTitle, handleRateLimitedRequest]);

  // Now define handleTitleUpdate since its dependencies are defined
  const handleTitleUpdate = useCallback(async () => {
    if (!streamTitle.trim()) {
      setError('Please enter a valid title');
      return;
    }
    
    if (requestCooldown) {
      setError('Please wait a moment before updating the title again');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Check if user is logged in
      if (!user || !token) {
        throw new Error('You must be logged in to update a stream title');
      }
      
      console.log('Attempting to update title for user ID:', user.id);
      
      // Update the title via the updateTitle endpoint directly
      const response = await fetch(`http://localhost:5001/api/streams/updateTitle`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          userId: user.id,
          title: streamTitle 
        })
      });
      
      if (!response.ok) {
        // If no stream exists yet, fall back to creating a new one
        if (response.status === 404) {
          console.log('No active or scheduled stream found, creating a new one');
          return await getNewStreamKey();
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to update stream title: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Stream title updated successfully:', data);
      
      // Update the current title state
      setCurrentTitle(streamTitle);
      setLastUpdated(new Date());
      
      // Save to localStorage for persistence
      localStorage.setItem('streamTitle', streamTitle);
      
      // Show success message
      setSuccessMessage(`Stream title updated to "${streamTitle}" successfully!`);
      
      // Update the streams state if this is an active stream
      if (data.data.Status === 'active') {
        setStreams(prevStreams => prevStreams.map(stream => 
          stream.id === data.data.LiveStreamID 
            ? { ...stream, title: streamTitle }
            : stream
        ));
        
        // Refresh streams data
        refreshActiveStreams();
      }
      
      return true;
    } catch (error) {
      console.error('Error updating title:', error);
      
      // If we get a specific error about no stream, fall back to getting a new key
      if (error.message && (
          error.message.includes('No active') || 
          error.message.includes('not found') ||
          error.message.includes('404')
      )) {
        console.log('No stream error, falling back to stream key update');
        return await getNewStreamKey();
      }
      
      setError(error.message || 'Failed to update stream title');
      return false;
    } finally {
      setIsLoading(false);
      // Release cooldown after a short delay
      setTimeout(() => setRequestCooldown(false), 3000);
    }
  }, [token, streamTitle, requestCooldown, user, refreshActiveStreams, getNewStreamKey]);

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

      {successMessage && (
        <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Available Streams */}
      <div className="stream-container p-4 mb-4" style={{ backgroundColor: 'white', color: '#333', borderRadius: '12px' }}>
        <h3 className="mb-3" style={{ color: '#333' }}>Active Streams</h3>
        <Row>
          {streams.length === 0 ? (
            <Col>
              <div className="p-4 text-center bg-white" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                <div className="py-5">
                  <FaMicrophone className="mb-3" style={{ fontSize: '3rem', color: '#0d6efd', opacity: 0.8 }} />
                  <h4 style={{ color: '#333' }}>Ready for some music?</h4>
                  <p style={{ color: '#666' }}>Start streaming below to share your sound.</p>
                </div>
              </div>
            </Col>
          ) : (
            streams.map(stream => (
              <Col md={4} key={stream.id} className="mb-4">
                <Card className="h-100 stream-card" style={{ backgroundColor: 'white', color: '#333' }}>
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
                  <Card.Body style={{ backgroundColor: 'white', color: '#333' }}>
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
                      <div className="d-flex align-items-center text-danger">
                        <FaEye className="me-1" /> 
                        <strong>{stream.listeners}</strong>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </div>

      {/* Stream Configuration Button and Modal */}
      <div className="stream-container p-4" style={{ backgroundColor: 'white', color: '#333', borderRadius: '12px' }}>
        <h3 className="mb-3" style={{ color: '#333' }}>Start Your Stream</h3>
        {user ? (
          <>
            <div className="text-center mt-2 mb-4">
              <Button 
                variant="success" 
                size="lg" 
                onClick={handleStartStream}
                disabled={isLoading || requestCooldown}
              >
                {isLoading ? 'Loading...' : (
                  <><FaMicrophone className="me-2" /> Start Streaming!</>
                )}
              </Button>
              {requestCooldown && <div className="text-muted mt-2">Please wait before making another request</div>}
            </div>
          </>
        ) : (
          <div className="text-center mt-4">
            <Alert variant="info">
              Please log in to start streaming
            </Alert>
          </div>
        )}
      </div>

      {/* Stream Configuration Modal */}
      <Modal 
        show={showStreamInfo} 
        onHide={() => !isLoading && setShowStreamInfo(false)} 
        size="lg"
        className="stream-info-modal"
      >
        <Modal.Header closeButton={!isLoading} className="bg-dark text-white border-secondary">
          <Modal.Title>Stream Configuration</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
              {error.includes('429') && (
                <div className="mt-2">
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={handleRetry}
                    disabled={isLoading || requestCooldown || retryCount >= 3}
                  >
                    Retry ({retryCount}/3)
                  </Button>
                </div>
              )}
            </Alert>
          )}
          
          {successMessage && (
            <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          
          <Row>
            <Col md={6}>
              <Form className="mb-3">
                <Form.Group className="mb-3">
                  <Form.Label>Stream Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your stream title"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    maxLength={50}
                    disabled={isLoading || requestCooldown}
                    className="bg-dark text-white border-secondary"
                  />
                  <Form.Text className="text-muted">
                    Give your stream a descriptive title (max 50 characters)
                  </Form.Text>
                </Form.Group>
                
                {/* Current title display */}
                {currentTitle && (
                  <div className="mb-3 p-2 bg-dark rounded border border-secondary">
                    <strong>Current Title:</strong> {currentTitle}
                    {lastUpdated && (
                      <div className="mt-1 small text-muted">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    onClick={handleTitleUpdate}
                    disabled={!streamTitle.trim() || isLoading || requestCooldown}
                  >
                    {isLoading ? 'Updating...' : 'Set Title'}
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={handleResetTitle}
                    disabled={isLoading || requestCooldown}
                  >
                    Reset Title
                  </Button>
                </div>
              </Form>
            </Col>
            
            <Col md={6}>
              <h5>OBS Settings</h5>
              <p>Use these settings in OBS to start streaming:</p>
              
              <div className="mb-3">
                <strong>RTMP URL:</strong>
                <div className="d-flex align-items-center">
                  <input 
                    type="text" 
                    className="form-control bg-dark text-white border-secondary" 
                    value={streamConfig.rtmpUrl} 
                    readOnly 
                  />
                  <Button 
                    variant="outline-light" 
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
                    className="form-control bg-dark text-white border-secondary" 
                    value={streamConfig.streamKey || ''}
                    readOnly 
                  />
                  <Button 
                    variant="outline-light" 
                    className="ms-2"
                    onClick={() => handleCopyToClipboard(streamConfig.streamKey)}
                    disabled={!streamConfig.streamKey}
                  >
                    <FaCopy />
                  </Button>
                </div>
                {isLoading && <div className="text-center mt-2">Loading stream key...</div>}
                {requestCooldown && <div className="text-center mt-2 text-warning">Rate limit cooldown active</div>}
              </div>
            </Col>
          </Row>
          
          <div className="alert alert-info mt-3">
            <strong>Instructions:</strong>
            <ol className="mb-0">
              <li>Enter a title for your stream</li>
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
        <Modal.Footer className="bg-dark border-secondary">
          <Button 
            variant="secondary" 
            onClick={() => setShowStreamInfo(false)}
            disabled={isLoading}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
    </Container>
  );
};

export default LiveStreamsPage;
