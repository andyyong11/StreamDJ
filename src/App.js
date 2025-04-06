import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/homePage';
import ProfilePage from './pages/profilePage';
import DiscoverPage from './pages/discoverPage';
import LibraryPage from './pages/libraryPage';
import LiveStreamsPage from './pages/liveStreamsPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        <Route path="/profile/:id" element={
          <Layout>
            <ProfilePage />
          </Layout>
        } />
        <Route path="/discover" element={
          <Layout>
            <DiscoverPage />
          </Layout>
        } />
        <Route path="/library" element={
          <Layout>
            <LibraryPage />
          </Layout>
        } />
        <Route path="/liveStreams" element={
          <Layout>
            <LiveStreamsPage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;