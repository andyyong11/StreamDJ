import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:5001', {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected with ID:', this.socket.id);
      });

      this.socket.on('stream_started', (stream) => {
        console.log('Stream started:', stream);
      });

      this.socket.on('stream_ended', (data) => {
        console.log('Stream ended:', data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a specific stream's chat room
  joinStreamChat(streamId) {
    if (this.socket) {
      this.socket.emit('join_stream', streamId);
    }
  }

  // Leave a stream's chat room
  leaveStreamChat(streamId) {
    if (this.socket) {
      this.socket.emit('leave_stream', streamId);
    }
  }

  // Send a chat message
  sendMessage(streamId, message) {
    if (this.socket) {
      this.socket.emit('chat_message', { streamId, message });
    }
  }

  // Subscribe to incoming messages
  onMessage(callback) {
    if (this.socket) {
      this.socket.on('chat_message', callback);
    }
  }

  // Subscribe to user join/leave events
  onUserJoin(callback) {
    if (this.socket) {
      this.socket.on('user_joined', callback);
    }
  }

  onUserLeave(callback) {
    if (this.socket) {
      this.socket.on('user_left', callback);
    }
  }
}

const socketService = new SocketService();
export default socketService; 