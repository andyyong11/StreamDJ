import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { FaHeart, FaMusic, FaUserFriends, FaPlay, FaEllipsisH, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: authUser, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        // Fetch user profile data
        try {
          const profileResponse = await fetch(`http://localhost:5001/api/users/${id}`, { headers });
          if (!profileResponse.ok) {
            if (profileResponse.status === 404) {
              throw new Error('User not found');
            }
            throw new Error('Failed to fetch profile data');
          }
          const profileData = await profileResponse.json();
          setProfileData(profileData);
        } catch (err) {
          console.error('Error fetching profile data:', err);
          setError(err.message);
          setProfileData(null);
          return; // Stop further requests if user data can't be fetched
        }

        // Fetch user's playlists
        try {
          const playlistsResponse = await fetch(`http://localhost:5001/api/users/${id}/playlists`, { headers });
          if (playlistsResponse.ok) {
            const playlistsData = await playlistsResponse.json();
            setPlaylists(playlistsData);
          } else {
            console.error('Failed to fetch playlists:', playlistsResponse.status);
            setPlaylists([]);
          }
        } catch (err) {
          console.error('Error fetching playlists:', err);
          setPlaylists([]);
        }

        // Fetch user's recent tracks
        try {
          const tracksResponse = await fetch(`http://localhost:5001/api/users/${id}/recent-tracks`, { headers });
          if (tracksResponse.ok) {
            const tracksData = await tracksResponse.json();
            setRecentTracks(tracksData);
          } else {
            console.error('Failed to fetch recent tracks:', tracksResponse.status);
            setRecentTracks([]);
          }
        } catch (err) {
          console.error('Error fetching recent tracks:', err);
          setRecentTracks([]);
        }

      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, token]);

  if (loading) {
    return (
      <Container>
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="alert alert-danger my-5" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container>
        <div className="alert alert-warning my-5" role="alert">
          User not found
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Profile Banner */}
      <Card className="mb-4">
        <Card.Img 
          src={profileData.BannerImage || "https://crlsolutions.com/wp-content/uploads/2018/01/temp-banner.png"} 
          alt="Profile Banner" 
          className="rounded" 
        />
        <Card.ImgOverlay className="d-flex flex-column justify-content-end">
          <Row className="align-items-center">
            <Col md={3} className="text-center">
              <img
                src={profileData.Avatar || "https://via.placeholder.com/150"}
                alt={profileData.Username}
                className="rounded-circle border border-white"
                style={{ width: '120px', height: '120px' }}
              />
            </Col>
            <Col md={6}>
              <h2 className="text-white">{profileData.Username}</h2>
              <p className="text-light">{profileData.Bio || 'No bio available'}</p>
              <Badge bg="primary" className="me-2">
                <FaUserFriends /> {profileData.FollowerCount || 0} Followers
              </Badge>
              <Badge bg="secondary">
                <FaMusic /> {profileData.FollowingCount || 0} Following
              </Badge>
            </Col>
            <Col md={3} className="text-end">
              {authUser && authUser.id === parseInt(id) ? (
                <Button variant="danger" onClick={handleLogout} className="mb-2 d-block ms-auto">
                  <FaSignOutAlt /> Logout
                </Button>
              ) : (
                <Button variant="danger" className="me-2">
                  <FaHeart /> Follow
                </Button>
              )}
              <Button variant="light">
                <FaEllipsisH />
              </Button>
            </Col>
          </Row>
        </Card.ImgOverlay>
      </Card>

      {/* User's Playlists */}
      <section className="mb-5">
        <h3 className="mb-4">{profileData.Username}'s Playlists</h3>
        {playlists.length > 0 ? (
          <Row>
            {playlists.map(playlist => (
              <Col md={4} key={playlist.PlaylistID} className="mb-4">
                <Card className="shadow-sm">
                  <Card.Img variant="top" src="https://via.placeholder.com/300" />
                  <Card.Body>
                    <Card.Title>{playlist.Title}</Card.Title>
                    <Card.Text>{playlist.Quantity || 0} tracks</Card.Text>
                    <Button variant="success" size="sm">
                      <FaPlay className="me-1" /> Play
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <p className="text-muted">No playlists available</p>
        )}
      </section>

      {/* Recently Played Tracks */}
      <section className="mb-5">
        <h3 className="mb-4">Recently Played by {profileData.Username}</h3>
        {recentTracks.length > 0 ? (
          <Card>
            <Card.Body>
              <table className="table">
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
                    <tr key={track.TrackID}>
                      <td>{index + 1}</td>
                      <td>{track.Title}</td>
                      <td>{formatDuration(track.Duration)}</td>
                      <td>{track.PlayCount?.toLocaleString() || 0}</td>
                      <td>
                        <Button variant="link" className="p-0">
                          <FaEllipsisH />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Body>
          </Card>
        ) : (
          <p className="text-muted">No recently played tracks</p>
        )}
      </section>
    </Container>
  );
};

export default ProfilePage;
