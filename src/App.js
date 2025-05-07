import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
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
import PrivateRoute from './components/auth/PrivateRoute';

function AppContent() {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState([]);

  const handleTrackSelect = useCallback((track, playlist = []) => {
    setCurrentTrack(track);
    setCurrentPlaylist(playlist);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginModal />} />
        <Route path="/register" element={<RegisterModal />} />
        <Route
          path="/"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <ProfilePage />
            </Layout>
          }
        />
        <Route
          path="/discover"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <DiscoverPage />
            </Layout>
          }
        />
        <Route
          path="/library"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <LibraryPage userId={user?.id} />
            </Layout>
          }
        />
        <Route
          path="/liveStreams"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <LiveStreamsPage />
            </Layout>
          }
        />
        <Route
          path="/upload"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <PrivateRoute>
                <UploadPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/stream/:streamId"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <StreamPlayerPage />
            </Layout>
          }
        />
        <Route
          path="/library/liked"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <LikedSongsPage onTrackSelect={handleTrackSelect} />
            </Layout>
          }
        />
        <Route
          path="/playlist/:id"
          element={
            <Layout
              onTrackSelect={handleTrackSelect}
              currentTrack={currentTrack}
              currentPlaylist={currentPlaylist}
            >
              <PlaylistPage onTrackSelect={handleTrackSelect} />
            </Layout>
          }
        />
      </Routes>
    </Router>
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