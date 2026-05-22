import React from 'react';
import { useAuth } from '../context/AuthContext';
import Auth from './Auth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg text-brand-text">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display text-sm tracking-wide text-brand-text-muted">Verifying your aura credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return children;
}
