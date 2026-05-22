import React, { useState } from 'react';
import { Mail, Lock, Calendar, Sparkles, LogIn, UserPlus, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth({ onAuthSuccess }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to authenticate user.');
        }

        await login(data.access_token);
        if (onAuthSuccess) onAuthSuccess();
      } else {
        // Register flow
        const yearInt = parseInt(birthYear);
        if (isNaN(yearInt) || yearInt < 1900 || yearInt > 2026) {
          throw new Error('Please enter a valid birth year between 1900 and 2026.');
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            birth_year: yearInt 
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to register account.');
        }

        // After successful registration, log them in automatically
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        const loginData = await loginResponse.json();
        if (!loginResponse.ok) {
          throw new Error('Registration succeeded, but auto-login failed. Please log in manually.');
        }

        await login(loginData.access_token);
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black px-4 font-sans">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20 mb-3 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-bold text-4xl tracking-tight text-white mb-2">
            control<span className="text-indigo-400">U</span>
          </h1>
          <p className="text-sm text-slate-400 font-sans">
            Tame the urge, expand your aura.
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl glow-card">
          
          {/* Tab Selector */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl mb-8 border border-slate-800">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                isLogin 
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                !isLogin 
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-200 leading-normal">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pl-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pl-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            {/* Birth Year Field (Register Only) */}
            {!isLogin && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pl-1">
                    Birth Year
                  </label>
                  <span className="text-[10px] text-indigo-400 font-medium">Calculates Generation Tier</span>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="number"
                    required={!isLogin}
                    min="1900"
                    max="2026"
                    placeholder="e.g. 1998"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-2xl py-4 text-sm mt-3 shadow-lg shadow-indigo-500/10 focus:outline-none flex items-center justify-center gap-2 interactive-btn disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Enter Workspace' : 'Initialize Vibe Tier'}</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Text */}
          <div className="text-center mt-6">
            <span className="text-xs text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
            >
              {isLogin ? 'Sign up free' : 'Sign in here'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
