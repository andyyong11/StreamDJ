import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaHeadphones, FaMicrophone, FaEllipsisH } from 'react-icons/fa';
import Slider from 'react-slick';
import TrendingSection from '../components/sections/TrendingSection';
import RecommendedSection from '../components/sections/RecommendedSection';
import AlbumsSection from '../components/sections/AlbumsSection';
import PlaylistCard from '../components/cards/PlaylistCard';
import LiveStreamCard from '../components/cards/LiveStreamCard';
import TrackCard from '../components/cards/TrackCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/PlayButton.css';

const HomePage = ({ playTrack }) => {
  const { user } = useAuth();
  // Trending
  const [trending, setTrending] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/trending');
        const data = await res.json();
        setTrending(data);
      } catch (err) {
        console.error('Failed to fetch trending tracks:', err);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchTrending();
  }, []);

  // Mock data for featured content
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  
  // mock data for personalized playlists
  const [personalizedPlaylists, setPersonalizedPlaylists] = useState([]);
  console.log('Personalized Playlists:', personalizedPlaylists);
  const [loadingPersonalized, setLoadingPersonalized] = useState(true);

  useEffect(() => {
    const fetchFeaturedPlaylists = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/playlists/featured');
        const data = await res.json();
        // ✅ Ensure it's an array before setting it
        setFeaturedPlaylists(Array.isArray(data) ? data : []);
        console.log('Look at me');
        console.log(data);
      } catch (err) {
        console.error('Failed to fetch featured playlists:', err);
        setFeaturedPlaylists([]); // fallback to empty
      } finally {
        setLoadingFeatured(false);
      }
    };
  
    fetchFeaturedPlaylists();
  }, []);

