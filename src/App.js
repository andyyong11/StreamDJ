import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/homePage';
import PlaylistPage from './pages/playlistPage';
import ProfilePage from './pages/profilePage';
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
        <Route path="/playlist/:id" element={
          <Layout>
            <PlaylistPage />
          </Layout>
        } />
        <Route path="/profile/:id" element={
          <Layout>
            <ProfilePage />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;