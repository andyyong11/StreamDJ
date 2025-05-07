import React, { useState, useCallback, useEffect } from 'react';
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

// Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import DiscoverPage from './pages/discoverPage';
import LibraryPage from './pages/libraryPage';
import LikedSongsPage from './pages/LikedSongsPage';
import LiveStreamsPage from './pages/liveStreamsPage';
import UploadPage from './pages/uploadPage';
import StreamPlayerPage from './pages/StreamPlayerPage';
import PlaylistPage from './pages/PlaylistPage';

// Auth
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import UploadAlbumPage from './pages/UploadAlbumPage';
// import StreamPlayerPage from './pages/StreamPlayerPage';
import AlbumPage from './pages/AlbumPage';
import UserAlbumsPage from './pages/UserAlbumsPage';
import EditAlbumPage from './pages/EditAlbumPage';
import EditTrackPage from './pages/EditTrackPage';
import CreatorDashboard from './pages/CreatorDashboard';
// import PlaylistPage from './pages/PlaylistPage';

// Components
import PrivateRoute from './components/auth/PrivateRoute';
import TrendingSection from './components/sections/TrendingSection';

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

  useEffect(() => {
    // Load initial playlist with retry
    const fetchInitialTracks = async (retryCount = 0) => {
      try {
        setLoadErrors(null);
        
        // Wait a short delay to prevent overwhelming the server on initial load
        await new Promise(resolve => setTimeout(resolve, 300));
        
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

  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <div className="content">
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
            <Route
              path="/discover"
              element={
                <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                  <DiscoverPage />
                </Layout>
              }
            />
            <Route
              path="/library"
              element={
                <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                  <PrivateRoute>
                    <LibraryPage onTrackSelect={handleTrackSelect} />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/liveStreams"
              element={
                <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                  <LiveStreamsPage />
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
            
            {/* My Content Routes */}
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
                    <LibraryPage section="liked-tracks" onTrackSelect={handleTrackSelect} />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/liked-albums"
              element={
                <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                  <PrivateRoute>
                    <LibraryPage section="liked-albums" onTrackSelect={handleTrackSelect} />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route
              path="/liked-playlists"
              element={
                <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                  <PrivateRoute>
                    <LibraryPage section="liked-playlists" onTrackSelect={handleTrackSelect} />
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
            
            {/* Playlist Route */}
            <Route
              path="/playlists/:id"
              element={
                <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                  <PlaylistPage playTrack={playTrack} />
                </Layout>
              }
            />
          </Routes>
        </div>
        {currentTrack && (
          <MusicPlayer 
            track={currentTrack} 
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            onNext={handleNextTrack}
            onPrevious={handlePreviousTrack}
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

// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import './App.css';

// import { AuthProvider, useAuth } from './context/AuthContext';

// // Layout
// import Layout from './components/layout/Layout';

// // Pages
// import HomePage from './pages/HomePage';
// import ProfilePage from './pages/ProfilePage';
// import DiscoverPage from './pages/discoverPage';
// import LibraryPage from './pages/libraryPage';
// import LikedSongsPage from './pages/LikedSongsPage';
// import LiveStreamsPage from './pages/liveStreamsPage';
// import UploadPage from './pages/uploadPage';
// import StreamPlayerPage from './pages/StreamPlayerPage';
// import PlaylistPage from './pages/PlaylistPage';

// // Auth
// import LoginModal from './components/auth/LoginModal';
// import RegisterModal from './components/auth/RegisterModal';
// import PrivateRoute from './components/auth/PrivateRoute';

// function AppContent() {
//   const { user } = useAuth();
//   const [currentTrack, setCurrentTrack] = useState(null);

//   const handleTrackSelect = (track) => {
//     setCurrentTrack(track);
//   };

//   return (
//     <Router>
//       <Routes>
//         <Route path="/login" element={<LoginModal />} />
//         <Route path="/register" element={<RegisterModal />} />
//         <Route
//           path="/"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <HomePage />
//             </Layout>
//           }
//         />
//         <Route
//           path="/profile/:id"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <ProfilePage />
//             </Layout>
//           }
//         />
//         <Route
//           path="/discover"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <DiscoverPage />
//             </Layout>
//           }
//         />
//           <Route
//             path="/library"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <LibraryPage userId={user?.id} />
//               </Layout>
//             }
//           />
//         <Route
//           path="/liveStreams"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <LiveStreamsPage />
//             </Layout>
//           }
//         />
//         <Route
//           path="/upload"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <PrivateRoute>
//                 <UploadPage />
//               </PrivateRoute>
//             </Layout>
//           }
//         />
//         <Route
//           path="/stream/:streamId"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <StreamPlayerPage />
//             </Layout>
//           }
//         />
//         <Route
//           path="/library/liked"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <LikedSongsPage onTrackSelect={handleTrackSelect} />
//             </Layout>
//           }
//         />
//         <Route
//           path="/playlist/:id"
//           element={
//             <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//               <PlaylistPage onTrackSelect={handleTrackSelect} />
//             </Layout>
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// function App() {
//   return (
//     <AuthProvider>
//       <AppContent />
//     </AuthProvider>
//   );
// }

// export default App;


// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import './App.css';

// // Carousel Import
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';

// // Layout
// import Layout from './components/layout/Layout';

// // Pages
// import LikedSongsPage from './pages/LikedSongsPage';
// import HomePage from './pages/HomePage';
// import ProfilePage from './pages/ProfilePage';
// import DiscoverPage from './pages/discoverPage';
// import LibraryPage from './pages/libraryPage';
// import LiveStreamsPage from './pages/liveStreamsPage';
// import LoginModal from './components/auth/LoginModal';
// import RegisterModal from './components/auth/RegisterModal';
// import UploadPage from './pages/uploadPage';
// import StreamPlayerPage from './pages/StreamPlayerPage';

// // Components
// import PrivateRoute from './components/auth/PrivateRoute';

// // Context
// import { AuthProvider } from './context/AuthContext';

// function App() {
//   const [currentTrack, setCurrentTrack] = useState(null);

//   const handleTrackSelect = (track) => {
//     setCurrentTrack(track);
//   };

//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           <Route path="/login" element={<LoginModal />} />
//           <Route path="/register" element={<RegisterModal />} />
//           <Route
//             path="/"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <HomePage />
//               </Layout>
//             }
//           />
//           <Route
//             path="/profile/:id"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <ProfilePage />
//               </Layout>
//             }
//           />
//           <Route
//             path="/discover"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <DiscoverPage />
//               </Layout>
//             }
//           />
//           <Route
//             path="/library"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <LibraryPage />
//               </Layout>
//             }
//           />
//           <Route
//             path="/liveStreams"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <LiveStreamsPage />
//               </Layout>
//             }
//           />
//           <Route
//             path="/upload"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <PrivateRoute>
//                   <UploadPage />
//                 </PrivateRoute>
//               </Layout>
//             }
//           />
//           <Route
//             path="/stream/:streamId"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <StreamPlayerPage />
//               </Layout>
//             }
//           />
//           <Route
//             path="/library/liked"
//             element={
//               <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
//                 <LikedSongsPage onTrackSelect={handleTrackSelect} />
//               </Layout>
//             }
//           />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;


// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import './App.css';

// // Layout
// import Layout from './components/layout/Layout';

// // Pages
// import HomePage from './pages/HomePage';
// import ProfilePage from './pages/ProfilePage';
// import DiscoverPage from './pages/discoverPage';
// import LibraryPage from './pages/libraryPage';
// import LiveStreamsPage from './pages/liveStreamsPage';
// import Login from './components/auth/Login';
// import Register from './components/auth/Register';
// import UploadPage from './pages/uploadPage';

// // Context
// import { AuthProvider } from './context/AuthContext';

// // Music Player
// import MusicPlayer from './components/player/MusicPlayer'; // make sure this path matches where you saved it

// function App() {
//   const [currentTrack, setCurrentTrack] = useState(null);

//   const handleTrackSelect = (track) => {
//     setCurrentTrack(track);
//   };

//   return (
//     <AuthProvider> 
//       <Router>
//         <Routes>
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/" element={
//             <Layout onTrackSelect={handleTrackSelect}>
//               <HomePage />
//             </Layout>
//           } />
//           <Route path="/profile/:id" element={
//             <Layout onTrackSelect={handleTrackSelect}>
//               <ProfilePage />
//             </Layout>
//           } />
//           <Route path="/discover" element={
//             <Layout onTrackSelect={handleTrackSelect}>
//               <DiscoverPage />
//             </Layout>
//           } />
//           <Route path="/library" element={
//             <Layout onTrackSelect={handleTrackSelect}>
//               <LibraryPage />
//             </Layout>
//           } />
//           <Route path="/liveStreams" element={
//             <Layout onTrackSelect={handleTrackSelect}>
//               <LiveStreamsPage />
//             </Layout>
//           } />
//           <Route path="/upload" element={
//             <Layout onTrackSelect={handleTrackSelect}>
//               <UploadPage />
//             </Layout>
//           } />
//         </Routes>

//         {/* Music player slides up when a track is selected */}
//         {currentTrack && <MusicPlayer track={currentTrack} />}
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;