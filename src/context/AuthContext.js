import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Helper function to retry API calls with exponential backoff
const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await fetch(url, options);
            
            // If not rate limited, return the response
            if (response.status !== 429) {
                return response;
            }
            
            // If rate limited, wait and retry
            retries++;
            
            // Exponential backoff: 1s, 2s, 4s, etc.
            const delay = Math.pow(2, retries) * 1000;
            console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${retries} of ${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
        } catch (error) {
            // For network errors, also retry
            retries++;
            console.error(`Network error, retrying... (${retries}/${maxRetries})`, error);
            
            // Wait before retry
            const delay = Math.pow(2, retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // If we've exhausted retries, make one final attempt and let the caller handle any errors
    return fetch(url, options);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
    }, []);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };
    
    // Add login with retry
    const loginWithRetry = async (email, password) => {
        const response = await fetchWithRetry(
            'http://localhost:5001/api/auth/login',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            }
        );
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        login(data.user, data.token);
        return data;
    };
    
    // Add register with retry
    const registerWithRetry = async (username, email, password) => {
        const response = await fetchWithRetry(
            'http://localhost:5001/api/auth/register',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            }
        );
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        login(data.user, data.token);
        return data;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout,
            loginWithRetry,
            registerWithRetry
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext; 