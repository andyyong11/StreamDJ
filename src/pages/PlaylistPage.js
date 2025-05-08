import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Table, Dropdown } from 'react-bootstrap';
import { FaPlay } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import AddToPlaylistModal from '../components/player/AddToPlaylistModal'; // adjust the path as needed
import { useAuth } from '../context/AuthContext';

const PlaylistPage = ({ onTrackSelect }) => {
  const { id } = useParams(); // PlaylistID from URL
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5001/api/playlists/${id}`)
      .then(res => res.json())
      .then(data => {
        setPlaylist(data);
        setTracks(data.tracks || []);
      })
      .catch(err => console.error('Failed to load playlist', err));
  }, [id]);

  const handleRowClick = (track) => {
    if (onTrackSelect) {
      onTrackSelect(track, tracks); // ✅ Pass both track and the full playlist
    }
  };

  const handleAddToPlaylist = (track) => {
    setSelectedTrack(track);
    setShowModal(true);
  };

  const handleRemoveFromPlaylist = async (trackId) => {
    try {
      await fetch(`http://localhost:5001/api/playlists/${id}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTracks(prev => prev.filter(t => t.TrackID !== trackId));
    } catch (err) {
      console.error('Failed to remove track:', err);
    }
  };

  if (!playlist) return <p className="text-center mt-5">Loading playlist...</p>;

  return (
    <Container style={{ paddingTop: '80px' }}>
      <Card className="mb-4 p-4 shadow-sm">
        <h2>{playlist.Title}</h2>
        <p className="text-muted">{playlist.Description || 'No description available'}</p>
      </Card>

      <Table striped bordered hover className="playlist-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Track</th>
            <th>Artist</th>
            <th>Duration</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => (
            <tr
              key={track.TrackID}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{ cursor: 'pointer' }}
              onClick={() => handleRowClick(track)}
            >
              <td style={{ width: '40px' }}>
                {hoveredRow === index ? <FaPlay /> : index + 1}
              </td>
              <td className="d-flex align-items-center gap-2">
                <img
                  src={`http://localhost:5001/${track.CoverArt}`}
                  alt={track.Title}
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                />
                {track.Title}
              </td>
              <td>{track.Artist}</td>
              <td>{track.Duration || '3:30'}</td>
              <td onClick={(e) => e.stopPropagation()}>
                <Dropdown align="end">
                  <Dropdown.Toggle
                    as={React.forwardRef(({ onClick }, ref) => (
                      <span
                        ref={ref}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClick(e);
                        }}
                        className="text-muted"
                        style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                      >
                        <BsThreeDots />
                      </span>
                    ))}
                  />
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleRemoveFromPlaylist(track.TrackID)}>
                      Remove from Playlist
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleAddToPlaylist(track)}>
                      Add to Another Playlist
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigator.clipboard.writeText(window.location.href)}>
                      Share
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </td>

            </tr>
          ))}
        </tbody>
      </Table>

      {selectedTrack && (
        <AddToPlaylistModal
          show={showModal}
          onHide={() => setShowModal(false)}
          track={selectedTrack}
          userId={user?.id}
        />
      )}
    </Container>
  );
};

export default PlaylistPage;

// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { Container, Card, Table, Dropdown } from 'react-bootstrap';
// import { FaPlay, FaEllipsisH } from 'react-icons/fa';

// const PlaylistPage = ({ onTrackSelect }) => {
//   const { id } = useParams();
//   const [playlist, setPlaylist] = useState(null);
//   const [tracks, setTracks] = useState([]);
//   const [hoveredRow, setHoveredRow] = useState(null);

//   useEffect(() => {
//     fetch(`http://localhost:5001/api/playlists/${id}`)
//       .then(res => res.json())
//       .then(data => {
//         setPlaylist(data);
//         setTracks(data.tracks || []);
//       })
//       .catch(err => console.error('Failed to load playlist', err));
//   }, [id]);

