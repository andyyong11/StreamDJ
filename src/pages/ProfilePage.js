import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';
import { FaHeart, FaPlay, FaUserFriends, FaMusic, FaEllipsisH, FaCheckCircle, FaEdit } from 'react-icons/fa';

const ProfilePage = () => {
  const { id } = useParams();

  const users = {
    1: {
      name: 'DJ Sparkle',
      followers: '1.2M',
      following: 345,
      avatar: 'https://via.placeholder.com/150',
      banner: 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png',
      bio: 'Bringing the best beats to your ears. Live DJ, music producer, and sound enthusiast.'
    }
  };

  const [user, setUser] = useState(users[id] || users[1]);
  const [showEdit, setShowEdit] = useState(false);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    setUser({
      ...user,
      name: form.name.value,
      bio: form.bio.value,
      avatar: form.avatar.value,
      banner: form.banner.value
    });
    setShowEdit(false);
  };

  const playlists = [
    { id: 1, title: 'My Favorite Mixes', tracks: 20, image: '/default-cover.jpg', liked: true },
    { id: 2, title: 'Chill Out Sessions', tracks: 15, image: '/default-cover.jpg' },
    { id: 3, title: 'Top Hits', tracks: 30, image: '/default-cover.jpg' }
  ];

  const recentTracks = [
    { id: 1, title: 'Summer Groove', duration: '3:45', plays: 1250000 },
    { id: 2, title: 'Midnight City', duration: '4:12', plays: 980000 },
    { id: 3, title: 'Chill Wave', duration: '5:30', plays: 750000 }
  ];

  const uploadedTracks = [
    { id: 1, title: 'Lo-Fi Vibes', duration: '3:33', plays: 50000 },
    { id: 2, title: 'Deep House Party', duration: '4:45', plays: 87000 }
  ];

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      {/* Banner */}
      <div
        style={{
          backgroundImage: `url(${user.banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '400px',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <img
            src={user.avatar}
            alt="Profile"
            className="rounded-circle border border-white"
            style={{ width: '120px', height: '120px' }}
          />
          <div>
            <h1 className="mb-1">
              {user.name} <FaCheckCircle className="text-primary" />
            </h1>
            <p className="text-light small">{user.bio}</p>
            <div className="d-flex gap-3">
              <Badge bg="primary"><FaUserFriends /> {user.followers} Followers</Badge>
              <Badge bg="secondary"><FaMusic /> {user.following} Following</Badge>
              <Button size="sm" variant="light" onClick={() => setShowEdit(true)}><FaEdit /> Edit</Button>
            </div>
          </div>
        </div>
      </div>

      <Container className="mt-5">
        {/* Playlists */}
        <section className="mb-5">
          <h3 className="mb-4">Playlists</h3>
          <Row>
            {playlists.map(playlist => (
              <Col md={4} key={playlist.id} className="mb-4">
                <Card className="bg-dark text-white shadow-sm">
                  <Card.Img variant="top" src={playlist.image} />
                  <Card.Body>
                    <Card.Title>{playlist.liked ? '❤️ ' + playlist.title : playlist.title}</Card.Title>
                    <Card.Text>{playlist.tracks} tracks</Card.Text>
                    <Button variant="success" size="sm">
                      <FaPlay className="me-1" /> Play
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Recently Played */}
        <section className="mb-5">
          <h3 className="mb-4">Recently Played</h3>
          <Card className="bg-dark text-white">
            <Card.Body>
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Plays</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentTracks.map((track, index) => (
                    <tr key={track.id}>
                      <td>{index + 1}</td>
                      <td>{track.title}</td>
                      <td>{track.duration}</td>
                      <td>{track.plays.toLocaleString()}</td>
                      <td><Button variant="link" className="text-white p-0"><FaEllipsisH /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </section>

        {/* Uploaded Tracks */}
        <section className="mb-5">
          <h3 className="mb-4">Uploaded Songs</h3>
          <Card className="bg-dark text-white">
            <Card.Body>
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Plays</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedTracks.map((track, index) => (
                    <tr key={track.id}>
                      <td>{index + 1}</td>
                      <td>{track.title}</td>
                      <td>{track.duration}</td>
                      <td>{track.plays.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </section>
      </Container>

      {/* Edit Profile Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Display Name</Form.Label>
              <Form.Control type="text" name="name" defaultValue={user.name} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control as="textarea" name="bio" defaultValue={user.bio} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Profile Picture URL</Form.Label>
              <Form.Control type="url" name="avatar" defaultValue={user.avatar} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cover Image URL</Form.Label>
              <Form.Control type="url" name="banner" defaultValue={user.banner} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;


// import React from 'react';
// import { useParams } from 'react-router-dom';
// import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
// import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH } from 'react-icons/fa';

// const ProfilePage = () => {
//   // Get the profile ID from the URL
//   const { id } = useParams();

//   // Mock user data based on ID
//   const users = {
//     1: {
//       name: 'DJ Sparkle',
//       followers: '1.2M',
//       following: 345,
//       avatar: 'https://via.placeholder.com/150',
//       banner: 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png',
//       bio: 'Bringing the best beats to your ears. Live DJ, music producer, and sound enthusiast.'
//     },
//     2: {
//       name: 'BeatMaster',
//       followers: '980K',
//       following: 210,
//       avatar: 'https://via.placeholder.com/150',
//       banner: 'https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png',
//       bio: 'Hip Hop is life. Bringing the best rap beats and remixes to the stage.'
//     },
//     3: {
//       name: 'ElectroQueen',
//       followers: '1.5M',
//       following: 500,
//       avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCJkAoQFnKSizD__XWUr1_RhK86R8E7h8I0g&s',
//       banner: 'https://i.etsystatic.com/34466454/r/il/730751/4475686453/il_fullxfull.4475686453_n0ds.jpg',
//       bio: 'Electronic beats and house music to keep the party going all night.'
//     }
//   };

//   // Get user data; if ID is not found, default to user 1
//   const user = users[id] || users[1];

//   // Mock playlists
//   const playlists = [
//     { id: 1, title: 'My Favorite Mixes', tracks: 20, image: 'https://preview.redd.it/heres-some-playlist-icons-in-the-style-of-liked-songs-you-v0-cahrrr1is8ee1.png?width=473&format=png&auto=webp&s=e33bfdb466d30f69fa4209b41f90dc7e41f0e609' },
//     { id: 2, title: 'Chill Out Sessions', tracks: 15, image: 'https://lofigirl.com/wp-content/uploads/2023/02/DAY_UPDATE_ILLU.jpg' },
//     { id: 3, title: 'Top Hits', tracks: 30, image: 'https://i.scdn.co/image/ab67616d0000b273016d1a64505bc840c5e60469' },
//   ];

//   // Mock recent tracks
//   const recentTracks = [
//     { id: 1, title: 'Summer Groove', duration: '3:45', plays: 1250000 },
//     { id: 2, title: 'Midnight City', duration: '4:12', plays: 980000 },
//     { id: 3, title: 'Chill Wave', duration: '5:30', plays: 750000 },
//   ];

//   return (
//     <Container>
//       {/* Profile Banner */}
//       <Card className="mb-4">
//         <Card.Img src={user.banner} alt="Profile Banner" className="rounded" />
//         <Card.ImgOverlay className="d-flex flex-column justify-content-end">
//           <Row className="align-items-center">
//             <Col md={3} className="text-center">
//               <img
//                 src={user.avatar}
//                 alt={user.name}
//                 className="rounded-circle border border-white"
//                 style={{ width: '120px', height: '120px' }}
//               />
//             </Col>
//             <Col md={6}>
//               <h2 className="text-white">{user.name}</h2>
//               <p className="text-light">{user.bio}</p>
//               <Badge bg="primary" className="me-2">
//                 <FaUserFriends /> {user.followers} Followers
//               </Badge>
//               <Badge bg="secondary">
//                 <FaMusic /> {user.following} Following
//               </Badge>
//             </Col>
//             <Col md={3} className="text-end">
//               <Button variant="danger" className="me-2">
//                 <FaHeart /> Follow
//               </Button>
//               <Button variant="light">
//                 <FaEllipsisH />
//               </Button>
//             </Col>
//           </Row>
//         </Card.ImgOverlay>
//       </Card>

//       {/* My Playlists */}
//       <section className="mb-5">
//         <h3 className="mb-4">{user.name}'s Playlists</h3>
//         <Row>
//           {playlists.map(playlist => (
//             <Col md={4} key={playlist.id} className="mb-4">
//               <Card className="shadow-sm">
//                 <Card.Img variant="top" src={playlist.image} />
//                 <Card.Body>
//                   <Card.Title>{playlist.title}</Card.Title>
//                   <Card.Text>{playlist.tracks} tracks</Card.Text>
//                   <Button variant="success" size="sm">
//                     <FaPlay className="me-1" /> Play
//                   </Button>
//                 </Card.Body>
//               </Card>
//             </Col>
//           ))}
//         </Row>
//       </section>

//       {/* Recently Played Tracks */}
//       <section className="mb-5">
//         <h3 className="mb-4">Recently Played by {user.name}</h3>
//         <Card>
//           <Card.Body>
//             <table className="table">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Title</th>
//                   <th>Duration</th>
//                   <th>Plays</th>
//                   <th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {recentTracks.map((track, index) => (
//                   <tr key={track.id}>
//                     <td>{index + 1}</td>
//                     <td>{track.title}</td>
//                     <td>{track.duration}</td>
//                     <td>{track.plays.toLocaleString()}</td>
//                     <td>
//                       <Button variant="link" className="p-0">
//                         <FaEllipsisH />
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </Card.Body>
//         </Card>
//       </section>
//     </Container>
//   );
// };

// export default ProfilePage;
