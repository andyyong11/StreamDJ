import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import MusicPlayer from '../player/MusicPlayer';

const Layout = ({
  children,
  onTrackSelect,
  currentTrack,
  currentPlaylist,
  openLoginModal,
  openRegisterModal,
}) => {
  return (
    <div className="d-flex min-vh-100" style={{ width: '100vw', position: 'relative' }}>
      {/* Sidebar */}
      <div className="sidebar-wrapper" style={{ position: 'sticky', top: '0', height: '100vh' }}>
        <Sidebar />
      </div>

      <div className="flex-grow-1 d-flex flex-column" style={{ overflowX: 'hidden' }}>
        {/* Topbar */}
        <div style={{ position: 'sticky', top: '0', zIndex: '1050' }}>
          <Topbar openLoginModal={openLoginModal} openRegisterModal={openRegisterModal} />
        </div>

        {/* Main Content */}
        <main className="flex-grow-1 p-3" style={{ overflowX: 'hidden' }}>
          {children}
        </main>

        {/* Music Player */}
        {currentTrack && (
          <MusicPlayer track={currentTrack} currentPlaylist={currentPlaylist} onTrackSelect={onTrackSelect} />
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;


// import React from 'react';
// import NavigationBar from './Navbar';
// import Footer from './Footer';
// import MusicPlayer from '../player/MusicPlayer';

// const Layout = ({ children, onTrackSelect, currentTrack }) => {
//   return (
//     <div className="d-flex flex-column min-vh-100">
//       <NavigationBar onTrackSelect={onTrackSelect} />
//       <main className="flex-grow-1">
//         {children}
//       </main>
//       {currentTrack && <MusicPlayer track={currentTrack} />}
//       <Footer />
//     </div>
//   );
// };

// export default Layout;