import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, ListGroup, Image } from 'react-bootstrap';

const AddToPlaylistModal = ({ show, onHide, track, userId }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [search, setSearch] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:5001/api/playlists/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => setPlaylists(data))
        .catch(err => console.error('Failed to fetch playlists:', err));
    }
  }, [userId]);

  useEffect(() => {
    if (!show) {
      setShowNewInput(false);
      setNewPlaylistName('');
      setSearch('');
      setSelectedPlaylist(null);
      setErrorMessage('');
    }
  }, [show]);

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    const res = await fetch('http://localhost:5001/api/playlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        title: newPlaylistName,
        isPublic: true
      })
    });

    const data = await res.json();
    setPlaylists([...playlists, data]);
    setNewPlaylistName('');
    setShowNewInput(false);
  };

  const addToPlaylist = async () => {
    if (!selectedPlaylist || !track) return;

    try {
      const response = await fetch(`http://localhost:5001/api/playlists/${selectedPlaylist}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ trackId: track.TrackID })
      });

      if (!response.ok) {
        const data = await response.json();
        if (data?.error?.toLowerCase().includes('duplicate')) {
          setErrorMessage('This track is already in the playlist.');
        } else {
          setErrorMessage('Failed to add track to the playlist.');
        }
        return;
      }

      setErrorMessage('');
      onHide(); // Success: close modal
    } catch (err) {
      console.error('Add track failed:', err);
      setErrorMessage('Something went wrong.');
    }
  };

  const filtered = playlists.filter(p =>
    p.Title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add to playlist</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          placeholder="Find a playlist"
          className="mb-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          variant="outline-secondary"
          className="mb-3 w-100"
          onClick={() => setShowNewInput(true)}
        >
          + New playlist
        </Button>

        {showNewInput && (
          <Form.Control
            placeholder="New playlist name"
            className="mb-3"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createPlaylist();
              }
            }}
          />
        )}

        <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filtered.map((pl) => (
            <ListGroup.Item
              key={pl.PlaylistID}
              action
              active={selectedPlaylist === pl.PlaylistID}
              onClick={() => setSelectedPlaylist(pl.PlaylistID)}
              className="d-flex align-items-center"
            >
              {pl.CoverURL ? (
                <Image
                  src={`http://localhost:5001/${pl.CoverURL}`}
                  rounded
                  width={40}
                  height={40}
                  className="me-2"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="me-2 bg-secondary rounded"
                  style={{ width: 40, height: 40 }}
                ></div>
              )}
              {pl.Title}
            </ListGroup.Item>
          ))}
        </ListGroup>

        {errorMessage && (
          <div className="text-danger mt-3 text-center fw-semibold">
            {errorMessage}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="success" onClick={addToPlaylist}>Done</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddToPlaylistModal;


// import React, { useEffect, useState } from 'react';
// import { Modal, Button, Form, ListGroup } from 'react-bootstrap';

// const AddToPlaylistModal = ({ show, onHide, track, userId }) => {
//   const [playlists, setPlaylists] = useState([]);
//   const [selectedPlaylist, setSelectedPlaylist] = useState(null);
//   const [newPlaylistName, setNewPlaylistName] = useState('');
//   const [search, setSearch] = useState('');
//   const [showNewInput, setShowNewInput] = useState(false);

//   useEffect(() => {
//     if (userId) {
//       fetch(`http://localhost:5001/api/playlists/user/${userId}`)
//         .then(res => res.json())
//         .then(data => {
//           console.log('Fetched playlists:', data); // DEBUG line
//           if (Array.isArray(data)) {
//             setPlaylists(data);
//           } else if (Array.isArray(data.playlists)) {
//             setPlaylists(data.playlists); // support if your backend wraps it
//           } else {
//             setPlaylists([]); // fallback
//             console.error('Unexpected playlists format:', data);
//           }
//         })
//         .catch(err => {
//           console.error('Failed to fetch playlists:', err);
//           setPlaylists([]);
//         });
//     }
//   }, [userId]);  

//   // 👇 Reset modal state when it's closed
// useEffect(() => {
//     if (!show) {
//       setShowNewInput(false);
//       setNewPlaylistName('');
//       setSearch('');
//       setSelectedPlaylist(null);
//     }
//   }, [show]);

//   const createPlaylist = async () => {
//     if (!newPlaylistName.trim()) return;
//     const res = await fetch('http://localhost:5001/api/playlists', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ name: newPlaylistName, userId })
//     });
//     const data = await res.json();
//     setPlaylists([...playlists, data]);
//     setNewPlaylistName('');
//   };

//   const addToPlaylist = async () => {
//     if (!selectedPlaylist || !track) return;
//     await fetch(`http://localhost:5001/api/playlists/${selectedPlaylist}/add-track`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ trackId: track.TrackID })
//     });
//     onHide(); // Close modal
//   };

//   const filtered = playlists.filter(p =>
//     p.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <Modal show={show} onHide={onHide} centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Add to playlist</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form.Control
//           placeholder="Find a playlist"
//           className="mb-2"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//         <Button
//         variant="outline-secondary"
//         className="mb-3 w-100"
//         onClick={() => setShowNewInput(true)}
//         >
//         + New playlist
//         </Button>
        
//         {showNewInput && (
//         <Form.Control
//         placeholder="New playlist name"
//         className="mb-3"
//         value={newPlaylistName}
//         onChange={(e) => setNewPlaylistName(e.target.value)}
//         onKeyDown={(e) => {
//             if (e.key === 'Enter') {
//             e.preventDefault();
//             createPlaylist();
//             }
//         }}
//         />
//     )}
//     <ListGroup>
//         {filtered.map((pl) => (
//         <ListGroup.Item
//             key={pl.id}
//             action
//             active={selectedPlaylist === pl.id}
//             onClick={() => setSelectedPlaylist(pl.id)}
//         >
//             {pl.name}
//         </ListGroup.Item>
//         ))}
//   </ListGroup>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>Cancel</Button>
//         <Button variant="success" onClick={addToPlaylist}>Done</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default AddToPlaylistModal;