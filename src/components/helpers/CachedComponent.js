import React, { memo, useEffect, useRef, useState } from 'react';

/**
 * CachedComponent - A wrapper that prevents unnecessary re-renders
 * 
 * This component is designed to reduce rendering frequency for components
 * that can cause performance issues when they update too often, such as 
 * components that make API calls or render complex UIs.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to wrap
 * @param {number} props.cacheMs - Cache lifetime in milliseconds (default: 10000ms)
 * @param {Object} props.dependencies - Dependencies that should trigger a re-render when they change
 * @param {Function} props.onError - Optional error handler that will receive error information
 * @param {boolean} props.bypassCache - Force refresh the component ignoring cache
 */
const CachedComponent = ({ 
  children, 
  cacheMs = 10000, // Increased from 5000ms to 10000ms
  dependencies = {}, 
  onError,
  bypassCache = false
}) => {
  const lastRenderTime = useRef(0);
  const shouldUpdate = useRef(true);
  const [errorInfo, setErrorInfo] = useState(null);
  
  // Force an update when dependencies change or bypassCache is true
  useEffect(() => {
    shouldUpdate.current = true;
  }, [Object.values(dependencies), bypassCache]);
  
  // Determine if we should update based on time passed since last render
  const now = Date.now();
  if (now - lastRenderTime.current > cacheMs) {
    shouldUpdate.current = true;
  }
  
  // Reset error info when we attempt a refresh
  useEffect(() => {
    if (shouldUpdate.current) {
      setErrorInfo(null);
    }
  }, [shouldUpdate.current]);
  
  // If we're updating, record the current time
  if (shouldUpdate.current) {
    lastRenderTime.current = now;
    shouldUpdate.current = false;
  }
  
  // Error boundary and error handling
  const handleError = (error) => {
    if (onError) {
      onError(error);
    }
    setErrorInfo(error);
    console.error('CachedComponent caught error:', error);
  };
  
  // Use React.memo to prevent unnecessary re-renders, wrapped in error handling
  const MemoizedChildren = memo(() => {
    try {
      return children;
    } catch (error) {
      handleError(error);
      return <div>Error loading content</div>;
    }
  });
  
  if (errorInfo) {
    // If we have rate limit errors, display a friendly message
    if (errorInfo.response?.status === 429) {
      return (
        <div className="alert alert-warning my-2">
          <p>Too many requests. Using cached data.</p>
        </div>
      );
    }
    
    // For other errors, show generic message
    return (
      <div className="alert alert-danger my-2">
        <p>Error loading content. Using cached version.</p>
      </div>
    );
  }
  
  return <MemoizedChildren />;
};

export default CachedComponent; 