import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PlayButton.css';
import '../../styles/PlaylistCoverGrid.css';
import '../../styles/custom.css';
import api from '../../services/api';

const PlaylistCard = ({ playlist, onPlayClick, onDeleteClick, showDelete = false }) => {
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
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent card click
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

  // Handle play button click
  const handlePlayClick = (e) => {
    e.stopPropagation();
    onPlayClick ? onPlayClick(playlist) : navigate(`/playlist/${playlist.PlaylistID}?autoplay=true`);
  };

  // Handle delete button click
  const handleDeleteClick = (e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent card navigation
    
    if (onDeleteClick && playlist?.PlaylistID) {
      onDeleteClick(playlist.PlaylistID);
    }
  };

  const formatTrackCount = (count) => {
    // Debug what we're actually getting
    console.log(`FormatTrackCount for ${playlist.Title} received:`, {
      count,
      type: typeof count,
      asNumber: Number(count),
      trackCount: playlist.TrackCount,
      trackCountType: typeof playlist.TrackCount,
      playlistObj: playlist
    });
    
    // Handle string values that might be numbers
    if (typeof count === 'string') {
      const parsed = parseInt(count, 10);
      if (!isNaN(parsed)) {
        return parsed.toString();
      }
    }
    
    // Handle numeric values
    if (typeof count === 'number') {
      return count.toString();
    }
    
    // If we have null, undefined, or any other non-numeric value
    return '0';
  };

  // Format image URL with proper default handling
  const formatImageUrl = (url, type) => {
    if (!url) {
      return `/images/Default ${type.charAt(0).toUpperCase() + type.slice(1)}.png`;
    }
    return url;
  };

  const handleImageError = (e, type) => {
    // Update to use the correct filename format with proper capitalization
    e.target.src = `/images/Default ${type.charAt(0).toUpperCase() + type.slice(1)}.png`;
  };

  return (
    <Card className="h-100 border cursor-pointer" onClick={handleCardClick}>
      <div className="card-img-container">
        {/* Display 2x2 grid if there are 4 covers */}
        {coverArts.length >= 4 ? (
          <div className="cover-grid playlist-cover-grid">
            {coverArts.slice(0, 4).map((src, i) => (
              <img
                key={i}
                src={formatImageUrl(src, 'playlist')}
                alt={`Track cover ${i + 1}`}
                className="cover-tile"
                onError={(e) => handleImageError(e, 'playlist')}
              />
            ))}
          </div>
        ) : (
          <img
            src={formatImageUrl(coverArts[0] || playlist.CoverURL, 'playlist')}
            alt={playlist.Title || 'Playlist'}
            className="cover-image"
            onError={(e) => handleImageError(e, 'playlist')}
          />
        )}

        <Button
          variant="success"
          className="play-button-circle"
          onClick={handlePlayClick}
          aria-label="Play playlist"
        >
          <FaPlay size={18} />
        </Button>

        {user && (
          <Button
            variant={isLiked ? "danger" : "light"}
            className={`like-button-circle ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeToggle}
            disabled={isLikeLoading}
            aria-label={isLiked ? "Unlike playlist" : "Like playlist"}
          >
            <FaHeart size={16} />
          </Button>
        )}
        
        {showDelete && onDeleteClick && (
          <Button
            variant="danger"
            className="delete-button-circle"
            onClick={handleDeleteClick}
            aria-label="Delete playlist"
          >
            <FaTrash size={16} />
          </Button>
        )}
      </div>

      <Card.Body className="p-3">
        <Card.Title className="mb-1 text-truncate fs-6 fw-bold">{playlist.Title || 'Untitled Playlist'}</Card.Title>
        <div className="text-muted small">
          By {playlist.CreatedBy || playlist.CreatorName || 'Unknown Creator'}
          
          <div className="d-flex justify-content-between align-items-center mt-1">
            <span className="small text-muted">
              <FaMusic className="me-1" style={{ fontSize: '0.7rem' }} /> 
              {formatTrackCount(playlist.TrackCount)} tracks
            </span>
          </div>
        </div>
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