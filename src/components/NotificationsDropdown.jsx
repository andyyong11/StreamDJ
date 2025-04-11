import React, { useState, useEffect } from 'react';
import { NavDropdown, Badge, Button } from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  
  const NOTIFICATIONS_PER_PAGE = 5;

  useEffect(() => {
    // Fetch notifications from your API
    // This is just a placeholder
    const fetchNotifications = async () => {
      try {
        // const response = await api.getNotifications();
        // setNotifications(response.data);
        // setHasUnread(response.data.some(notif => !notif.read));
        
        // Mock data for demonstration
        const mockNotifications = [
          { id: 1, read: false, message: "New song by Baby", link: "/songs/123", timestamp: new Date() },
          { id: 2, read: true, message: "Artist you follow posted a new album", link: "/albums/456", timestamp: new Date(Date.now() - 86400000) },
          { id: 3, read: true, message: "Your playlist was liked by DJ Khaled", link: "/playlists/789", timestamp: new Date(Date.now() - 172800000) },
          { id: 4, read: true, message: "New comment on your track", link: "/tracks/101", timestamp: new Date(Date.now() - 259200000) },
          { id: 5, read: true, message: "Weekly recommendations updated", link: "/discover", timestamp: new Date(Date.now() - 345600000) },
          { id: 6, read: true, message: "New follower: Music Producer", link: "/profile/producer", timestamp: new Date(Date.now() - 432000000) },
          { id: 7, read: true, message: "Your track reached 1000 plays", link: "/tracks/202", timestamp: new Date(Date.now() - 518400000) },
          { id: 8, read: true, message: "New live stream starting soon", link: "/livestreams", timestamp: new Date(Date.now() - 604800000) }
        ];
        
        setNotifications(mockNotifications);
        setHasUnread(mockNotifications.some(notif => !notif.read));
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
    
    // Set up polling or websocket connection for real-time updates
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notification, event) => {
    event.preventDefault();
    
    // Mark notification as read
    // await api.markAsRead(notification.id);
    
    // Update local state
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    
    // Navigate to the relevant page
    navigate(notification.link);
  };

  const formatTimestamp = (timestamp) => {
    // Simple time formatting - you might want to use a library like date-fns
    const now = new Date();
    const diff = now - new Date(timestamp);
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const loadMoreNotifications = () => {
    setPage(prevPage => prevPage + 1);
    setShowAllNotifications(true);
  };

  // Calculate how many notifications to show based on current page
  const visibleNotifications = showAllNotifications 
    ? notifications.slice(0, page * NOTIFICATIONS_PER_PAGE) 
    : notifications.slice(0, NOTIFICATIONS_PER_PAGE);
  
  const hasMoreNotifications = notifications.length > visibleNotifications.length;

  return (
    <NavDropdown 
      title={
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <FaBell size={20} />
          {hasUnread && (
            <Badge 
              pill 
              bg="danger" 
              style={{ 
                position: 'absolute', 
                top: -5, 
                right: -5, 
                fontSize: '0.6rem' 
              }}
            >
              •
            </Badge>
          )}
        </div>
      } 
      id="notifications-dropdown"
      align="end"
    >
      <div style={{ width: '300px', maxHeight: '400px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <NavDropdown.Item disabled>No notifications</NavDropdown.Item>
        ) : (
          <>
            {visibleNotifications.map(notification => (
              <NavDropdown.Item 
                key={notification.id}
                onClick={(e) => handleNotificationClick(notification, e)}
                className={notification.read ? '' : 'fw-bold'}
                style={{ 
                  whiteSpace: 'normal',
                  borderBottom: '1px solid #eee',
                  padding: '10px 15px'
                }}
              >
                <div className="d-flex justify-content-between">
                  <div>{notification.message}</div>
                  <small className="text-muted ms-2">
                    {formatTimestamp(notification.timestamp)}
                  </small>
                </div>
              </NavDropdown.Item>
            ))}
            
            {hasMoreNotifications && (
              <div className="text-center p-2">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={loadMoreNotifications}
                  className="text-primary"
                >
                  See more notifications
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </NavDropdown>
  );
};

export default NotificationsDropdown;