//   const handleRowClick = (track) => {
//     if (onTrackSelect) {
//       onTrackSelect(track);
//     }
//   };

//   const handleRemove = async (trackId) => {
//     try {
//       const res = await fetch(`http://localhost:5001/api/playlists/${id}/tracks/${trackId}`, {
//         method: 'DELETE',
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       if (res.ok) {
//         setTracks(prev => prev.filter(t => t.TrackID !== trackId));
//       }
//     } catch (error) {
//       console.error('Failed to remove track:', error);
//     }
//   };

//   if (!playlist) return <p className="text-center mt-5">Loading playlist...</p>;

//   return (
//     <Container style={{ paddingTop: '80px' }}>
//       <Card className="mb-4 p-4 shadow-sm">
//         <h2>{playlist.Title}</h2>
//         <p className="text-muted">{playlist.Description || 'No description available'}</p>
//       </Card>

//       <Table striped bordered hover className="playlist-table">
//         <thead>
//           <tr>
//             <th>#</th>
//             <th>Track</th>
//             <th>Artist</th>
//             <th>Duration</th>
//             <th></th> {/* Column for actions */}
//           </tr>
//         </thead>
//         <tbody>
//           {tracks.map((track, index) => (
//             <tr
//               key={track.TrackID}
//               onMouseEnter={() => setHoveredRow(index)}
//               onMouseLeave={() => setHoveredRow(null)}
//               style={{ cursor: 'pointer' }}
//             >
//               <td>{hoveredRow === index ? <FaPlay /> : index + 1}</td>
//               <td className="d-flex align-items-center gap-2" onClick={() => handleRowClick(track)}>
//                 <img
//                   src={`http://localhost:5001/${track.CoverArt}`}
//                   alt={track.Title}
//                   style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
//                 />
//                 {track.Title}
//               </td>
//               <td onClick={() => handleRowClick(track)}>{track.Artist}</td>
//               <td onClick={() => handleRowClick(track)}>{track.Duration || '3:30'}</td>
//               <td>
//                 <Dropdown align="end">
//                   <Dropdown.Toggle variant="link" size="sm" className="text-muted">
//                     <FaEllipsisH />
//                   </Dropdown.Toggle>

//                   <Dropdown.Menu>
//                     <Dropdown.Item onClick={() => handleRemove(track.TrackID)}>Remove from Playlist</Dropdown.Item>
//                     <Dropdown.Item>Add to another Playlist</Dropdown.Item>
//                     <Dropdown.Item onClick={() => navigator.clipboard.writeText(window.location.href)}>Share</Dropdown.Item>
//                   </Dropdown.Menu>
//                 </Dropdown>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//     </Container>
//   );
// };

// export default PlaylistPage;



// import React from 'react';
// import { Container, Row, Col, Card } from 'react-bootstrap';
// import { useParams } from 'react-router-dom';

// const PlaylistPage = () => {
//   const { id } = useParams();

//   // Mock playlist data
//   const playlist = {
//     id: id,
//     title: 'My Awesome Playlist',
//     description: 'A collection of my favorite tracks',
//     tracks: [
//       { id: 1, title: 'Track 1', artist: 'Artist 1', duration: '3:45' },
//       { id: 2, title: 'Track 2', artist: 'Artist 2', duration: '4:20' },
//       { id: 3, title: 'Track 3', artist: 'Artist 3', duration: '3:15' },
//     ]
//   };

//   return (
//     <Container>
//       <Row className="mt-4">
//         <Col>
//           <h1>{playlist.title}</h1>
//           <p>{playlist.description}</p>
//         </Col>
//       </Row>
//       <Row>
//         <Col>
//           {playlist.tracks.map(track => (
//             <Card key={track.id} className="mb-2">
//               <Card.Body>
//                 <Card.Title>{track.title}</Card.Title>
//                 <Card.Text>
//                   {track.artist} - {track.duration}
//                 </Card.Text>
//               </Card.Body>
//             </Card>
//           ))}
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default PlaylistPage;
