import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import ChatBox from '../components/chat/ChatBox';
import { useAuth } from '../context/AuthContext';
import StreamPlayer from '../components/StreamPlayer';
import StreamControls from '../components/StreamControls';

const StreamPlayerPage = ({ openLoginModal }) => {
  const { streamId } = useParams();
  const { token, user } = useAuth();
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    console.log('StreamPlayerPage mounted with streamId:', streamId);
    if (!streamId) {
      setError('No stream ID provided');
      setIsLoading(false);
      return;
    }

    const fetchStreamData = async () => {
      try {
        console.log('Fetching stream data for ID:', streamId);
        const response = await fetch(`http://localhost:5001/api/streams/${streamId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Stream API response status:', response.status);
        const data = await response.json();
        console.log('Raw API response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stream data');
        }

        if (!data.success || !data.data) {
          throw new Error('Invalid stream data received');
        }

        console.log('Processed stream data:', data.data);
        
        // Initialize viewer count if the stream data includes it
        if (data.data.ListenerCount !== undefined) {
          setViewerCount(data.data.ListenerCount);
          console.log(`Setting initial viewer count to ${data.data.ListenerCount}`);
        } else {
          console.log('No ListenerCount in stream data, defaulting to 0');
          setViewerCount(0);
        }
        
        setStream(data.data);
      } catch (err) {
        console.error('Error fetching stream:', err);
        setError(err.message || 'Failed to load stream');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamData();
  }, [streamId, token]);

  const handleStreamUpdate = (updatedStream) => {
    console.log('StreamPlayerPage: Stream updated', updatedStream);
    setStream(updatedStream);
  };
  
  // Handle viewer count updates from StreamPlayer
  const handleViewerCountChange = (count) => {
    console.log('StreamPlayerPage: Viewer count updated:', count);
    setViewerCount(count);
    
    // Update the document title to include viewer count
    if (stream && stream.Title) {
      document.title = `${stream.Title} (${count} watching) | StreamDJ`;
    }
  };

  // Initialize document title when stream loads
  useEffect(() => {
    if (stream && stream.Title) {
      document.title = `${stream.Title} (${viewerCount} watching) | StreamDJ`;
    }
    return () => {
      document.title = 'StreamDJ';
    };
  }, [stream, viewerCount]);

  if (isLoading) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Loading stream...</Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!stream) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Stream not found or no longer active
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="stream-player-row">
        <Col md={8} lg={9}>
          <div className="video-container mb-4">
            <StreamPlayer 
              streamId={streamId} 
              streamKey={stream.StreamKey}
              onViewerCountChange={handleViewerCountChange}
            />
          </div>
          
          <h2 className="mt-3 mb-4">
            {stream.Title || 'Untitled Stream'} 
            <span className="text-muted ms-2" style={{ fontSize: '1rem' }}>
              • {viewerCount} watching now
            </span>
          </h2>
          
          {user && user.id === stream.UserID && (
            <div className="mb-4">
              <StreamControls 
                streamId={streamId} 
                streamData={stream} 
                onStreamUpdated={handleStreamUpdate}
                viewerCount={viewerCount}
              />
            </div>
          )}
        </Col>
        <Col md={4} lg={3} className="chat-column">
          <div className="chat-container">
            <ChatBox streamId={streamId} openLoginModal={openLoginModal} />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default StreamPlayerPage; 