// Personalized featured playlists (based on user behavior)
useEffect(() => {
  const fetchPersonalized = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5001/api/playlists/featured/personalized/${user.id}`);
      const data = await res.json();
      setPersonalizedPlaylists(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch personalized playlists:', err);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  fetchPersonalized();
}, [user]);


  const [liveStreams, setLiveStreams] = useState([]);
  const [loadingStreams, setLoadingStreams] = useState(true);

  // State for top artists and popular tracks
  const [topArtists, setTopArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  
  const [popularTracks, setPopularTracks] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // Fetch live streams
  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setLoadingStreams(true);
        const response = await api.get('/api/streams/active');
        if (response?.data) {
          setLiveStreams(response.data.slice(0, 3)); // Get first 3 live streams
        }
      } catch (error) {
        console.error('Error fetching live streams:', error);
        // Fallback data
        setLiveStreams([
          { LiveStreamID: 1, Title: 'Friday Night Party', Username: 'DJ Sparkle', ListenerCount: 1243 },
          { LiveStreamID: 2, Title: 'Ambient Sounds', Username: 'ChillWave', ListenerCount: 856 },
          { LiveStreamID: 3, Title: 'Hip Hop Mix', Username: 'BeatMaster', ListenerCount: 2105 }
        ]);
      } finally {
        setLoadingStreams(false);
      }
    };

    fetchLiveStreams();
  }, []);

  // Fetch recent listens if user is logged in
  useEffect(() => {
    const fetchRecentListens = async () => {
      if (!user) {
        setLoadingRecent(false);
        return;
      }
      
      try {
        setLoadingRecent(true);
        // This endpoint should be created in the backend to fetch tracks the current user has listened to recently
        // It's different from /api/tracks/by-user/${id} which gets tracks created by a user
        const response = await api.get(`/api/users/${user.id}/recent-listens`);
        if (response?.data) {
          setRecentListens(response.data.slice(0, 4)); // Get first 4 recent tracks
        }
      } catch (error) {
        console.error('Error fetching recent listens:', error);
        setRecentListens([]);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecentListens();
  }, [user]);

  // Fetch top artists
  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        setLoadingArtists(true);
        const response = await api.get('/api/users/top');
        if (response?.data) {
          setTopArtists(response.data.slice(0, 5)); // Get top 5 artists
        }
      } catch (error) {
        console.error('Error fetching top artists:', error);
        // Fallback data
        setTopArtists([
          { UserID: 1, Username: 'ElectroQueen', Genre: 'Electronic', ProfileImage: 'https://via.placeholder.com/150', FollowerCount: 1200000 },
          { UserID: 2, Username: 'BeatMaster', Genre: 'Hip Hop', ProfileImage: 'https://via.placeholder.com/150', FollowerCount: 980000 },
          { UserID: 3, Username: 'RockLegend', Genre: 'Rock', ProfileImage: 'https://via.placeholder.com/150', FollowerCount: 1500000 },
          { UserID: 4, Username: 'JazzMaster', Genre: 'Jazz', ProfileImage: 'https://via.placeholder.com/150', FollowerCount: 750000 },
          { UserID: 5, Username: 'PopStar', Genre: 'Pop', ProfileImage: 'https://via.placeholder.com/150', FollowerCount: 2300000 }
        ]);
      } finally {
        setLoadingArtists(false);
      }
    };

    fetchTopArtists();
  }, []);

  // Fetch popular tracks
  useEffect(() => {
    const fetchPopularTracks = async () => {
      try {
        setLoadingPopular(true);
        const response = await api.get('/api/tracks/popular');
        if (response?.data) {
          setPopularTracks(response.data.slice(0, 10)); // Get top 10 tracks
        }
      } catch (error) {
        console.error('Error fetching popular tracks:', error);
        // Fallback data
        setPopularTracks([
          { TrackID: 1, Title: 'Summer Groove', Artist: 'BeachDJ', Duration: 225, PlayCount: 1250000 },
          { TrackID: 2, Title: 'Midnight City', Artist: 'Urban Beats', Duration: 252, PlayCount: 980000 },
          { TrackID: 3, Title: 'Chill Wave', Artist: 'Ambient Master', Duration: 330, PlayCount: 750000 },
          { TrackID: 4, Title: 'Dance Floor', Artist: 'Party Mix', Duration: 202, PlayCount: 2100000 },
          { TrackID: 5, Title: 'Deep House', Artist: 'Club Masters', Duration: 375, PlayCount: 1800000 }
        ]);
      } finally {
        setLoadingPopular(false);
      }
    };

    fetchPopularTracks();
  }, []);

  // Format artist followers count
  const formatFollowers = (count) => {
    if (!count && count !== 0) return '';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K followers`;
    }
    return `${count} followers`;
  };

  // Format track duration from seconds to mm:ss
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play track
  const handlePlayTrack = (track) => {
    if (playTrack) {
      playTrack(track);
    }
  };

  // Handle play playlist
  const handlePlayPlaylist = (playlistId) => {
    navigate(`/playlists/${playlistId}`);
  };

  // Handle join stream
  const handleJoinStream = (streamId) => {
    navigate(`/stream/${streamId}`);
  };

  // Handle play album
  const handlePlayAlbum = (album) => {
    navigate(`/albums/${album.AlbumID}`);
  };

  return (
    <div className="pb-5">
      {/* Hero Banner */}
      <Carousel className="mb-5 rounded overflow-hidden">
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://crossfadr.com/wp-content/uploads/2018/10/deephousepic.jpg"
            alt="Welcome to StreamDJ"
            style={{ height: '400px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h1>Welcome to StreamDJ</h1>
            <p>Your ultimate music streaming platform for DJs and music lovers.</p>
            <Button variant="primary" className="me-2" as={Link} to="/discover">Start Listening</Button>
            <Button variant="outline-light" as={Link} to="/discover">Explore</Button>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://t3.ftcdn.net/jpg/04/08/99/00/240_F_408990068_A8QzYIfgChv66j71u5eavcIKA6NC2ML3.jpg"
            alt="Live DJ Sessions"
            style={{ height: '400px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h1>Live DJ Sessions</h1>
            <p>Join live streams from top DJs around the world.</p>
            <Button variant="primary" as={Link} to="/liveStreams">Join Now</Button>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {/* Trending Section */}
      <div className="mb-5">
        <TrendingSection onTrackSelect={handlePlayTrack} />
      </div>

      {/* Recently Listened To - Only show if user is logged in and has recent listens */}
      {user && recentListens.length > 0 && (
        <section className="mb-5">
          <Container>
            <h2 className="mb-4">Recently Listened To</h2>
            <Row>
              {recentListens.map(track => (
                <Col md={3} key={track.TrackID || track.id} className="mb-4">
                  <TrackCard track={track} onTrackSelect={handlePlayTrack} />
                </Col>
              ))}
            </Row>
            <div className="text-center mt-3">
              <Button variant="outline-primary" as={Link} to="/history">View Listening History</Button>
            </div>
          </Container>
        </section>
      )}



      <RecommendedSection
        apiUrl={`http://localhost:5001/api/recommendations/collab/${user?.id || 1}`}
        title="People who liked what you like also liked..."
        onTrackSelect={onTrackSelect}
      />

      {user && (
        <RecommendedSection
          apiUrl={`http://localhost:5001/api/recommendations/recent-genre/${user.id}`}
          title="Because You Listened To..."
          onTrackSelect={onTrackSelect}
        />
      )}

      {/* ✅ Recommended Section (from external component) */}
      <RecommendedSection
        title="Recommended For You"
        apiUrl={`http://localhost:5001/api/recommendations/${user ? user.id : '1'}`}
        onTrackSelect={handlePlayTrack}
      />

{!loadingFeatured && featuredPlaylists.length > 0 && (
  <section className="mb-5">
    <h2 className="mb-4">Featured Playlists</h2>
    <Row>
      {featuredPlaylists.map(playlist => (
        <Col md={3} key={playlist.PlaylistID} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Img
              variant="top"
              src={playlist.CoverURL || '/default-cover.jpg'} // Fallback image
            />
            <Card.Body>
              <Card.Title>{playlist.Name}</Card.Title>
              <Card.Text>
                {playlist.Description || 'No description'} <br />
                {playlist.total_likes} likes • {playlist.total_plays} plays
              </Card.Text>
              <Button variant="success" size="sm">
                <FaPlay className="me-1" /> Play
              </Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
    <div className="text-center mt-3">
      <Button variant="outline-primary" as={Link} to="/playlists">View All Playlists</Button>
    </div>
  </section>
)}

{user && !loadingPersonalized && personalizedPlaylists.length > 0 && (
  <section className="mb-5">
    <h2 className="mb-4">Playlists You Might Like</h2>
    <Row>
      {personalizedPlaylists.map((playlist) => (
        <Col md={3} key={playlist.PlaylistID} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Img variant="top" src={playlist.CoverURL || '/default-cover.jpg'} />
            <Card.Body>
              <Card.Title>{playlist.Name}</Card.Title>
              <Card.Text>
                {playlist.Description || 'No description'}<br />
                {playlist.total_likes} likes • {playlist.total_plays} plays
              </Card.Text>
              <Button variant="success" size="sm">
                <FaPlay className="me-1" /> Play
              </Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </section>
)}

      {/* Live Streams */}
      <section className="mb-5">
        <Container>
          <h2 className="mb-4">Live Now</h2>
          <Row>
            {liveStreams.map(stream => (
              <Col md={4} key={stream.LiveStreamID} className="mb-4">
                <LiveStreamCard 
                  stream={stream} 
                  onJoinClick={() => handleJoinStream(stream.LiveStreamID)} 
                />
              </Col>
            ))}
          </Row>
          <div className="text-center mt-3">
            <Button variant="outline-primary" as={Link} to="/liveStreams">View All Live Streams</Button>
          </div>
        </Container>
      </section>

      {/* Top Artists */}
      <section className="mb-5">
        <Container>
          <h2 className="mb-4">Top Artists</h2>
          {loadingArtists ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading top artists...</span>
              </Spinner>
            </div>
          ) : (
            <Row className="justify-content-center">
              {topArtists.map(artist => (
                <Col md={2} key={artist.UserID} className="mb-4 text-center">
                  <Link to={`/profile/${artist.UserID}`} className="text-decoration-none">
                    <img 
                      src={artist.ProfileImage || 'https://placehold.co/300x300?text=Artist'} 
                      alt={artist.Username} 
                      className="rounded-circle mb-2 img-thumbnail"
                      style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/300x300?text=Artist';
                      }}
                    />
                    <h5>{artist.Username}</h5>
                    <p className="text-muted small mb-1">{artist.Genre || 'Music'}</p>
                    <p className="small text-secondary">{formatFollowers(artist.FollowerCount)}</p>
                  </Link>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Popular Tracks */}
      <section className="mb-5">
        <Container>
          <h2 className="mb-4">Popular Tracks</h2>
          {loadingPopular ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading popular tracks...</span>
              </Spinner>
            </div>
          ) : (
            <Card>
              <Card.Body>
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Artist</th>
                      <th>Duration</th>
                      <th>Plays</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularTracks.map((track, index) => (
                      <tr key={track.TrackID}>
                        <td>{index + 1}</td>
                        <td>{track.Title}</td>
                        <td>
                          {track.UserID ? (
                            <Link to={`/profile/${track.UserID}`} className="text-decoration-none">
                              {track.Username || 'Unknown User'}
                              {(track.Artist && track.Artist !== track.Username) && (
                                <div><small className="text-muted">{track.Artist}</small></div>
                              )}
                            </Link>
                          ) : (
                            <>
                              {track.Username || 'Unknown User'}
                              {(track.Artist && track.Artist !== track.Username) && (
                                <div><small className="text-muted">{track.Artist}</small></div>
                              )}
                            </>
                          )}
                        </td>
                        <td>{formatDuration(track.Duration)}</td>
                        <td>{new Intl.NumberFormat('en-US').format(track.PlayCount)}</td>
                        <td>
                          <Button 
                            variant="success" 
                            className="play-button-inline"
                            onClick={() => handlePlayTrack(track)}
                          >
                            <FaPlay />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card.Body>
            </Card>
          )}
        </Container>
      </section>

      {/* Popular Albums */}
      <section className="mb-5">
        <AlbumsSection
          title="Popular Albums"
          apiUrl="/api/albums/popular"
          limit={4}
          onAlbumPlay={handlePlayAlbum}
        />
      </section>

      {/* Why Choose StreamDJ? */}
      <section className="mb-5 text-center">
        <Container>
          <h2 className="mb-4">Why Choose StreamDJ?</h2>
          <Row className="justify-content-center">
            <Col md={4} className="mb-4">
              <div className="d-flex flex-column align-items-center">
                <div className="feature-icon text-primary mb-3" style={{ fontSize: '3rem' }}>
                  <FaMusic />
                </div>
                <h3>Millions of Tracks</h3>
                <p className="text-muted">Access to a vast library of music from around the world.</p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="d-flex flex-column align-items-center">
                <div className="feature-icon text-primary mb-3" style={{ fontSize: '3rem' }}>
                  <FaHeadphones />
                </div>
                <h3>High Quality Audio</h3>
                <p className="text-muted">Enjoy crystal clear sound with our premium audio quality.</p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="d-flex flex-column align-items-center">
                <div className="feature-icon text-primary mb-3" style={{ fontSize: '3rem' }}>
                  <FaMicrophone />
                </div>
                <h3>Live DJ Sessions</h3>
                <p className="text-muted">Experience live performances from top DJs around the globe.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;