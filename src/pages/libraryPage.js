import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaCompactDisc, FaList, FaPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import PlaylistCard from '../components/cards/PlaylistCard';
import TrackCard from '../components/cards/TrackCard';
import AlbumCard from '../components/cards/AlbumCard';
import ProfileImage from '../components/ui/ProfileImage';
import { API_ENDPOINTS, SERVER_URL } from '../config/apiConfig';

const LibraryPage = ({ 
  user: propUser, 
  userId: propUserId, 
  activeSection, 
  librarySection,
  section,
  handleSectionChange, 
  renderContent, 
  likedPlaylists: propLikedPlaylists = [], 
  handleUnlike,
  onTrackSelect 
}) => {
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [coverMap, setCoverMap] = useState({});
  const { user: contextUser } = useAuth(); // Get user from context
  const navigate = useNavigate();
  
  // Use either the prop or context values
  const user = propUser || contextUser;
  const userId = propUserId || (contextUser && contextUser.id);
  
  // Determine which section is active
  const currentSection = section || librarySection || activeSection || 'liked-tracks';
  
  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found. User may need to log in.');
        return;
      }
      
      // Using async/await with try/catch for better error handling
      const fetchPlaylists = async () => {
        try {
          const response = await fetch(`${SERVER_URL}/api/playlists/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log('Fetched playlists:', data);
          
          if (!Array.isArray(data)) {
            console.error('Expected an array but got:', data);
            return;
          }
          setSavedPlaylists(data);

          const covers = {};
          for (const playlist of data) {
            try {
              const res = await fetch(`${SERVER_URL}/api/playlists/${playlist.PlaylistID}/cover-art`);
              if (!res.ok) {
                console.warn(`Failed to fetch covers for playlist ${playlist.PlaylistID}`);
                continue;
              }
              const coverUrls = await res.json();
              covers[playlist.PlaylistID] = coverUrls.map(item => item.CoverArt);
            } catch (coverErr) {
              console.error(`Error fetching covers for playlist ${playlist.PlaylistID}:`, coverErr);
            }
          }
          setCoverMap(covers);
        } catch (err) {
          console.error('Failed to fetch playlists:', err);
        }
      };
      
      fetchPlaylists();
    } else {
      console.log('No userId available, skipping playlist fetch');
    }
  }, [userId]);

  // Get liked tracks from API
  const [likedTracks, setLikedTracks] = useState([]);
  const [likedAlbums, setLikedAlbums] = useState([]);
  const [likedPlaylists, setLikedPlaylists] = useState(propLikedPlaylists);
  const [isLoading, setIsLoading] = useState({
    tracks: false,
    playlists: false,
    albums: false,
    artists: false
  });

  // Fetch liked tracks
  useEffect(() => {
    if (!userId) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setIsLoading(prev => ({ ...prev, tracks: true }));
    
    const fetchLikedTracks = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/tracks/liked/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching liked tracks: ${response.status}`);
        }
        
        const data = await response.json();
        setLikedTracks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch liked tracks:', error);
        setLikedTracks([]);
      } finally {
        setIsLoading(prev => ({ ...prev, tracks: false }));
      }
    };
    
    fetchLikedTracks();
  }, [userId]);

  // Fetch liked albums
  useEffect(() => {
    if (!userId) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setIsLoading(prev => ({ ...prev, albums: true }));
    
    const fetchLikedAlbums = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/albums/liked/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching liked albums: ${response.status}`);
        }
        
        const data = await response.json();
        setLikedAlbums(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch liked albums:', error);
        setLikedAlbums([]);
      } finally {
        setIsLoading(prev => ({ ...prev, albums: false }));
      }
    };
    
    fetchLikedAlbums();
  }, [userId]);

  // Fetch liked playlists
  useEffect(() => {
    if (!userId) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setIsLoading(prev => ({ ...prev, playlists: true }));
    
    const fetchLikedPlaylists = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/api/playlists/liked/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching liked playlists: ${response.status}`);
        }
        
        const data = await response.json();
        setLikedPlaylists(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch liked playlists:', error);
        setLikedPlaylists([]);
      } finally {
        setIsLoading(prev => ({ ...prev, playlists: false }));
      }
    };
    
    fetchLikedPlaylists();
  }, [userId]);

  const followedArtists = [
    { id: 1, name: 'DJ Chill', genre: 'Lo-Fi', image: 'https://via.placeholder.com/150', followers: '820K' },
    { id: 2, name: 'BassBeats', genre: 'Electronic', image: 'https://via.placeholder.com/150', followers: '1.1M' }
  ];

  // Handle unlike action
  const handleUnlikeItem = async (itemId, itemType) => {
    if (!userId) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      let endpoint;
      switch (itemType) {
        case 'track':
          endpoint = `${SERVER_URL}/api/tracks/${itemId}/unlike`;
          break;
        case 'album':
          endpoint = `${SERVER_URL}/api/albums/${itemId}/unlike`;
          break;
        case 'playlist':
          endpoint = `${SERVER_URL}/api/playlists/${itemId}/unlike`;
          break;
        default:
          console.error('Unknown item type:', itemType);
          return;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to unlike ${itemType}: ${response.status}`);
      }
      
      // Remove item from the appropriate state list
      switch (itemType) {
        case 'track':
          setLikedTracks(prev => prev.filter(track => track.TrackID !== itemId));
          break;
        case 'album':
          setLikedAlbums(prev => prev.filter(album => album.AlbumID !== itemId));
          break;
        case 'playlist':
          setLikedPlaylists(prev => prev.filter(playlist => playlist.PlaylistID !== itemId));
          break;
      }
      
    } catch (error) {
      console.error(`Error unliking ${itemType}:`, error);
    }
  };

  // Update the login check
  if (!user && !userId) {
    return (
      <Container className="py-5 text-center">
        <h3>Please log in to view your library</h3>
        <p className="text-muted">You need to be logged in to access your library content.</p>
      </Container>
    );
  }

  // Show loading state while fetching playlists
  if (isLoading.tracks && savedPlaylists.length === 0) {
    return (
      <Container className="py-5">
        <h1 className="mb-4">My Library</h1>
        <p>Loading your content...</p>
      </Container>
    );
  }

  // Function to render content based on current section
  const renderSectionContent = () => {
    switch (currentSection) {
      case 'liked-tracks':
        return (
          <section className="mb-5">
            <h2 className="mb-4">Liked Tracks</h2>
            {isLoading.tracks ? (
              <p>Loading your liked tracks...</p>
            ) : likedTracks.length > 0 ? (
              <Row>
                {likedTracks.map(track => (
                  <Col md={3} key={track.TrackID || track.id} className="mb-4">
                    <TrackCard 
                      track={{
                        ...track,
                        UserID: track.UserID || track.userId,
                        Username: track.Username || track.username,
                        Title: track.Title || track.title,
                        Artist: track.Artist || track.artist || track.ArtistName,
                        CoverArt: track.CoverArt || track.coverArt
                      }} 
                      onTrackSelect={onTrackSelect}
                      isLiked={true}
                      onLikeClick={() => handleUnlikeItem(track.TrackID || track.id, 'track')}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <p>You haven't liked any tracks yet.</p>
            )}
          </section>
        );
      
      case 'liked-albums':
        return (
          <section className="mb-5">
            <h2 className="mb-4">Liked Albums</h2>
            <Row>
              {isLoading.albums ? (
                <p>Loading your liked albums...</p>
              ) : likedAlbums.length > 0 ? (
                likedAlbums.map((album) => (
                  <Col md={3} key={album.AlbumID} className="mb-4">
                    <AlbumCard 
                      album={{
                        ...album,
                        Title: album.Title || album.title,
                        Artist: album.Artist || album.artist || album.ArtistName,
                        UserID: album.UserID || album.userId,
                        Username: album.Username || album.username,
                        CoverArt: album.CoverArt || album.coverArt
                      }}
                      onPlayClick={() => navigate(`/albums/${album.AlbumID}?autoplay=true`)}
                      onLikeClick={() => handleUnlikeItem(album.AlbumID, 'album')}
                      isLiked={true}
                    />
                  </Col>
                ))
              ) : (
                <Col>
                  <p>You haven't liked any albums yet.</p>
                </Col>
              )}
            </Row>
          </section>
        );
      
      case 'liked-playlists':
        return (
          <section className="mb-5">
            <h2 className="mb-4">Liked Playlists</h2>
            <Row>
              {isLoading.playlists ? (
                <p>Loading your liked playlists...</p>
              ) : likedPlaylists.length > 0 ? (
                likedPlaylists.map((playlist) => (
                  <Col md={3} key={playlist.PlaylistID || playlist.id} className="mb-4">
                    <PlaylistCard 
                      playlist={{
                        ...playlist,
                        PlaylistID: playlist.PlaylistID || playlist.id,
                        Title: playlist.Title || playlist.title || playlist.Name,
                        UserID: playlist.UserID || playlist.userId || playlist.CreatorID,
                        Username: playlist.Username || playlist.username || playlist.CreatorName,
                        CoverURL: playlist.CoverURL || playlist.CoverArt || playlist.coverArt,
                        TrackCount: playlist.TrackCount || playlist.trackCount || 0
                      }}
                      onPlayClick={() => navigate(`/playlists/${playlist.PlaylistID || playlist.id}?autoplay=true`)}
                      onLikeClick={() => handleUnlikeItem(playlist.PlaylistID || playlist.id, 'playlist')}
                      isLiked={true}
                    />
                  </Col>
                ))
              ) : (
                <Col>
                  <p>You haven't liked any playlists yet.</p>
                </Col>
              )}
            </Row>
          </section>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">My Library</h1>

      {/* Navigation Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link
            active={currentSection === 'liked-tracks'}
            onClick={() => handleSectionChange ? handleSectionChange('liked-tracks') : null}
          >
            <FaMusic className="me-2" /> Liked Tracks
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={currentSection === 'liked-albums'}
            onClick={() => handleSectionChange ? handleSectionChange('liked-albums') : null}
          >
            <FaCompactDisc className="me-2" /> Liked Albums
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={currentSection === 'liked-playlists'}
            onClick={() => handleSectionChange ? handleSectionChange('liked-playlists') : null}
          >
            <FaList className="me-2" /> Liked Playlists
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Rendered Section from the renderContent prop */}
      {renderContent && renderContent()}

      {/* Rendered Section based on currentSection */}
      {renderSectionContent()}

      {/* Your Playlists Section */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Your Playlists</h2>
          <Button as={Link} to="/create-playlist" variant="success">
            <FaPlus className="me-1" /> Create New Playlist
          </Button>
        </div>
        <Row>
          {savedPlaylists.length > 0 ? (
            savedPlaylists.map((playlist) => (
              <Col md={3} key={playlist.PlaylistID} className="mb-4">
                <PlaylistCard 
                  playlist={{
                    ...playlist,
                    Title: playlist.Title || playlist.title || playlist.Name,
                    UserID: playlist.UserID || playlist.userId || playlist.CreatorID,
                    Username: playlist.Username || playlist.username || playlist.CreatorName, 
                    CoverURL: playlist.CoverURL || playlist.CoverArt || playlist.coverArt,
                    TrackCount: playlist.TrackCount || playlist.trackCount || 0
                  }}
                  onPlayClick={() => navigate(`/playlists/${playlist.PlaylistID}?autoplay=true`)}
                />
              </Col>
            ))
          ) : (
            <Col>
              <Card className="p-4 text-center border-dashed">
                <Card.Body>
                  <p>You haven't created any playlists yet.</p>
                  <Button as={Link} to="/create-playlist" variant="primary">Create a Playlist</Button>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      </section>

      {/* Only show the liked tracks and followed artists sections if we're on the overview page */}
      {currentSection === 'overview' && (
        <>
          {/* Liked Tracks Section */}
          <section className="mb-5">
            <h2 className="mb-4">Liked Tracks</h2>
            {isLoading.tracks ? (
              <p>Loading your liked tracks...</p>
            ) : likedTracks.length > 0 ? (
              <Row>
                {likedTracks.slice(0, 4).map(track => (
                  <Col md={3} key={track.TrackID || track.id} className="mb-4">
                    <TrackCard 
                      track={{
                        ...track,
                        UserID: track.UserID || track.userId,
                        Username: track.Username || track.username,
                        Title: track.Title || track.title,
                        Artist: track.Artist || track.artist || track.ArtistName,
                        CoverArt: track.CoverArt || track.coverArt
                      }}
                      onTrackSelect={onTrackSelect}
                      isLiked={true}
                      onLikeClick={() => handleUnlikeItem(track.TrackID || track.id, 'track')}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <p>You haven't liked any tracks yet.</p>
            )}
            <Button as={Link} to="/liked-tracks" variant="outline-primary" className="mt-3">
              View All Liked Songs
            </Button>
          </section>

          {/* Followed Artists Section */}
          <section className="mb-5">
            <h2 className="mb-4">Followed Artists</h2>
            <Row>
              {followedArtists.map((artist) => (
                <Col md={3} key={artist.id} className="mb-4 text-center">
                  <Card className="h-100 border-0">
                    <ProfileImage
                      src={artist.image}
                      alt={artist.name}
                      size={120}
                      clickable
                    />
                    <Card.Body className="p-3">
                      <h5>{artist.name}</h5>
                      <p className="text-muted small">{artist.genre}</p>
                      <p className="small">{artist.followers} followers</p>
                      <Button variant="outline-primary" size="sm" as={Link} to={`/profile/${artist.id}`}>
                        View Profile
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>
        </>
      )}
    </Container>
  );
};

export default LibraryPage;