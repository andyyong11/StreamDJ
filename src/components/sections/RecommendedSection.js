import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaPlay } from 'react-icons/fa';

const RecommendedSection = ({ apiUrl, title = "Recommended For You", onTrackSelect }) => {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch(apiUrl);
  
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
  
        const data = await res.json();
        console.log("🔎 API response:", data);
  
        // Ensure it's an array before setting state
        if (Array.isArray(data)) {
          setTracks(data);
        } else {
          console.warn("Expected array but got:", data);
          setTracks([]); // fallback to empty to prevent map error
        }
      } catch (err) {
        console.error('❌ Failed to fetch recommendations:', err);
      }
    };
  
    fetchRecommendations();
  }, [apiUrl]);
  

  if (tracks.length === 0) return null;

  return (
    <Container className="mb-5">
      <h2 className="mb-4">{title}</h2>
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
    </Container>
  );
};

export default RecommendedSection; 