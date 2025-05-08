import React from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { FaEdit, FaShare, FaTrash, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/PlayButton.css';

// Custom toggle that prevents the dropdown from automatically closing when clicked
const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <Button
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    variant="outline-secondary"
    className="menu-button"
  >
    {children}
  </Button>
));

const TrackActionMenu = ({ track, onDeleteTrack, onAddToPlaylist, children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user && track.UserID === user.id;

  const handleEditTrack = () => {
    navigate(`/edit-track/${track.TrackID}`);
  };

  const handleShare = () => {
    // Create a URL to the track
    const trackUrl = `${window.location.origin}/tracks/${track.TrackID}`;
    
    // Use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: track.Title,
        text: `Check out "${track.Title}" by ${track.Artist || track.Username}`,
        url: trackUrl,
      })
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(trackUrl)
        .then(() => {
          alert('Link copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
        });
    }
  };

  return (
    <Dropdown>
      <Dropdown.Toggle as={CustomToggle} id={`track-dropdown-${track.TrackID}`}>
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