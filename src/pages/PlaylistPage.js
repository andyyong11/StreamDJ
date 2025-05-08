import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Table, Dropdown, Alert, Spinner, Button, Modal, Row, Col } from 'react-bootstrap';
import { FaPlay, FaArrowLeft, FaTrash, FaPen } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import AddToPlaylistModal from '../components/player/AddToPlaylistModal'; // adjust the path as needed
import { useAuth } from '../context/AuthContext';

const PlaylistPage = ({ onTrackSelect, playTrack }) => {
  const { id } = useParams(); // PlaylistID from URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverResponse, setServerResponse] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    console.log(`Loading playlist with ID: ${id}`);
    setLoading(true);
    setError(null);
    
    // Retry mechanism with exponential backoff
    const fetchWithRetry = async (retryCount = 0, delay = 1000) => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await fetch(`http://localhost:5001/api/playlists/${id}`, { headers });
        console.log(`Playlist API response status: ${response.status}`);
        
        // Save the raw response text for debugging
        const responseText = await response.text();
        console.log("Raw API response:", responseText);
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          setServerResponse(data);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
        
        if (response.status === 404) {
          throw new Error('Playlist not found. It may have been deleted or never existed.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this playlist.');
        } else if (response.status === 500) {
          // On server error, we might want to retry
          if (retryCount < 2) { // Retry up to 2 times
            console.log(`Server error, retrying in ${delay}ms... (Attempt ${retryCount + 1})`);
            setTimeout(() => fetchWithRetry(retryCount + 1, delay * 2), delay);
            return;
          }
          throw new Error(
            'Server error occurred. The playlist might be corrupted or the server is experiencing issues. ' +
            'This may be due to a database issue with this specific playlist.'
          );
        } else if (!response.ok) {
          throw new Error(`Failed to load playlist: ${response.status}`);
        }
        
        console.log('Playlist data received:', data);
        // Log track count information for debugging
        console.log('Playlist track count:', {
          tracksArray: (data.Tracks || data.tracks || []).length,
          TrackCount: data.TrackCount,
          Quantity: data.Quantity,
          trackCount: data.trackCount,
          tracks: data.tracks?.length
        });
        setPlaylist(data);
        
        // Handle different property naming (Tracks vs tracks)
        const playlistTracks = data.Tracks || data.tracks || [];
        console.log('Setting tracks:', playlistTracks);
        setTracks(playlistTracks);
      } catch (err) {
        console.error('Failed to load playlist', err);
        setError(err.message || 'An error occurred while loading the playlist');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWithRetry();
  }, [id]);

  const handleRowClick = (track) => {
    console.log('Track clicked:', track);
    if (playTrack) {
      playTrack(track, tracks);
    } else if (onTrackSelect) {
      onTrackSelect(track, tracks);
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

  const handleDeletePlaylist = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`http://localhost:5001/api/playlists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }
      
      setDeleteLoading(false);
      setShowDeleteModal(false);
      navigate('/playlists');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert(`Failed to delete playlist: ${err.message}`);
      setDeleteLoading(false);
    }
  };

  const handlePlayAllTracks = () => {
    // Implementation of handlePlayAllTracks
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading playlist...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <p className="mt-3">
            <strong>Technical details:</strong> Unable to load playlist with ID: {id}. 
            This could be because the playlist data in the database is corrupted or incomplete.
          </p>
          
          {serverResponse && (
            <div className="mt-3">
              <p><strong>Server response:</strong></p>
              <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(serverResponse, null, 2)}
              </pre>
            </div>
          )}
          
          <hr />
          <div className="d-flex justify-content-between">
            <Button 
              variant="outline-danger" 
              onClick={() => navigate('/library')}
            >
              <FaArrowLeft className="me-1" /> Return to Library
            </Button>
            <Button 
              variant="outline-info" 
              onClick={async () => {
                try {
                  // Try direct database check if available
                  const token = localStorage.getItem('token');
                  const headers = token ? { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  } : {};
                  
                  // Try a more basic endpoint to see if API is working at all
                  const response = await fetch(`http://localhost:5001/api/playlists`, { headers });
                  console.log('All playlists response:', response.status);
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log(`Found ${data.length} playlists in total`);
                    const foundPlaylist = data.find(p => p.PlaylistID == id || p.id == id);
                    if (foundPlaylist) {
                      console.log('Playlist found in list:', foundPlaylist);
                      alert(`Playlist exists but can't be loaded directly. See console for details.`);
                    } else {
                      console.log(`Playlist ${id} not found in list`);
                      alert(`Playlist ${id} not found in the playlists list. It might have been deleted.`);
                    }
                  } else {
                    alert('Could not check playlists list. API might be down.');
                  }
                } catch (err) {
                  console.error('Diagnostic failed:', err);
                  alert('Diagnostic failed. See console for details.');
                }
              }}
            >
              Check Playlist Existence
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!playlist) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Playlist not found or failed to load.</Alert>
      </Container>
    );
  }

  const hasTracks = tracks && tracks.length > 0;
  const isOwner = user && playlist && user.id === playlist.UserID;

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="me-2" /> Back
      </Button>
      
      <Row className="mb-4">
        <Col md={4}>
          <div className="mb-3">
            {playlist?.CoverImageURL && (
              <Card>
                <Card.Img 
                  src={playlist.CoverImageURL.startsWith('http') 
                    ? playlist.CoverImageURL 
                    : `http://localhost:5001/${playlist.CoverImageURL.replace(/^\/+/, '')}`}
                  alt={playlist.Title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/300x300';
                  }}
                />
              </Card>
            )}
          </div>
        </Col>
        
        <Col md={8}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title className="display-5">{playlist.Title}</Card.Title>
              
              <Card.Text className="text-muted">
                Created by: {playlist.CreatorName}
                {playlist.CreatedAt && (
                  <span> • Created: {new Date(playlist.CreatedAt).toLocaleDateString()}</span>
                )}
              </Card.Text>
              
              {playlist.Description && (
                <Card.Text>{playlist.Description}</Card.Text>
              )}
              
              <div className="d-flex align-items-center mt-3">
                <Button 
                  variant="success" 
                  onClick={handlePlayAllTracks}
                  disabled={tracks.length === 0}
                  className="me-2"
                >
                  <FaPlay className="me-2" /> Play All
                </Button>
                
                {isOwner && (
                  <Button 
                    variant="outline-primary" 
                    className="me-2"
                    onClick={() => setShowEditModal(true)}
                  >
                    <FaPen className="me-1" /> Edit
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {hasTracks ? (
        <>
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
                  key={track.TrackID || track.id || index}
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
                      src={track.CoverArt ? `http://localhost:5001/${track.CoverArt}` : 'https://placehold.co/100x100?text=No+Cover'}
                      alt={track.Title}
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100?text=No+Cover';
                      }}
                    />
                    {track.Title}
                  </td>
                  <td>{track.Artist || track.ArtistName || 'Unknown Artist'}</td>
                  <td>{track.Duration || '0:00'}</td>
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
                        <Dropdown.Item onClick={() => handleRemoveFromPlaylist(track.TrackID || track.id)}>
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
          <div className="d-flex justify-content-end mt-3">
            <Button 
              variant="primary" 
              onClick={() => navigate(`/browse?addToPlaylist=${id}`)}
            >
              Add More Tracks
            </Button>
          </div>
        </>
      ) : (
        <Alert variant="info">
          <p>This playlist doesn't have any tracks yet. Add some music to get started!</p>
          <Button 
            variant="primary" 
            onClick={() => navigate(`/browse?addToPlaylist=${id}`)}
            className="mt-2"
          >
            Browse Tracks to Add
          </Button>
        </Alert>
      )}

      {selectedTrack && (
        <AddToPlaylistModal
          show={showModal}
          onHide={() => setShowModal(false)}
          track={selectedTrack}
          userId={user?.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Playlist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this playlist?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeletePlaylist}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Playlist'}
          </Button>
        </Modal.Footer>
      </Modal>
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
