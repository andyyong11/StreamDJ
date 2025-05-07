import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart } from 'react-icons/fa';

const LibraryPage = ({ userId }) => {
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [coverMap, setCoverMap] = useState({});

  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found. User may need to log in.');
        return;
      }
  
      fetch(`http://localhost:5001/api/playlists/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(async data => {
          if (!Array.isArray(data)) {
            console.error('Expected an array but got:', data);
            return;
          }
          setSavedPlaylists(data);
  
          const covers = {};
          for (const playlist of data) {
            const res = await fetch(`http://localhost:5001/api/playlists/${playlist.PlaylistID}/covers`);
            const coverUrls = await res.json();
            covers[playlist.PlaylistID] = coverUrls;
          }
          setCoverMap(covers);
        })
        .catch(err => {
          console.error('Failed to fetch playlists:', err);
        });
    }
  }, [userId]);
   

  const likedTracks = [
    { id: 1, title: 'Dreaming', artist: 'NightWave', duration: '3:25' },
    { id: 2, title: 'Skyline', artist: 'LoFiZone', duration: '4:02' },
    { id: 3, title: 'Rainy Mood', artist: 'Quiet Storm', duration: '3:58' }
  ];

  const followedArtists = [
    { id: 1, name: 'DJ Chill', genre: 'Lo-Fi', image: 'https://via.placeholder.com/150', followers: '820K' },
    { id: 2, name: 'BassBeats', genre: 'Electronic', image: 'https://via.placeholder.com/150', followers: '1.1M' }
  ];

  const renderPlaylistCover = (covers) => {
    if (!covers || covers.length === 0) return <div className="bg-dark" style={{ height: 200 }} />;
    if (covers.length === 1) {
      return <Card.Img variant="top" src={`http://localhost:5001/${covers[0]}`} style={{ height: 200, objectFit: 'cover' }} />;
    }
    return (
      <div className="playlist-cover-grid">
        {covers.slice(0, 4).map((url, idx) => (
          <img key={idx} src={`http://localhost:5001/${url}`} alt="cover"
            style={{ width: '50%', height: '100px', objectFit: 'cover', display: 'inline-block' }}
          />
        ))}
      </div>
    );
  };

  return (
    <Container style={{ paddingTop: '80px' }}>
      <section className="mb-5">
        <h2 className="mb-4">Your Playlists</h2>
        <Row>
          {savedPlaylists.map((playlist) => (
            <Col md={3} key={playlist.PlaylistID} className="mb-4">
              <Link to={`/playlist/${playlist.PlaylistID}`} className="text-decoration-none text-dark">
                <Card className="h-100 shadow-sm">
                  {renderPlaylistCover(coverMap[playlist.PlaylistID])}
                  <Card.Body>
                    <Card.Title>{playlist.Title}</Card.Title>
                    <Card.Text>{playlist.Description || 'No description'}</Card.Text>
                  </Card.Body>
                </Card>
              </Link>
              {/* <Card className="h-100 shadow-sm">
                {renderPlaylistCover(coverMap[playlist.PlaylistID])}
                <Card.Body>
                  <Card.Title>{playlist.Title}</Card.Title>
                  <Card.Text>
                    {playlist.Description || 'No description'}
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <Button variant="success" size="sm">
                      <FaPlay className="me-1" /> Play
                    </Button>
                    <Button variant="outline-danger" size="sm">
                      <FaHeart />
                    </Button>
                  </div>
                </Card.Body>
              </Card> */}
            </Col>
          ))}
        </Row>
      </section>

      <section className="mb-5">
        <h2 className="mb-4">Liked Tracks</h2>
        <Card className="shadow-sm">
          <Card.Body>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {likedTracks.map((track, index) => (
                  <tr key={track.id}>
                    <td>{index + 1}</td>
                    <td>{track.title}</td>
                    <td>{track.artist}</td>
                    <td>{track.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Body>
        </Card>
        <Button as={Link} to="/library/liked" variant="outline-primary">
          View Liked Songs
        </Button>
      </section>

      <section className="mb-5">
        <h2 className="mb-4">Followed Artists</h2>
        <Row>
          {followedArtists.map((artist) => (
            <Col md={3} key={artist.id} className="mb-4 text-center">
              <Card className="h-100 shadow-sm p-3">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="rounded-circle mb-2"
                  style={{ width: '100px', height: '100px' }}
                />
                <h5>{artist.name}</h5>
                <p className="text-muted">{artist.genre}</p>
                <p className="small">{artist.followers} followers</p>
                <Button variant="outline-primary" size="sm" as={Link} to={`/profile/${artist.id}`}>
                  View Profile
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Container>
  );
};

export default LibraryPage;


// import React from 'react';
// import { Container, Row, Col, Card, Button } from 'react-bootstrap';
// import { Link } from 'react-router-dom';
// import { FaPlay, FaHeart } from 'react-icons/fa';

// const LibraryPage = () => {
//   // Mock data
//   const savedPlaylists = [
//     { id: 1, title: 'Lo-Fi Study', creator: 'DJ Focus', image: 'https://via.placeholder.com/300', tracks: 22 },
//     { id: 2, title: 'Late Night Chill', creator: 'RelaxBeats', image: 'https://via.placeholder.com/300', tracks: 30 }
//   ];

//   const likedTracks = [
//     { id: 1, title: 'Dreaming', artist: 'NightWave', duration: '3:25' },
//     { id: 2, title: 'Skyline', artist: 'LoFiZone', duration: '4:02' },
//     { id: 3, title: 'Rainy Mood', artist: 'Quiet Storm', duration: '3:58' }
//   ];

//   const followedArtists = [
//     { id: 1, name: 'DJ Chill', genre: 'Lo-Fi', image: 'https://via.placeholder.com/150', followers: '820K' },
//     { id: 2, name: 'BassBeats', genre: 'Electronic', image: 'https://via.placeholder.com/150', followers: '1.1M' }
//   ];

//   return (
//     <Container style={{ paddingTop: '80px' }}>
//       {/* Saved Playlists */}
//       <section className="mb-5">
//         <h2 className="mb-4">Your Playlists</h2>
//         <Row>
//           {savedPlaylists.map(playlist => (
//             <Col md={3} key={playlist.id} className="mb-4">
//               <Card className="h-100 shadow-sm">
//                 <Card.Img variant="top" src={playlist.image} />
//                 <Card.Body>
//                   <Card.Title>{playlist.title}</Card.Title>
//                   <Card.Text>
//                     By {playlist.creator} • {playlist.tracks} tracks
//                   </Card.Text>
//                   <div className="d-flex justify-content-between">
//                     <Button variant="success" size="sm">
//                       <FaPlay className="me-1" /> Play
//                     </Button>
//                     <Button variant="outline-danger" size="sm">
//                       <FaHeart />
//                     </Button>
//                   </div>
//                 </Card.Body>
//               </Card>
//             </Col>
//           ))}
//         </Row>
//       </section>

//       {/* Liked Tracks */}
//       <section className="mb-5">
//         <h2 className="mb-4">Liked Tracks</h2>
//         <Card className="shadow-sm">
//           <Card.Body>
//             <table className="table table-hover">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Title</th>
//                   <th>Artist</th>
//                   <th>Duration</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {likedTracks.map((track, index) => (
//                   <tr key={track.id}>
//                     <td>{index + 1}</td>
//                     <td>{track.title}</td>
//                     <td>{track.artist}</td>
//                     <td>{track.duration}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </Card.Body>
//         </Card>
//       </section>

//       <Button as={Link} to="/library/liked" variant="outline-primary">
//   View Liked Songs
// </Button>

//       {/* Followed Artists */}
//       <section className="mb-5">
//         <h2 className="mb-4">Followed Artists</h2>
//         <Row>
//           {followedArtists.map(artist => (
//             <Col md={3} key={artist.id} className="mb-4 text-center">
//               <Card className="h-100 shadow-sm p-3">
//                 <img
//                   src={artist.image}
//                   alt={artist.name}
//                   className="rounded-circle mb-2"
//                   style={{ width: '100px', height: '100px' }}
//                 />
//                 <h5>{artist.name}</h5>
//                 <p className="text-muted">{artist.genre}</p>
//                 <p className="small">{artist.followers} followers</p>
//                 <Button variant="outline-primary" size="sm" as={Link} to={`/profile/${artist.id}`}>
//                   View Profile
//                 </Button>
//               </Card>
//             </Col>
//           ))}
//         </Row>
//       </section>
//     </Container>
//   );
// };

// export default LibraryPage;
