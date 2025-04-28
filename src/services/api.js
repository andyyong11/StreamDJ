const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getToken = () => {
  return localStorage.getItem('token');
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const defaultConfig = {
  credentials: 'include',
  mode: 'cors',
  headers: getHeaders(),
};

const fetchWithConfig = async (url, customConfig = {}) => {
  const config = {
    ...defaultConfig,
    ...customConfig,
    headers: {
      ...defaultConfig.headers,
      ...(customConfig.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export const fetchStreams = () => {
  return fetchWithConfig(`${API_URL}/streams`);
};

export const fetchChatHistory = (streamId) => {
  return fetchWithConfig(`${API_URL}/chat/${streamId}`);
};

export const login = async (email, password) => {
  return fetchWithConfig(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

export const createStream = async (streamData) => {
  return fetchWithConfig(`${API_URL}/streams/create`, {
    method: 'POST',
    body: JSON.stringify(streamData)
  });
};

export const fetchActiveStreams = async () => {
  return fetchWithConfig(`${API_URL}/streams/active`);
}; 