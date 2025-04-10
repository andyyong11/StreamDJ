import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AuthWrapper = ({ children, requireAuth = false }) => {
  const { token, user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading...</p>
      </div>
    );
  }

  // If auth is required and user is not authenticated, redirect to login
  if (requireAuth && !token) {
    return <Navigate to="/login" />;
  }

  // Render the children components
  return children;
};

export default AuthWrapper; 