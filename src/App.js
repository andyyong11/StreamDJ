import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Future } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';
import Navbar from './components/layout/Navbar';
import MusicPlayer from './components/player/MusicPlayer';

// Auth
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';

// Components
import PrivateRoute from './components/auth/PrivateRoute';

// Loading fallback
const LoadingFallback = () => <div className="loading-fallback">Loading...</div>;

// Pages - use dynamic imports to reduce initial bundle size
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ProfileSettingsPage = React.lazy(() => import('./pages/ProfileSettingsPage'));
const DiscoverPage = React.lazy(() => import('./pages/discoverPage'));
const LibraryPage = React.lazy(() => import('./pages/LibraryPage'));
const LikedSongsPage = React.lazy(() => import('./pages/LikedSongsPage'));
const LiveStreamsPage = React.lazy(() => import('./pages/liveStreamsPage'));
const UploadPage = React.lazy(() => import('./pages/uploadPage'));
const StreamPlayerPage = React.lazy(() => import('./pages/StreamPlayerPage'));
const PlaylistPage = React.lazy(() => import('./pages/PlaylistPage'));
const CreatePlaylistPage = React.lazy(() => import('./pages/CreatePlaylistPage'));
const BrowsePage = React.lazy(() => import('./pages/BrowsePage'));
const UploadAlbumPage = React.lazy(() => import('./pages/UploadAlbumPage'));
const AlbumPage = React.lazy(() => import('./pages/AlbumPage'));
const UserAlbumsPage = React.lazy(() => import('./pages/UserAlbumsPage'));
const EditAlbumPage = React.lazy(() => import('./pages/EditAlbumPage'));
const EditTrackPage = React.lazy(() => import('./pages/EditTrackPage'));
const CreatorDashboard = React.lazy(() => import('./pages/CreatorDashboard'));

// Rate limiting control - prevent too many concurrent requests
const PAGE_LOAD_DELAY = 100; // Add small delay between page transitions

