import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socket';

const ChatBox = ({ streamId, openLoginModal }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const chatBoxRef = useRef(null);
  const [messagesSent, setMessagesSent] = useState(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollbar, setShowScrollbar] = useState(false);
  
  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll events to detect when user manually scrolls
  const handleScroll = () => {
    if (!chatMessagesRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
    const bottomThreshold = 50; // pixels from bottom to consider "at bottom"
    const atBottom = scrollHeight - scrollTop - clientHeight <= bottomThreshold;
    
    // Only change autoScroll if it needs to change
    if (atBottom !== autoScroll) {
      setAutoScroll(atBottom);
    }
  };

  // Check if content overflows and should show scrollbar
  const checkContentOverflow = () => {
    if (!chatMessagesRef.current) return;
    
    const { scrollHeight, clientHeight } = chatMessagesRef.current;
    // If content is taller than the container, show scrollbar
    setShowScrollbar(scrollHeight > clientHeight);
  };

  // Scroll to bottom when messages change, but respect user scrolling
  useEffect(() => {
    scrollToBottom();
    checkContentOverflow();
  }, [messages]);

  useEffect(() => {
    // Get socket connection
    const socket = socketService.connect();
    
    // Join stream chat room
    socketService.joinStreamChat(streamId);

    // Clear messages when component mounts
    setMessages([]);
    setMessagesSent(new Set());
    setAutoScroll(true);

    // Set up message handlers
    const handleChatMessage = (data) => {
      console.log("Received chat message:", data);
      
      // Generate a unique ID for this message to prevent duplicates
      const messageId = `${data.userId}-${data.timestamp}-${data.message}`;
      
      // Only add the message if we haven't seen it before
      if (!messagesSent.has(messageId)) {
        setMessages(prev => [...prev, data]);
      }
    };

    socket.on('chat_message', handleChatMessage);

    socket.on('user_joined', (data) => {
      console.log("User joined:", data);
      const systemMessage = {
        type: 'system',
        message: `${data.username} joined the chat`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    socket.on('user_left', (data) => {
      console.log("User left:", data);
      const systemMessage = {
        type: 'system',
        message: `${data.username} left the chat`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    // Create system message for connection
    setMessages([{
      type: 'system',
      message: 'Connected to chat',
      timestamp: new Date().toLocaleTimeString()
    }]);

    return () => {
      // Leave stream chat room and remove handlers
      socketService.leaveStreamChat(streamId);
      socket.off('chat_message', handleChatMessage);
      socket.off('user_joined');
      socket.off('user_left');
    };
  }, [streamId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted with message:", message);

    if (!user) {
      console.log("No user logged in, showing login modal");
      if (openLoginModal) {
        openLoginModal();
      }
      return;
    }

    if (message.trim()) {
      const messageData = {
        streamId,
        userId: user.id,
        username: user.username || 'Anonymous',
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString()
      };

      console.log("Sending message:", messageData);
      const socket = socketService.getSocket();
      socket.emit('send_message', messageData);
      
      // Track this message as sent by us to prevent duplicates
      const messageId = `${messageData.userId}-${messageData.timestamp}-${messageData.message}`;
      setMessagesSent(prev => new Set(prev).add(messageId));
      
      // Reset auto-scroll to bring us to the bottom after sending a message
      setAutoScroll(true);
      
      // Clear the input
      setMessage('');
    }
  };

  // Force scroll to bottom
  const handleScrollToBottom = () => {
    setAutoScroll(true);
    scrollToBottom();
  };

  // Add a test message for debugging
  const addTestMessage = () => {
    const testMessage = {
      streamId,
      userId: 'system',
      username: 'System',
      message: 'This is a test message',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system'
    };
    console.log("Adding test message:", testMessage);
    setMessages(prev => [...prev, testMessage]);
  };

  return (
    <Card className="chat-box h-100" ref={chatBoxRef}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Stream Chat</h5>
        {!autoScroll && showScrollbar && (
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleScrollToBottom}
            className="scroll-to-bottom-btn"
          >
            ↓ Jump to bottom
          </Button>
        )}
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={addTestMessage}
          style={{ fontSize: '0.7rem' }}
        >
          Test
        </Button>
      </Card.Header>
      <Card.Body className="d-flex flex-column p-0">
        <div 
          className={`chat-messages ${showScrollbar ? 'has-scrollbar' : ''}`} 
          ref={chatMessagesRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 && (
            <div className="text-center py-3 empty-message">
              <p>No messages yet. Be the first to chat!</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.type === 'system' ? 'system-message' : ''}`}
            >
              <div className="message-header">
                {msg.type !== 'system' && (
                  <span className="username">{msg.username}</span>
                )}
                <span className="timestamp">{msg.timestamp}</span>
              </div>
              
              <div className="message-content">
                {msg.type === 'system' ? (
                  <p>{msg.message}</p>
                ) : (
                  <p>{msg.message}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <Form onSubmit={handleSubmit} className="chat-input-form mt-auto">
          <Form.Group className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button 
              type="submit" 
              variant="primary"
              className="ms-2"
              disabled={!message.trim()}
            >
              Send
            </Button>
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ChatBox; 