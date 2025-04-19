const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const fetchStream = async (streamId) => {
  const response = await fetch(`${API_URL}/streams/${streamId}`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch stream');
  }
  return response.json();
};

export const fetchChatHistory = async (streamId) => {
  const response = await fetch(`${API_URL}/streams/${streamId}/chat`, {
    headers: getHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch chat history');
  }
  return response.json();
}; 