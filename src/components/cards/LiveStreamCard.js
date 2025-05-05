import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FaHeadphones, FaPlay } from 'react-icons/fa';

const LiveStreamCard = ({ stream, onJoinClick }) => {
  const handleCardClick = () => {
    if (onJoinClick) {
      onJoinClick(stream);
    }
  };

  const handleJoinClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onJoinClick) {
      onJoinClick(stream);
    }
  };

  return (
    <Card 
      className="h-100 shadow-sm"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={stream.CoverImage || `https://placehold.co/600x400/1a1a1a/white?text=${stream.Title}`} 
          alt={stream.Title}
          style={{ height: '180px', objectFit: 'cover' }}
        />
        <Badge 
          bg="danger" 
          className="position-absolute top-0 start-0 m-2"
          style={{ fontSize: "0.8rem", padding: "0.4em 0.6em" }}
        >
          LIVE
        </Badge>
        <Badge 
          bg="dark" 
          className="position-absolute bottom-0 start-0 m-2"
        >
          <FaHeadphones className="me-1" /> {stream.ListenerCount}
        </Badge>
        <Button 
          variant="primary" 
          size="sm" 
          className="position-absolute bottom-0 end-0 m-2 rounded-circle"
          style={{ width: '35px', height: '35px', padding: '6px 0' }}
          onClick={handleJoinClick}
        >
          <FaPlay />
        </Button>
      </div>
      <Card.Body>
        <Card.Title className="text-truncate">{stream.Title}</Card.Title>
        <Card.Text className="text-muted small">
          By {stream.Username}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default LiveStreamCard; 