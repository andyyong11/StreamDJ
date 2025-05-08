import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PlayButton.css';
import '../../styles/PlaylistCoverGrid.css';
import api from '../../services/api';

const PlaylistCard = ({ playlist, onPlayClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [coverArts, setCoverArts] = useState([]);

  // Fetch cover art images
  useEffect(() => {
    const fetchCoverArts = async () => {
      try {
        const res = await api.get(`/api/playlists/${playlist.PlaylistID}/cover-art`);
        if (res.data && res.data.length > 0) {
          setCoverArts(res.data.map(c => c.CoverArt));
        }
      } catch (err) {
        console.error('Error fetching cover art:', err);
      }
    };

    if (playlist?.PlaylistID) fetchCoverArts();
  }, [playlist]);

  // Check if the playlist is liked
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !playlist || !playlist.PlaylistID) return;
      try {
        const response = await api.get(
          `/api/playlists/${playlist.PlaylistID}/like-status`,
          { params: { userId: user.id } }
        );
        if (response?.data) {
          setIsLiked(response.data.liked);
        }
      } catch (error) {
        console.error('Error checking playlist like status:', error);
      }
    };
    checkLikeStatus();
  }, [playlist, user]);

  const handleLikeToggle = async (e) => {
    e.stopPropagation();
    if (!user || !playlist?.PlaylistID) return;
    setIsLikeLoading(true);
    try {
      const endpoint = isLiked ? 'unlike' : 'like';
      await api.post(`/api/playlists/${playlist.PlaylistID}/${endpoint}`, {
        userId: user.id,
      });
      setIsLiked(!isLiked);
    } catch (error) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} playlist:`, error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/playlist/${playlist.PlaylistID}`);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    onPlayClick ? onPlayClick(playlist) : navigate(`/playlist/${playlist.PlaylistID}?autoplay=true`);
  };

  const formatTrackCount = (count) => {
    if (!count && count !== 0) return '0';
    return count.toString();
  };

  const handleImageError = (e, type) => {
    e.target.src = `/images/default-${type}.jpg`;
  };

  return (
    <Card className="h-100 shadow-sm" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className="position-relative">
        {/* ✅ Display 2x2 grid if there are 4 covers */}
        {coverArts.length >= 4 ? (
          <div className="cover-grid playlist-cover-grid">
            {coverArts.slice(0, 4).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Track cover ${i + 1}`}
                className="cover-tile"
                onError={(e) => handleImageError(e, 'playlist')}
              />
            ))}
          </div>
        ) : (
          <img
            src={coverArts[0] || playlist.CoverURL || '/images/default-playlist.jpg'}
            alt={playlist.Title || 'Playlist'}
            className="cover-single"
            onError={(e) => handleImageError(e, 'playlist')}
          />
        )}

        <Button variant="success" className="play-button" onClick={handlePlayClick}>
          <FaPlay />
        </Button>

        {user && (
          <Button
            variant={isLiked ? 'danger' : 'outline-light'}
            className="position-absolute top-0 end-0 m-2"
            size="sm"
            onClick={handleLikeToggle}
            disabled={isLikeLoading}
          >
            <FaHeart />
          </Button>
        )}

        <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white d-flex align-items-center">
          <FaMusic className="me-1" />
          {formatTrackCount(playlist.TrackCount)} tracks
        </span>
      </div>

      <Card.Body>
        <Card.Title className="text-truncate">{playlist.Title || 'Untitled Playlist'}</Card.Title>
        <Card.Text className="text-muted small">
          By {playlist.CreatedBy || playlist.CreatorName || 'Unknown Creator'}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default PlaylistCard;

// import React, { useState, useEffect } from 'react';
// import { Card, Button } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';
// import { FaPlay, FaList, FaHeart, FaMusic } from 'react-icons/fa';
// import { useAuth } from '../../context/AuthContext';
// import '../../styles/PlayButton.css';
// import '../../styles/PlaylistCoverGrid.css';
// import api from '../../services/api';

// const PlaylistCard = ({ playlist, onPlayClick }) => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [isLiked, setIsLiked] = useState(false);
//   const [isLikeLoading, setIsLikeLoading] = useState(false);

//   // Check if the playlist is liked when component mounts
//   useEffect(() => {
//     const checkLikeStatus = async () => {
//       if (!user || !playlist || !playlist.PlaylistID) return;
      
//       try {
//         // Use the API service instead of direct fetch for better error handling
//         const response = await api.get(
//           `/api/playlists/${playlist.PlaylistID}/like-status`, 
//           { params: { userId: user.id } }
//         );
        
//         if (response && response.data) {
//           setIsLiked(response.data.liked);
//         }
//       } catch (error) {
//         console.error('Error checking playlist like status:', error);
//       }
//     };
    
//     checkLikeStatus();
//   }, [playlist, user]);

//   const handleLikeToggle = async (e) => {
//     e.stopPropagation(); // Prevent card click
    
//     if (!user || !playlist || !playlist.PlaylistID) return;
    
//     setIsLikeLoading(true);
//     try {
//       const endpoint = isLiked ? 'unlike' : 'like';
      
//       // Use the API service instead of direct fetch
//       const response = await api.post(
//         `/api/playlists/${playlist.PlaylistID}/${endpoint}`,
//         { userId: user.id }
//       );
      
//       if (response) {
//         setIsLiked(!isLiked);
//       }
//     } catch (error) {
//       console.error(`Error ${isLiked ? 'unliking' : 'liking'} playlist:`, error);
//     } finally {
//       setIsLikeLoading(false);
//     }
//   };

//   const handleCardClick = () => {
//     navigate(`/playlist/${playlist.PlaylistID}`);
//   };

//   const handlePlayClick = (e) => {
//     e.stopPropagation(); // Prevent card click event
//     if (onPlayClick) {
//       onPlayClick(playlist);
//     } else {
//       navigate(`/playlist/${playlist.PlaylistID}?autoplay=true`);
//     }
//   };

//   // Format track count
//   const formatTrackCount = (count) => {
//     if (!count && count !== 0) return '0';
//     return count.toString();
//   };

//   // Default image handling functions
//   const formatImageUrl = (url, type) => {
//     if (!url) return `/images/default-${type}.jpg`;
//     return url;
//   };

//   const handleImageError = (e, type) => {
//     e.target.src = `/images/default-${type}.jpg`;
//   };

//   return (
//     <Card 
//       className="h-100 shadow-sm"
//       onClick={handleCardClick}
//       style={{ cursor: 'pointer' }}
//     >
//       <div className="position-relative">
//         <Card.Img 
//           variant="top" 
//           src={formatImageUrl(playlist.CoverURL, 'playlist')}
//           alt={playlist.Title || 'Playlist'}
//           style={{ height: '180px', objectFit: 'cover' }}
//           onError={(e) => handleImageError(e, 'playlist')}
//         />
//         <Button 
//           variant="success"
//           className="play-button"
//           onClick={handlePlayClick}
//         >
//           <FaPlay />
//         </Button>
//         {user && (
//           <Button
//             variant={isLiked ? "danger" : "outline-light"}
//             className="position-absolute top-0 end-0 m-2"
//             size="sm"
//             onClick={handleLikeToggle}
//             disabled={isLikeLoading}
//           >
//             <FaHeart />
//           </Button>
//         )}
//         <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark text-white d-flex align-items-center">
//           <FaMusic className="me-1" />
//           {formatTrackCount(playlist.TrackCount)} tracks
//         </span>
//       </div>
//       <Card.Body>
//         <Card.Title className="text-truncate">{playlist.Title || 'Untitled Playlist'}</Card.Title>
//         <Card.Text className="text-muted small">
//           By {playlist.CreatedBy || playlist.CreatorName || 'Unknown Creator'}
//         </Card.Text>
//       </Card.Body>
//     </Card>
//   );
// };

// export default PlaylistCard; 