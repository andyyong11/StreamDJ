import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Generate a temporary ID for anonymous users
const getAnonymousId = () => {
  let anonymousId = localStorage.getItem('anonymousUserId');
  if (!anonymousId) {
    anonymousId = uuidv4();
    localStorage.setItem('anonymousUserId', anonymousId);
  }
  return anonymousId;
};

class SocketService {
  constructor() {
    this.socket = null;
    this.anonymousId = getAnonymousId();
  }

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:5001', {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: {
          anonymousId: this.anonymousId
        }
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

      this.socket.on('stream_updated', (data) => {
        console.log('Stream updated:', data);
      });

      this.socket.on('viewer_count_update', (data) => {
        console.log('Viewer count update:', data);
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
      this.socket.emit('join_stream', { streamId });
    }
  }

  // Leave a stream's chat room
  leaveStreamChat(streamId) {
    if (this.socket) {
      this.socket.emit('leave_stream', { streamId });
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

  // Viewer count tracking methods
  joinStreamViewers(streamId) {
    if (this.socket) {
      console.log(`Socket: joinStreamViewers for stream ${streamId}`);
      this.socket.emit('join_stream_viewers', { 
        streamId,
        anonymousId: this.anonymousId 
      });
    }
  }

  trackViewerJoin(streamId) {
    if (this.socket) {
      console.log(`Socket: trackViewerJoin for stream ${streamId}`);
      this.socket.emit('viewer_joined', { 
        streamId,
        anonymousId: this.anonymousId
      });
      
      // Also make sure we're in the viewer tracking room
      this.joinStreamViewers(streamId);
    }
  }

  trackViewerLeave(streamId) {
    if (this.socket) {
      console.log(`Socket: trackViewerLeave for stream ${streamId}`);
      this.socket.emit('viewer_left', { 
        streamId,
        anonymousId: this.anonymousId
      });
    }
  }

  onViewerCountUpdate(callback) {
    if (this.socket) {
      console.log('Socket: Registering onViewerCountUpdate handler');
      this.socket.on('viewer_count_update', (data) => {
        console.log('Socket: Received viewer_count_update', data);
        callback(data);
      });
    }
  }

  offViewerCountUpdate() {
    if (this.socket) {
      console.log('Socket: Removing viewer_count_update handler');
      this.socket.off('viewer_count_update');
    }
  }
}

const socketService = new SocketService();
export default socketService; 