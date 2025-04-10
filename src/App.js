import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import DiscoverPage from './pages/discoverPage';
import LibraryPage from './pages/libraryPage';
import LiveStreamsPage from './pages/liveStreamsPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UploadPage from './pages/uploadPage';

// Auth
import AuthWrapper from './components/auth/AuthWrapper';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider> 
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <AuthWrapper>
              <Layout>
                <HomePage />
              </Layout>
            </AuthWrapper>
          } />

          <Route path="/profile/:id" element={
            <AuthWrapper requireAuth>
              <Layout>
                <ProfilePage />
              </Layout>
            </AuthWrapper>
          } />

          <Route path="/discover" element={
            <AuthWrapper>
              <Layout>
                <DiscoverPage />
              </Layout>
            </AuthWrapper>
          } />

          <Route path="/library" element={
            <AuthWrapper requireAuth>
              <Layout>
                <LibraryPage />
              </Layout>
            </AuthWrapper>
          } />

          <Route path="/liveStreams" element={
            <AuthWrapper requireAuth>
              <Layout>
                <LiveStreamsPage />
              </Layout>
            </AuthWrapper>
          } />

          <Route path="/upload" element={
            <AuthWrapper requireAuth>
              <Layout>
                <UploadPage />
              </Layout>
            </AuthWrapper>
          } />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
