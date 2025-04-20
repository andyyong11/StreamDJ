import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';

const ChatBox = ({ streamId }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    // Join stream chat room
    newSocket.emit('join_stream', { streamId });

    // Listen for messages
    newSocket.on('chat_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // Listen for user join/leave events
    newSocket.on('user_joined', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${data.username} joined the chat`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    newSocket.on('user_left', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${data.username} left the chat`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    return () => {
      newSocket.emit('leave_stream', { streamId });
      newSocket.disconnect();
    };
  }, [streamId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (message.trim() && socket) {
      const messageData = {
        streamId,
        userId: user.id,
        username: user.username,
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString()
      };
      socket.emit('send_message', messageData);
      setMessage('');
    }
  };

  return (
    <Card className="chat-box">
      <Card.Header>Stream Chat</Card.Header>
      <Card.Body>
        <div className="chat-messages" style={{ height: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type === 'system' ? 'system-message' : ''}`}>
              <small className="text-muted">{msg.timestamp}</small>
              {msg.type === 'system' ? (
                <p className="mb-0 text-muted">{msg.message}</p>
              ) : (
                <p className="mb-0">
                  <strong>{msg.username}:</strong> {msg.message}
                </p>
              )}
            </div>
          ))}
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="submit" variant="primary" className="ms-2">
              Send
            </Button>
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ChatBox; 