import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch current user profile
  const fetchProfile = async (accessToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
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

  const handleSupabaseSession = async (session) => {
    if (!session || !session.user) return null;
    const { email, id: supabaseUid } = session.user;
    const oauthPassword = `SupabaseOAuth_${supabaseUid}`;
    const baseUrl = import.meta.env.VITE_API_URL || '';

    try {
      // 1. Attempt login to custom backend
      let response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: oauthPassword }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server connection failed');
      }

      let data = await response.json();
      if (response.ok) {
        await login(data.access_token);
        return true;
      }

      // 2. If login fails, register the user first
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: oauthPassword,
          birth_year: 2000 // Default birth year for Gen Z
        }),
      });

      const registerContentType = registerResponse.headers.get('content-type');
      if (!registerContentType || !registerContentType.includes('application/json')) {
        throw new Error('Server connection failed');
      }

      const registerData = await registerResponse.json();
      if (registerResponse.ok) {
        const reloginResponse = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: oauthPassword }),
        });

        const reloginContentType = reloginResponse.headers.get('content-type');
        if (!reloginContentType || !reloginContentType.includes('application/json')) {
          throw new Error('Server connection failed');
        }

        const reloginData = await reloginResponse.json();
        if (reloginResponse.ok) {
          await login(reloginData.access_token);
          return true;
        }
      } else {
        console.error("Failed to register Supabase synced account in backend:", registerData.detail);
      }
    } catch (err) {
      console.error("Error exchanging Supabase session for local JWT:", err);
    }
    return false;
  };

  // Check token and Supabase session on initial render
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        await fetchProfile(savedToken);
      } else {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await handleSupabaseSession(session);
          }
        } catch (err) {
          console.error("Failed to retrieve Supabase session:", err);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen to Supabase auth state changes for real-time synchronization
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const savedToken = localStorage.getItem('token');
        if (!savedToken) {
          setLoading(true);
          await handleSupabaseSession(session);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (newToken) => {
    setLoading(true);
    localStorage.setItem('token', newToken);
    const profile = await fetchProfile(newToken);
    setLoading(false);
    return !!profile;
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Failed to sign out of Supabase:", err);
    }
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
