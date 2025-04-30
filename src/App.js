import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Carousel Import
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import DiscoverPage from './pages/DiscoverPage';
import LibraryPage from './pages/LibraryPage';
import LiveStreamsPage from './pages/LiveStreamsPage';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import UploadPage from './pages/UploadPage';
import StreamPlayerPage from './pages/StreamPlayerPage';
import MixerPage from './pages/MixerPage';

// Components
import PrivateRoute from './components/auth/PrivateRoute';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  const handleTrackSelect = (track) => {
    setCurrentTrack(track);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginModal />} />
          <Route path="/register" element={<RegisterModal />} />
          <Route
            path="/"
            element={
              <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                <ProfilePage />
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
                <LibraryPage />
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
            path="/stream/:streamId"
            element={
              <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                <StreamPlayerPage />
              </Layout>
            }
          />
          <Route
            path="/mixer"
            element={
              <Layout onTrackSelect={handleTrackSelect} currentTrack={currentTrack}>
                <MixerPage />
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


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