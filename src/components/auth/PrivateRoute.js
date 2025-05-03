import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginModal from './LoginModal';

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(!user);
    
    if (!user) {
        // Show login modal and render a blank page behind it
        return (
            <div className="container py-5">
                <LoginModal 
                    show={showModal} 
                    handleClose={() => {
                        setShowModal(false);
                        // Navigate back to the previous page or home if there's no history
                        navigate(-1, { replace: true });
                    }}
                />
            </div>
        );
    }
    
    return children;
};

export default PrivateRoute; 