function AppContent() {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadErrors, setLoadErrors] = useState(null);
  const [librarySection, setLibrarySection] = useState('liked-tracks');
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  useEffect(() => {
    // Load initial playlist with retry
    const fetchInitialTracks = async (retryCount = 0) => {
      try {
        setLoadErrors(null);
        
        // Wait a short delay to prevent overwhelming the server on initial load
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased from 300 to 500ms
        
        // Use our API service instead of native fetch
        const response = await import('./services/api').then(module => {
          const api = module.default;
          return api.get('/api/tracks', { params: { limit: 10 } });
        });
        
        const data = response.data;
        if (data && data.length > 0) {
          setPlaylist(data);
          // Don't set currentTrack automatically - wait for user to select one
          // setCurrentTrack(data[0]);
        }
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Error fetching initial tracks:', error);
        
        // Handle rate limiting with exponential backoff
        if (error.response && error.response.status === 429 && retryCount < 3) {
          const delayMs = 2000 * (retryCount + 1); // 2s, 4s, 6s backoff
          setLoadErrors(`Rate limited. Retrying in ${delayMs/1000} seconds...`);
          
          // Retry with backoff
          setTimeout(() => {
            fetchInitialTracks(retryCount + 1);
          }, delayMs);
        } else {
          // After max retries or for other errors, silently fail
          // The user can still browse content and play tracks manually
          setInitialLoadComplete(true);
          setLoadErrors(retryCount >= 3 
            ? "Couldn't load initial tracks after multiple attempts. You can still browse and play music."
            : null);
        }
      }
    };

    fetchInitialTracks();
    
    // Clean up function
    return () => {
      // Reset any circuit breakers on component unmount
      import('./services/api').then(module => {
        const api = module.default;
        if (api.resetCircuitBreakers) {
          api.resetCircuitBreakers();
        }
      });
    };
  }, []);

  // Add transitions between pages
  const handlePageTransition = useCallback(() => {
    setIsPageTransitioning(true);
    setTimeout(() => setIsPageTransitioning(false), PAGE_LOAD_DELAY);
  }, []);

  const handleTrackSelect = useCallback((track, playlist = []) => {
    setCurrentTrack(track);
    setCurrentPlaylist(playlist);
  }, []);

  const handleNextTrack = () => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
  };

  const handlePreviousTrack = () => {
    if (playlist.length === 0) return;
    
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
  };

  const playTrack = (track, tracksList = null) => {
    if (tracksList) {
      setPlaylist(tracksList);
      setCurrentTrackIndex(tracksList.findIndex(t => t.TrackID === track.TrackID));
    } else if (playlist.length > 0) {
      // If we're playing a new track but not changing the playlist
      setCurrentTrackIndex(playlist.findIndex(t => t.TrackID === track.TrackID));
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  // Global login/register handlers
  const openLoginModal = () => {
    setShowRegisterModal(false); // Close register if open
    setShowLoginModal(true);
  };

  const openRegisterModal = () => {
    setShowLoginModal(false); // Close login if open
    setShowRegisterModal(true);
  };

  const handleLibrarySectionChange = (section) => {
    setLibrarySection(section);
  };

  return (
    <AuthProvider>
      <Router future={{ 
        v7_relativeSplatPath: true, 
        v7_startTransition: true,
        v7_normalizeFormMethod: true
      }}>
        <div className="content">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              
              <Route
                path="/"
                element={
                  <Layout 
                    onTrackSelect={handleTrackSelect} 
                    currentTrack={currentTrack}
                    openLoginModal={openLoginModal}
                    openRegisterModal={openRegisterModal}
                  >
                    <HomePage playTrack={playTrack} />
                    {showLoginModal && (
                      <LoginModal show={showLoginModal} handleClose={() => setShowLoginModal(false)} />
                    )}
                    {showRegisterModal && (
                      <RegisterModal show={showRegisterModal} handleClose={() => setShowRegisterModal(false)} />
                    )}
                  </Layout>
                }
              />
              
              {/* Rest of routes */}
              <Route
                path="/profile/:id"
                element={
                  <Layout 
                    onTrackSelect={handleTrackSelect} 
                    currentTrack={currentTrack}
                    openLoginModal={openLoginModal}
                    openRegisterModal={openRegisterModal}
                  >
                    <ProfilePage 
                      playTrack={playTrack} 
                      openLoginModal={openLoginModal}
                    />
                  </Layout>
                }
              />
              
              {/* ...existing routes... */}
              <Route
                path="/settings/profile"
                element={
                  <Layout 
                    onTrackSelect={handleTrackSelect} 
                    currentTrack={currentTrack}
                    openLoginModal={openLoginModal}
                    openRegisterModal={openRegisterModal}
                  >
                    <PrivateRoute>
                      <ProfileSettingsPage openLoginModal={openLoginModal} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              {/* ...remaining routes... */}
              <Route
                path="/discover"
                element={
                  <Layout 
                    onTrackSelect={handleTrackSelect} 
                    currentTrack={currentTrack}
                    openLoginModal={openLoginModal}
                    openRegisterModal={openRegisterModal}
                  >
                    <DiscoverPage />
                    {showLoginModal && (
                      <LoginModal show={showLoginModal} handleClose={() => setShowLoginModal(false)} />
                    )}
                    {showRegisterModal && (
                      <RegisterModal show={showRegisterModal} handleClose={() => setShowRegisterModal(false)} />
                    )}
                  </Layout>
                }
              />
              <Route
                path="/library"
                element={
                  <Layout 
                    onTrackSelect={handleTrackSelect} 
                    currentTrack={currentTrack}
                    openLoginModal={openLoginModal}
                    openRegisterModal={openRegisterModal}
                  >
                    <PrivateRoute>
                      <LibraryPage onTrackSelect={handleTrackSelect} user={user} userId={user?.id} librarySection={librarySection} handleSectionChange={handleLibrarySectionChange} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/liveStreams"
                element={
                  <Layout 
                    onTrackSelect={handleTrackSelect} 
                    currentTrack={currentTrack}
                    openLoginModal={openLoginModal}
                    openRegisterModal={openRegisterModal}
                  >
                    <LiveStreamsPage />
                    {showLoginModal && (
                      <LoginModal show={showLoginModal} handleClose={() => setShowLoginModal(false)} />
                    )}
                    {showRegisterModal && (
                      <RegisterModal show={showRegisterModal} handleClose={() => setShowRegisterModal(false)} />
                    )}
                  </Layout>
                }
              />
              <Route
                path="/upload"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <UploadPage />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/upload-album"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <UploadAlbumPage />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/streams/:streamId"
                element={
                  <Layout 
                    onTrackSelect={handleTrackSelect} 
                    currentTrack={currentTrack}
                    openLoginModal={openLoginModal}
                    openRegisterModal={openRegisterModal}
                  >
                    <StreamPlayerPage openLoginModal={openLoginModal} />
                  </Layout>
                }
              />
              
              {/* Album Routes */}
              <Route
                path="/albums"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <UserAlbumsPage />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/albums/user/:userId"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <UserAlbumsPage />
                  </Layout>
                }
              />
              <Route
                path="/albums/:albumId"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <AlbumPage playTrack={playTrack} />
                  </Layout>
                }
              />
              <Route
                path="/edit-album/:albumId"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <EditAlbumPage />
                    </PrivateRoute>
                  </Layout>
                }
              />
              
              {/* Creator Dashboard Routes */}
              <Route
                path="/creator-dashboard"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <CreatorDashboard playTrack={playTrack} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/creator-dashboard/:section"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <CreatorDashboard playTrack={playTrack} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/my-tracks"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <CreatorDashboard section="my-tracks" playTrack={playTrack} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/my-playlists"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <CreatorDashboard section="my-playlists" playTrack={playTrack} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              
              {/* Liked Content Routes */}
              <Route
                path="/liked-tracks"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <LibraryPage section="liked-tracks" onTrackSelect={handleTrackSelect} user={user} userId={user?.id} librarySection={librarySection} handleSectionChange={handleLibrarySectionChange} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/liked-albums"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <LibraryPage section="liked-albums" onTrackSelect={handleTrackSelect} user={user} userId={user?.id} librarySection={librarySection} handleSectionChange={handleLibrarySectionChange} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/liked-playlists"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <LibraryPage section="liked-playlists" onTrackSelect={handleTrackSelect} user={user} userId={user?.id} librarySection={librarySection} handleSectionChange={handleLibrarySectionChange} />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/edit-track/:trackId"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <EditTrackPage />
                    </PrivateRoute>
                  </Layout>
                }
              />
              
              {/* Playlist Routes */}
              <Route
                path="/playlist/:id"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PlaylistPage onTrackSelect={handleTrackSelect} playTrack={playTrack} />
                  </Layout>
                }
              />
              <Route
                path="/playlists/:id"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PlaylistPage onTrackSelect={handleTrackSelect} playTrack={playTrack} />
                  </Layout>
                }
              />
              <Route
                path="/create-playlist"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <PrivateRoute>
                      <CreatePlaylistPage />
                    </PrivateRoute>
                  </Layout>
                }
              />
              <Route
                path="/browse"
                element={
                  <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                    <BrowsePage playTrack={playTrack} />
                  </Layout>
                }
              />
            </Routes>
          </Suspense>
        </div>
        {currentTrack && (
          <MusicPlayer 
            track={currentTrack} 
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onNext={handleNextTrack}
            onPrevious={handlePreviousTrack}
            currentPlaylist={playlist}
          />
        )}
      </Router>
    </AuthProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;