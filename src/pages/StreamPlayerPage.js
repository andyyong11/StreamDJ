import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import ChatBox from '../components/chat/ChatBox';
import { useAuth } from '../context/AuthContext';

const StreamPlayerPage = () => {
  const { streamId } = useParams();
  const { token } = useAuth();
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

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

  useEffect(() => {
    if (!stream || !videoRef.current) return;

    console.log('Setting up HLS player for stream:', stream.StreamKey);
    const videoElement = videoRef.current;
    const streamUrl = `http://localhost:5001/live/${stream.StreamKey}/index.m3u8`;
    console.log('Stream URL:', streamUrl);

    const checkStreamAvailability = async () => {
      try {
        const response = await fetch(streamUrl);
        console.log('HLS manifest response:', response.status);
        const manifest = await response.text();
        console.log('HLS manifest content:', manifest);
      } catch (err) {
        console.error('Error checking stream availability:', err);
      }
    };

    checkStreamAvailability();

    if (Hls.isSupported()) {
      console.log('HLS.js is supported');
      if (hlsRef.current) {
        console.log('Destroying previous HLS instance');
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        debug: true,
        enableWorker: true,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 3
      });

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS: Media attached');
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('HLS: Manifest parsed', data);
        videoElement.play().catch(e => console.error('Error playing video:', e));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', event, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal network error encountered, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal media error encountered, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error, cannot recover');
              hls.destroy();
              break;
          }
        }
      });

      console.log('Loading HLS source:', streamUrl);
      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);
      hlsRef.current = hls;

      console.log('HLS player setup complete');
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('Using native HLS support');
      videoElement.src = streamUrl;
    }

    return () => {
      if (hlsRef.current) {
        console.log('Cleaning up HLS player');
        hlsRef.current.destroy();
      }
    };
  }, [stream]);

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
      <Row>
        <Col md={9}>
          <div className="video-container">
            <video
              ref={videoRef}
              controls
              style={{ width: '100%', maxHeight: '80vh' }}
              playsInline
              autoPlay
            />
          </div>
          <h2 className="mt-3">{stream.Title || 'Untitled Stream'}</h2>
          <p>{stream.Description || 'No description available'}</p>
        </Col>
        <Col md={3}>
          <ChatBox streamId={streamId} />
        </Col>
      </Row>
    </Container>
  );
};

export default StreamPlayerPage; 