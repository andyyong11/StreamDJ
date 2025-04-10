import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { FaUpload, FaFileAudio, FaImage } from 'react-icons/fa';

const UploadTrackForm = () => {
  const [formData, setFormData] = useState({
    userId: 1,
    title: '',
    genre: '',
    duration: '',
    audioFile: null,
    coverArt: null,
  });

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
    const body = new FormData();
    body.append('userId', formData.userId);
    body.append('title', formData.title);
    body.append('genre', formData.genre);
    body.append('duration', formData.duration);
    body.append('audioFile', formData.audioFile);
    body.append('coverArt', formData.coverArt);

    const res = await fetch('http://localhost:5001/api/tracks/upload', {
      method: 'POST',
      body,
    });

    if (res.ok) {
      alert('Track uploaded successfully!');
    } else {
      alert('Upload failed.');
    }
  };

  return (
    <Container>
      <Card className="p-4 shadow-lg">
        <Card.Title className="mb-4">Upload New Track</Card.Title>
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              placeholder="Track Title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Genre</Form.Label>
            <Form.Control
              type="text"
              name="genre"
              placeholder="Genre"
              value={formData.genre}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Duration (e.g., 3 minutes)</Form.Label>
            <Form.Control
              type="text"
              name="duration"
              placeholder="e.g., 3 minutes"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Row>
            <Col md={6} className="mb-3">
              <Form.Label>Audio File <FaFileAudio /></Form.Label>
              <Form.Control
                type="file"
                name="audioFile"
                accept="audio/*"
                onChange={handleChange}
                required
              />
            </Col>
            <Col md={6} className="mb-3">
              <Form.Label>Cover Art <FaImage /></Form.Label>
              <Form.Control
                type="file"
                name="coverArt"
                accept="image/*"
                onChange={handleChange}
                required
              />
            </Col>
          </Row>

          <Button variant="primary" type="submit" className="mt-3">
            <FaUpload className="me-2" /> Upload Track
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default UploadTrackForm;