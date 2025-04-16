import React from 'react';
import NavigationBar from './Navbar';
import Footer from './Footer';
import MusicPlayer from '../player/MusicPlayer';
import './Layout.css';

const Layout = ({ children, onTrackSelect, currentTrack }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <NavigationBar onTrackSelect={onTrackSelect} />
      <main className="main-content">
        {children}
      </main>
      {currentTrack && <MusicPlayer track={currentTrack} />}
      <Footer />
    </div>
  );
};

export default Layout;

// import React from 'react';
// import NavigationBar from './Navbar';
// import Footer from './Footer';
// import MusicPlayer from '../player/MusicPlayer';

// const Layout = ({ children }) => {
//   return (
//     <div className="d-flex flex-column min-vh-100">
//       <NavigationBar />
//       <main className="flex-grow-1">
//         {children}
//       </main>
//       <MusicPlayer />
//       <Footer />
//     </div>
//   );
// };

// export default Layout;