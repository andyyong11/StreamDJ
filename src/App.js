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

// Auth
import PrivateRoute from './components/auth/PrivateRoute';

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
            <Layout>
              <HomePage />
            </Layout>
          } />
          <Route path="/profile/:id" element={
            <PrivateRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/discover" element={
            <Layout>
              <DiscoverPage />
            </Layout>
          } />
          <Route path="/library" element={
            <PrivateRoute>
              <Layout>
                <LibraryPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/liveStreams" element={
            <PrivateRoute>
              <Layout>
                <LiveStreamsPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/upload" element={
            <Layout>
              <UploadPage />
            </Layout>
        } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;