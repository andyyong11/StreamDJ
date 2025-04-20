import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { FaUpload, FaFileAudio, FaImage } from 'react-icons/fa';

const UploadTrackForm = () => {
  const [formData, setFormData] = useState({
    userId: 1,
    title: '',
    genre: '',
    duration: '',
    artist: '',
    featuredArtists: [],
    audioFile: null,
    coverArt: null,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/users');
        const data = await res.json();
        // We don't need to store users anymore since we're not using them
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

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
    body.append('artist', formData.artist);
    body.append('genre', formData.genre);
    body.append('duration', formData.duration);
    body.append('audioFile', formData.audioFile);
    body.append('coverArt', formData.coverArt);
    formData.featuredArtists.forEach((username) =>
      body.append('featuredArtists[]', username)
    );

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
            <Form.Label>Artist Name (Primary)</Form.Label>
            <Form.Control
              type="text"
              name="artist"
              placeholder="Artist"
              value={formData.artist}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Featured Artists (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="featuredArtists"
              placeholder="e.g. coolDude99, beatQueen, vibemaster"
              value={formData.featuredArtists.join(', ')}
              onChange={(e) => {
                const usernames = e.target.value
                  .split(',')
                  .map(name => name.trim())
                  .filter(name => name !== '');
                setFormData((prev) => ({ ...prev, featuredArtists: usernames }));
              }}
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
            <Form.Label>Duration (in seconds)</Form.Label>
            <Form.Control
              type="number"
              name="duration"
              placeholder="e.g., 180"
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



// import React, { useState } from 'react';
// import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
// import { FaUpload, FaFileAudio, FaImage } from 'react-icons/fa';

// const UploadTrackForm = () => {
//   const [formData, setFormData] = useState({
//     userId: 1,
//     title: '',
//     genre: '',
//     duration: '',
//     audioFile: null,
//     coverArt: null,
//     featuredArtists: '', // comma-separated UserIDs
//   });

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     if (files) {
//       setFormData((prev) => ({ ...prev, [name]: files[0] }));
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const body = new FormData();
//     body.append('userId', formData.userId);
//     body.append('title', formData.title);
//     body.append('genre', formData.genre);
//     body.append('duration', formData.duration);
//     body.append('audioFile', formData.audioFile);
//     body.append('coverArt', formData.coverArt);

//     // Append featured artist IDs as a comma-separated string
//     body.append('featuredUsernames', formData.featuredUsernames);
//     // body.append('featuredArtists', formData.featuredArtists);

//     const res = await fetch('http://localhost:5001/api/tracks/upload', {
//       method: 'POST',
//       body,
//     });

//     if (res.ok) {
//       alert('Track uploaded successfully!');
//     } else {
//       alert('Upload failed.');
//     }
//   };

//   return (
//     <Container>
//       <Card className="p-4 shadow-lg">
//         <Card.Title className="mb-4">Upload New Track</Card.Title>
//         <Form onSubmit={handleSubmit} encType="multipart/form-data">
//           <Form.Group className="mb-3">
//             <Form.Label>Title</Form.Label>
//             <Form.Control
//               type="text"
//               name="title"
//               placeholder="Track Title"
//               value={formData.title}
//               onChange={handleChange}
//               required
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Genre</Form.Label>
//             <Form.Control
//               type="text"
//               name="genre"
//               placeholder="Genre"
//               value={formData.genre}
//               onChange={handleChange}
//               required
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Duration (in seconds)</Form.Label>
//             <Form.Control
//               type="number"
//               name="duration"
//               placeholder="e.g., 180"
//               value={formData.duration}
//               onChange={handleChange}
//               required
//             />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Featured Artists (Usernames, comma-separated)</Form.Label>
//             <Form.Control
//               type="text"
//               name="featuredUsernames"
//               placeholder="e.g., Francis, Andy, Sam, Kobe"
//               value={formData.featuredUsernames || ''}
//               onChange={handleChange}
//             />
//           </Form.Group>

//           <Row>
//             <Col md={6} className="mb-3">
//               <Form.Label>Audio File <FaFileAudio /></Form.Label>
//               <Form.Control
//                 type="file"
//                 name="audioFile"
//                 accept="audio/*"
//                 onChange={handleChange}
//                 required
//               />
//             </Col>
//             <Col md={6} className="mb-3">
//               <Form.Label>Cover Art <FaImage /></Form.Label>
//               <Form.Control
//                 type="file"
//                 name="coverArt"
//                 accept="image/*"
//                 onChange={handleChange}
//                 required
//               />
//             </Col>
//           </Row>

//           <Button variant="primary" type="submit" className="mt-3">
//             <FaUpload className="me-2" /> Upload Track
//           </Button>
//         </Form>
//       </Card>
//     </Container>
//   );
// };

// export default UploadTrackForm;

