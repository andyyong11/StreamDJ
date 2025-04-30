import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlay, FaHeart, FaMusic, FaHeadphones, FaMicrophone, FaEllipsisH } from 'react-icons/fa';
import Slider from 'react-slick';
import RecommendedSection from './RecommendedSection'; // ✅ Import here
import { useAuth } from '../context/AuthContext';

const HomePage = ({ onTrackSelect }) => {
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
  const featuredPlaylists = [
    { id: 1, title: 'Summer Hits 2023', creator: 'StreamDJ', image: 'https://thumbs.dreamstime.com/b/happy-new-year-happy-new-year-greeting-card-colorful-fireworks-sparkling-burning-number-beautiful-holiday-web-banner-248472064.jpg', tracks: 25 },
    { id: 2, title: 'Chill Vibes', creator: 'DJ Relaxx', image: 'https://lofigirl.com/wp-content/uploads/2023/02/DAY_UPDATE_ILLU.jpg', tracks: 18 },
    { id: 3, title: 'Workout Mix', creator: 'FitBeats', image: 'https://thumbs.dreamstime.com/b/weightlifter-clapping-hands-preparing-workout-gym-focus-dust-112033565.jpg', tracks: 32 },
    { id: 4, title: 'EDM Anthems', creator: 'ElectroMaster', image: 'https://www.ikmultimedia.com/products/stedm/main-banner/mobile.jpg', tracks: 40 }
  ];

  const liveStreams = [
    { id: 1, title: 'Friday Night Party', dj: 'DJ Sparkle', listeners: 1243, image: 'https://via.placeholder.com/300' },
    { id: 2, title: 'Ambient Sounds', dj: 'ChillWave', listeners: 856, image: 'https://via.placeholder.com/300' },
    { id: 3, title: 'Hip Hop Mix', dj: 'BeatMaster', listeners: 2105, image: 'https://via.placeholder.com/300' }
  ];

  const topArtists = [
    { id: 1, name: 'ElectroQueen', genre: 'Electronic', image: 'https://via.placeholder.com/150', followers: '1.2M' },
    { id: 2, name: 'BeatMaster', genre: 'Hip Hop', image: 'https://via.placeholder.com/150', followers: '980K' },
    { id: 3, name: 'RockLegend', genre: 'Rock', image: 'https://via.placeholder.com/150', followers: '1.5M' },
    { id: 4, name: 'JazzMaster', genre: 'Jazz', image: 'https://via.placeholder.com/150', followers: '750K' },
    { id: 5, name: 'PopStar', genre: 'Pop', image: 'https://via.placeholder.com/150', followers: '2.3M' }
  ];

  const recentTracks = [
    { id: 1, title: 'Summer Groove', artist: 'BeachDJ', duration: '3:45', plays: 1250000 },
    { id: 2, title: 'Midnight City', artist: 'Urban Beats', duration: '4:12', plays: 980000 },
    { id: 3, title: 'Chill Wave', artist: 'Ambient Master', duration: '5:30', plays: 750000 },
    { id: 4, title: 'Dance Floor', artist: 'Party Mix', duration: '3:22', plays: 2100000 },
    { id: 5, title: 'Deep House', artist: 'Club Masters', duration: '6:15', plays: 1800000 }
  ];

  return (
    <Container>
      {/* Hero Banner */}
      <Carousel className="mb-5">
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://crossfadr.com/wp-content/uploads/2018/10/deephousepic.jpg"
            alt="First slide"
            style={{ height: '400px', objectFit: 'cover', borderRadius: '10px' }}
          />
          <Carousel.Caption>
            <h3>Welcome to StreamDJ</h3>
            <p>Your ultimate music streaming platform for DJs and music lovers.</p>
            <Button variant="primary" className="me-2">Start Listening</Button>
            <Button variant="outline-light">Explore</Button>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="https://t3.ftcdn.net/jpg/04/08/99/00/240_F_408990068_A8QzYIfgChv66j71u5eavcIKA6NC2ML3.jpg"
            alt="Second slide"
            style={{ height: '400px', objectFit: 'cover', borderRadius: '10px' }}
          />
          <Carousel.Caption>
            <h3>Live DJ Sessions</h3>
            <p>Join live streams from top DJs around the world.</p>
            <Button variant="primary">Join Now</Button>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>

      {/* Trending Tracks Carousel */}
      {!loadingTrending && trending.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-4">Trending Now</h2>
          <Slider
            dots={false}
            infinite={true}
            speed={500}
            slidesToShow={5}
            slidesToScroll={2}
            responsive={[
              { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 2 } },
              { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
              { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } },
            ]}
          >
            {trending.map((track, idx) => (
              <div key={idx} className="px-2">
                <Card className="h-100 text-white bg-dark">
                  <Card.Img
                    variant="top"
                    src={`http://localhost:5001/${track.CoverArt}`}
                    alt={track.Title}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/default-cover.jpg'; }}
                  />
                  <Card.Body>
                    <Card.Title style={{ fontSize: '1rem' }}>{track.Title}</Card.Title>
                    <Card.Text className="text-white-50 small">{track.Artist}</Card.Text>
                    <Card.Text className="text-muted small">{track.play_count} plays</Card.Text>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </Slider>
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
        apiUrl={`http://localhost:5001/api/recommendations/1`} // You can replace 1 with dynamic user ID later
        onTrackSelect={onTrackSelect}
      />


      {/* Featured Playlists */}
      <section className="mb-5">
        <h2 className="mb-4">Featured Playlists</h2>
        <Row>
          {featuredPlaylists.map(playlist => (
            <Col md={3} key={playlist.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={playlist.image} />
                <Card.Body>
                  <Card.Title>{playlist.title}</Card.Title>
                  <Card.Text>
                    By {playlist.creator} • {playlist.tracks} tracks
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <Button variant="success" size="sm">
                      <FaPlay className="me-1" /> Play
                    </Button>
                    <Button variant="outline-danger" size="sm">
                      <FaHeart />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center mt-3">
          <Button variant="outline-primary" as={Link} to="/playlists">View All Playlists</Button>
        </div>
      </section>

      {/* Live Streams */}
      <section className="mb-5">
        <h2 className="mb-4">Live Now</h2>
        <Row>
          {liveStreams.map(stream => (
            <Col md={4} key={stream.id} className="mb-4">
              <Card className="h-100 shadow-sm">
                <div className="position-relative">
                  <Card.Img variant="top" src={stream.image} />
                  <Badge 
                    bg="danger" 
                    className="position-absolute top-0 start-0 m-2"
                  >
                    LIVE
                  </Badge>
                  <Badge 
                    bg="dark" 
                    className="position-absolute bottom-0 end-0 m-2"
                  >
                    <FaHeadphones className="me-1" /> {stream.listeners.toLocaleString()}
                  </Badge>
                </div>
                <Card.Body>
                  <Card.Title>{stream.title}</Card.Title>
                  <Card.Text>
                    By {stream.dj}
                  </Card.Text>
                  <Button variant="primary" className="w-100">
                    Join Stream
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center mt-3">
          <Button variant="outline-primary" as={Link} to="/live">View All Live Streams</Button>
        </div>
      </section>

      {/* Top Artists */}
      <section className="mb-5">
        <h2 className="mb-4">Top Artists</h2>
        <Row className="justify-content-center">
          {topArtists.map(artist => (
            <Col md={2} key={artist.id} className="mb-4 text-center">
              <img 
                src={artist.image} 
                alt={artist.name} 
                className="rounded-circle mb-2"
                style={{ width: '120px', height: '120px' }}
              />
              <h5>{artist.name}</h5>
              <p className="text-muted small">{artist.genre}</p>
              <p className="small">{artist.followers} followers</p>
            </Col>
          ))}
        </Row>
      </section>

      {/* Recent Tracks */}
      <section className="mb-5">
        <h2 className="mb-4">Popular Tracks</h2>
        <Card>
          <Card.Body>
            <table className="table">
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
                {recentTracks.map((track, index) => (
                  <tr key={track.id}>
                    <td>{index + 1}</td>
                    <td>{track.title}</td>
                    <td>{track.artist}</td>
                    <td>{track.duration}</td>
                    <td>{track.plays.toLocaleString()}</td>
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
      </section>

      {/* Features Section */}
      <section className="mb-5">
        <h2 className="text-center mb-4">Why Choose StreamDJ?</h2>
        <Row>
          <Col md={4} className="text-center mb-4">
            <div className="p-3">
              <FaMusic className="display-4 mb-3 text-primary" />
              <h4>Millions of Tracks</h4>
              <p>Access to a vast library of music from around the world.</p>
            </div>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="p-3">
              <FaHeadphones className="display-4 mb-3 text-primary" />
              <h4>High Quality Audio</h4>
              <p>Enjoy crystal clear sound with our premium audio quality.</p>
            </div>
          </Col>
          <Col md={4} className="text-center mb-4">
            <div className="p-3">
              <FaMicrophone className="display-4 mb-3 text-primary" />
              <h4>Live DJ Sessions</h4>
              <p>Experience live performances from top DJs around the globe.</p>
            </div>
          </Col>
        </Row>
      </section>
    </Container>
  );
};

export default HomePage;