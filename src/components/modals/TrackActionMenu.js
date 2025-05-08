import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaPlus, FaShare, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Custom toggle component to prevent the dropdown from closing on click
const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <span
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className="text-muted"
    style={{ cursor: 'pointer' }}
  >
    {children}
  </span>
));

const TrackActionMenu = ({ 
  track, 
  children, 
  onAddToPlaylist, 
  onDeleteTrack 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if current user is the owner of this track
  const isOwner = user && track && track.UserID === user.id;
  
  // Handle the action to edit a track
  const handleEditTrack = () => {
    if (!track || !track.TrackID) return;
    navigate(`/edit-track/${track.TrackID}`);
  };
  
  // Handle the action to share a track
  const handleShare = () => {
    const trackUrl = `${window.location.origin}/track/${track.TrackID}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackUrl)
        .then(() => {
          alert('Link copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          // Fallback to prompt
          prompt('Copy this link:', trackUrl);
        });
    } else {
      // Old-school fallback
      prompt('Copy this link:', trackUrl);
    }
  };

  return (
    <Dropdown>
      <Dropdown.Toggle as={CustomToggle} id={`track-dropdown-${track?.TrackID || 'unknown'}`}>
        {children}
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        {isOwner && (
          <Dropdown.Item onClick={handleEditTrack}>
            <FaEdit className="me-2" /> Edit Track
          </Dropdown.Item>
        )}
        
        <Dropdown.Item onClick={() => onAddToPlaylist && onAddToPlaylist(track)}>
          <FaPlus className="me-2" /> Add to Playlist
        </Dropdown.Item>
        
        <Dropdown.Item onClick={handleShare}>
          <FaShare className="me-2" /> Share
        </Dropdown.Item>
        
        {isOwner && (
          <>
            <Dropdown.Divider />
            <Dropdown.Item 
              onClick={() => onDeleteTrack && onDeleteTrack(track)}
              className="text-danger"
            >
              <FaTrash className="me-2" /> Delete
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default TrackActionMenu; 