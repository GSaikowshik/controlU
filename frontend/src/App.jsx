import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-slate-100 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display text-sm tracking-wide text-slate-400">Verifying your aura credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    }
    return <Auth onAuthSuccess={() => setShowAuth(false)} />;
  }

  return <Dashboard />;
}

