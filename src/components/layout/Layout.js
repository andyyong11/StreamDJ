import React from 'react';
import NavigationBar from './Navbar';
import Footer from './Footer';
import MusicPlayer from '../player/MusicPlayer';

const Layout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <NavigationBar />
      <main className="flex-grow-1">
        {children}
      </main>
      <MusicPlayer />
      <Footer />
    </div>
  );
};

export default Layout;