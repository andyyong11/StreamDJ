import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaHeadphones, FaMicrophone, FaEllipsisH } from 'react-icons/fa';
import Slider from 'react-slick';
import TrendingSection from '../components/sections/TrendingSection';
import RecommendedSection from '../components/sections/RecommendedSection';
import AlbumsSection from '../components/sections/AlbumsSection';
import PlaylistSection from '../components/sections/PlaylistSection';
import PlaylistCard from '../components/cards/PlaylistCard';
import LiveStreamCard from '../components/cards/LiveStreamCard';
import TrackCard from '../components/cards/TrackCard';
import ProfileImage from '../components/ui/ProfileImage';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/apiConfig';
import '../styles/PlayButton.css';

// Default image handling functions
const formatImageUrl = (url, type) => {
  if (!url) {
    // Use the exact filenames as they exist in the public/images directory
    if (type === 'track') {
      return `/images/Default Track.png`;
    } else if (type === 'album') {
      return `/images/Default Album.png`;
    } else if (type === 'playlist') {
      return `/images/Default Playlist.png`;
    } else {
      return `/images/default-${type}.jpg`;
    }
  }
  return url;
};

const handleImageError = (e, type) => {
  // Use the exact filenames as they exist in the public/images directory
  if (type === 'track') {
    e.target.src = `/images/Default Track.png`;
  } else if (type === 'album') {
    e.target.src = `/images/Default Album.png`;
  } else if (type === 'playlist') {
    e.target.src = `/images/Default Playlist.png`;
  } else {
    e.target.src = `/images/default-${type}.jpg`;
  }
};

