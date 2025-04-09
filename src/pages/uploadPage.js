import React, { useState } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const UploadPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    duration: '',
    audioFile: null,
    coverArt: null,
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.audioFile || !formData.title || !formData.genre) {
      setErrorMsg('Title, genre, and audio file are required.');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('genre', formData.genre);
    data.append('duration', formData.duration);
    data.append('audioFile', formData.audioFile);
    if (formData.coverArt) data.append('coverArt', formData.coverArt);
    data.append('userId', user.id); // Pass UserID to backend

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/tracks', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setSuccessMsg('Track uploaded successfully!');
      setFormData({
        title: '',
        genre: '',
        duration: '',
        audioFile: null,
        coverArt: null,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Upload a Track</h2>

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="trackTitle" className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="trackGenre" className="mb-3">
          <Form.Label>Genre</Form.Label>
          <Form.Control
            type="text"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="trackDuration" className="mb-3">
          <Form.Label>Duration (e.g., 3:45)</Form.Label>
          <Form.Control
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Optional"
          />
        </Form.Group>

        <Form.Group controlId="audioFile" className="mb-3">
          <Form.Label>Audio File</Form.Label>
          <Form.Control
            type="file"
            accept="audio/*"
            name="audioFile"
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="coverArt" className="mb-4">
          <Form.Label>Cover Art (optional)</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            name="coverArt"
            onChange={handleChange}
          />
        </Form.Group>

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Upload'}
        </Button>
      </Form>
    </Container>
  );
};

export default UploadPage;

