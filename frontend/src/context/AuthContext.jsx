import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch current user profile
  const fetchProfile = async (accessToken) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(accessToken);
        return userData;
      } else {
        // Token might be expired or invalid
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
    return null;
  };

  // Check token on initial render
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        await fetchProfile(savedToken);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (newToken) => {
    setLoading(true);
    localStorage.setItem('token', newToken);
    const profile = await fetchProfile(newToken);
    setLoading(false);
    return !!profile;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    const activeToken = token || localStorage.getItem('token');
    if (activeToken) {
      await fetchProfile(activeToken);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