const HomePage = ({ playTrack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Trending
  const [trending, setTrending] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Recent listens state
  const [recentListens, setRecentListens] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoadingTrending(true);
        const response = await api.get(API_ENDPOINTS.trending);
        if (response?.data) {
          setTrending(Array.isArray(response.data) ? response.data : []);
        } else {
          setTrending([]);
        }
      } catch (err) {
        console.error('Failed to fetch trending tracks:', err);
        setTrending([]);
      } finally {
        setLoadingTrending(false);
      }
    };

    fetchTrending();
  }, []);

  // Featured playlists
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  
  // Personalized playlists
  const [personalizedPlaylists, setPersonalizedPlaylists] = useState([]);
  const [loadingPersonalized, setLoadingPersonalized] = useState(true);

  useEffect(() => {
    const fetchFeaturedPlaylists = async () => {
      try {
        setLoadingFeatured(true);
        const response = await api.get(API_ENDPOINTS.featuredPlaylists);
        if (response?.data) {
          const playlists = Array.isArray(response.data) ? response.data : [];
          
          // Debug track counts in featured playlists
          console.log('Featured playlists data:', playlists.map(p => ({
            title: p.Title,
            trackCount: p.TrackCount,
            trackCountType: typeof p.TrackCount,
            rawData: p
          })));
          
          setFeaturedPlaylists(playlists);
        } else {
          setFeaturedPlaylists([]);
        }
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
      if (!user) {
        setLoadingPersonalized(false);
        return;
      }
      
      try {
        setLoadingPersonalized(true);
        // Using a safe path that checks if the endpoint exists
        const response = await api.get(`/api/playlists/featured/personalized/${user.id}`);
        if (response?.data) {
          setPersonalizedPlaylists(Array.isArray(response.data) ? response.data : []);
        } else {
          setPersonalizedPlaylists([]);
        }
      } catch (err) {
        console.error('Failed to fetch personalized playlists:', err);
        setPersonalizedPlaylists([]);
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
        const response = await api.get(API_ENDPOINTS.activeStreams);
        if (response?.data) {
          setLiveStreams(Array.isArray(response.data) ? response.data.slice(0, 3) : []); // Get first 3 live streams
        } else {
          // Fallback data
          setLiveStreams([
            { LiveStreamID: 1, Title: 'Friday Night Party', Username: 'DJ Sparkle', ListenerCount: 1243 },
            { LiveStreamID: 2, Title: 'Ambient Sounds', Username: 'ChillWave', ListenerCount: 856 },
            { LiveStreamID: 3, Title: 'Hip Hop Mix', Username: 'BeatMaster', ListenerCount: 2105 }
          ]);
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
        // Use the API_ENDPOINTS helper
        const response = await api.get(API_ENDPOINTS.recentListens(user.id));
        if (response?.data) {
          setRecentListens(Array.isArray(response.data) ? response.data.slice(0, 4) : []); // Get first 4 recent tracks
        } else {
          setRecentListens([]);
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
        const response = await api.get(API_ENDPOINTS.topUsers);
        if (response?.data) {
          setTopArtists(Array.isArray(response.data) ? response.data.slice(0, 5) : []); // Get top 5 artists
        } else {
          // Fallback data
          setTopArtists([
            { UserID: 1, Username: 'ElectroQueen', Genre: 'Electronic', ProfileImage: null, FollowerCount: 1200000 },
            { UserID: 2, Username: 'BeatMaster', Genre: 'Hip Hop', ProfileImage: null, FollowerCount: 980000 },
            { UserID: 3, Username: 'RockLegend', Genre: 'Rock', ProfileImage: null, FollowerCount: 1500000 },
            { UserID: 4, Username: 'JazzMaster', Genre: 'Jazz', ProfileImage: null, FollowerCount: 750000 },
            { UserID: 5, Username: 'PopStar', Genre: 'Pop', ProfileImage: null, FollowerCount: 2300000 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching top artists:', error);
        // Fallback data
        setTopArtists([
          { UserID: 1, Username: 'ElectroQueen', Genre: 'Electronic', ProfileImage: null, FollowerCount: 1200000 },
          { UserID: 2, Username: 'BeatMaster', Genre: 'Hip Hop', ProfileImage: null, FollowerCount: 980000 },
          { UserID: 3, Username: 'RockLegend', Genre: 'Rock', ProfileImage: null, FollowerCount: 1500000 },
          { UserID: 4, Username: 'JazzMaster', Genre: 'Jazz', ProfileImage: null, FollowerCount: 750000 },
          { UserID: 5, Username: 'PopStar', Genre: 'Pop', ProfileImage: null, FollowerCount: 2300000 }
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
        const response = await api.get(API_ENDPOINTS.popularTracks);
        if (response?.data) {
          setPopularTracks(Array.isArray(response.data) ? response.data.slice(0, 10) : []); // Get top 10 tracks
        } else {
          // Fallback data
          setPopularTracks([
            { TrackID: 1, Title: 'Summer Groove', Artist: 'BeachDJ', Duration: 225, PlayCount: 1250000 },
            { TrackID: 2, Title: 'Midnight City', Artist: 'Urban Beats', Duration: 252, PlayCount: 980000 },
            { TrackID: 3, Title: 'Chill Wave', Artist: 'Ambient Master', Duration: 330, PlayCount: 750000 },
            { TrackID: 4, Title: 'Dance Floor', Artist: 'Party Mix', Duration: 202, PlayCount: 2100000 },
            { TrackID: 5, Title: 'Deep House', Artist: 'Club Masters', Duration: 375, PlayCount: 1800000 }
          ]);
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
    // Navigate to the playlist page with autoplay flag
    navigate(`/playlists/${playlistId}?autoplay=true`);
  };

  // Handle join stream
  const handleJoinStream = (streamId) => {
    navigate(`/streams/${streamId}`);
  };

  // Handle play album
  const handlePlayAlbum = (albumId) => {
    // Navigate to the album page with autoplay flag
    navigate(`/albums/${albumId}?autoplay=true`);
  };

  // Handle liking a playlist
  const handleLikePlaylist = async (playlistId, e) => {
    e.stopPropagation();
    if (!user) {
      // Redirect to login or show login modal
      navigate('/login');
      return;
    }

    try {
      await api.post(`/api/playlists/${playlistId}/like`, { userId: user.id });
      // Could update UI to show liked status
    } catch (error) {
      console.error('Error liking playlist:', error);
    }
  };

  // Handle liking an album
  const handleLikeAlbum = async (albumId, e) => {
    e.stopPropagation();
    if (!user) {
      // Redirect to login or show login modal
      navigate('/login');
      return;
    }

    // Log the album ID and ensure it's a valid value
    console.log(`Album ID received: ${albumId}, type: ${typeof albumId}`);
    
    // Make sure albumId is treated as a number
    const albumIdNum = parseInt(albumId, 10);
    if (isNaN(albumIdNum)) {
      console.error('Invalid album ID:', albumId);
      return;
    }

    try {
      console.log(`Checking like status for album ${albumIdNum}, endpoint: /api/albums/${albumIdNum}/like-status`);
      // First check the current like status
      const checkResponse = await api.get(`/api/albums/${albumIdNum}/like-status`, {
        params: { userId: user.id }
      });
      
      console.log(`Current like status for album ${albumIdNum}:`, checkResponse.data);
      const isLiked = checkResponse?.data?.liked;
      const endpoint = isLiked ? 'unlike' : 'like';
      
      console.log(`Sending ${endpoint} request for album ${albumIdNum}, endpoint: /api/albums/${albumIdNum}/${endpoint}`);
      // Perform the like/unlike operation
      const likeResponse = await api.post(`/api/albums/${albumIdNum}/${endpoint}`, { userId: user.id });
      console.log(`Album ${endpoint} response:`, likeResponse.data);
      
      // UI feedback happens via the AlbumsSection component state
    } catch (error) {
      console.error(`Error toggling album like status for album ${albumIdNum}:`, error);
      console.error('API error details:', error.response?.data || 'No response data');
      console.error('Error status:', error.response?.status);
      console.error('Error URL:', error.config?.url);
    }
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
            <Button variant="primary" as={Link} to="/live-streams">Join Now</Button>
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
        apiUrl={`/api/recommendations/collab/${user?.id || 1}`}
        title="People who liked what you like also liked..."
        onTrackSelect={handlePlayTrack}
      />

      {user && (
        <RecommendedSection
          apiUrl={`/api/recommendations/recent-genre/${user.id}`}
          title="Because You Listened To..."
          onTrackSelect={handlePlayTrack}
        />
      )}

      {/* Recommended Section (from external component) */}
      <RecommendedSection
        title="Recommended For You"
        apiUrl={`/api/recommendations/${user ? user.id : '1'}`}
        onTrackSelect={handlePlayTrack}
      />

      {/* Popular Albums */}
      <AlbumsSection
        title="Popular Albums"
        apiUrl="/api/albums/popular"
        limit={4}
        onAlbumPlay={(album) => handlePlayAlbum(album.AlbumID)}
        onLikeClick={handleLikeAlbum}
      />

      {/* Featured Playlists - using PlaylistSection */}
      {!loadingFeatured && featuredPlaylists.length > 0 && (
        <PlaylistSection
          title="Featured Playlists"
          playlists={featuredPlaylists}
          loading={loadingFeatured}
          onPlaylistClick={(playlistId) => handlePlayPlaylist(playlistId)}
          onLikeClick={handleLikePlaylist}
          onViewAllClick={() => navigate('/playlists')}
        />
      )}

      {/* Playlists You Might Like - using PlaylistSection */}
      {user && !loadingPersonalized && personalizedPlaylists.length > 0 && (
        <PlaylistSection
          title="Playlists You Might Like"
          playlists={personalizedPlaylists}
          loading={loadingPersonalized}
          onPlaylistClick={(playlistId) => handlePlayPlaylist(playlistId)}
          onLikeClick={handleLikePlaylist}
        />
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
            <Button variant="outline-primary" as={Link} to="/live-streams">View All Live Streams</Button>
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
                    <ProfileImage 
                      src={artist.ProfileImage}
                      alt={artist.Username}
                      size={120}
                    />
                    <h5 className="mt-2 mb-0">{artist.Username}</h5>
                    <p className="text-muted small mb-1">{artist.Genre || 'Music'}</p>
                    <p className="small text-secondary">{formatFollowers(artist.FollowersCount || artist.FollowerCount)}</p>
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
                        <td>{new Intl.NumberFormat('en-US').format(track.PlayCount || track.play_count || 0)}</td>
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