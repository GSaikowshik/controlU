import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, LogOut, Flame, ShieldAlert, CheckCircle, 
  XCircle, Clock, Plus, RefreshCw, Award, Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import WellnessHub from './WellnessHub';
import UrgeSurfing from './UrgeSurfing';

export default function Dashboard() {
  const { user, token, logout, refreshUser } = useAuth();
  const { theme, vocabulary } = useTheme();

  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calendarData, setCalendarData] = useState(null);
  const [activeTab, setActiveTab] = useState('focus');
  const [showUrgeSurfing, setShowUrgeSurfing] = useState(false);
  
  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install outcome: ${outcome}`);
    setDeferredPrompt(null);
  };
  
  // Intervention Timer states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timerDuration, setTimerDuration] = useState(60); // 60s default
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(null); // 'success', 'aborted', null
  const [activeLogId, setActiveLogId] = useState(null); // Tracks the ID returned by POST /api/interventions/log
  const timerInterval = useRef(null);

  // Compute current month string (YYYY-MM)
  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const fetchDashboardData = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      if (!activeToken) {
        logout();
        return;
      }

      // 1. Fetch Stats
      const statsRes = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (!statsRes.ok) throw new Error('Failed to load dashboard metrics.');
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch Categories
      const catRes = await fetch('/api/dashboard/categories', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (!catRes.ok) throw new Error('Failed to load urge lists.');
      const catData = await catRes.json();
      setCategories(catData);
      
      if (catData.length > 0 && !selectedCategory) {
        setSelectedCategory(catData[0].id);
      }

      // 3. Fetch Calendar Summary
      const calRes = await fetch(`/api/calendar/summary?month=${currentMonthStr}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (calRes.ok) {
        const calData = await calRes.json();
        setCalendarData(calData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.generation_tier]); // Refetch if tier/user changes

  // Handle countdown logic
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerInterval.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      handleTimerComplete();
    }

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [timerRunning, timeLeft]);

  // Starts the Focus Session & Creates initial log
  const handleStartTimer = async () => {
    if (!selectedCategory) {
      alert('Please create or select an urge category first!');
      return;
    }

    try {
      const activeToken = token || localStorage.getItem('token');
      const response = await fetch('/api/interventions/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ category_id: selectedCategory })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to activate the isolation chamber.');
      }

      const logData = await response.json();
      setActiveLogId(logData.id); // Save the log ID to update on session complete/abort
      
      setTimeLeft(timerDuration);
      setTimerRunning(true);
      setSessionCompleted(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePanicClick = () => {
    if (!selectedCategory) {
      alert('Please create or select an urge category first!');
      return;
    }
    setShowUrgeSurfing(true);
  };

  // User exits early (fails focus session)
  const handleAbortTimer = async () => {
    setTimerRunning(false);
    if (timerInterval.current) clearInterval(timerInterval.current);

    if (!activeLogId) return;
    
    try {
      const activeToken = token || localStorage.getItem('token');
      const response = await fetch(`/api/interventions/log/${activeLogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          duration_seconds: timerDuration - timeLeft,
          completed_full_session: false
        })
      });
      
      if (response.ok) {
        setSessionCompleted('aborted');
        await refreshUser(); // Update Aura globally in header/profile
        await fetchDashboardData(); // Update statistics & calendar
      }
    } catch (err) {
      console.error('Failed to log aborted intervention', err);
    }
  };

  // Countdown naturally completes (succeeds focus session)
  const handleTimerComplete = async () => {
    setTimerRunning(false);
    if (timerInterval.current) clearInterval(timerInterval.current);

    if (!activeLogId) return;
    
    try {
      const activeToken = token || localStorage.getItem('token');
      const response = await fetch(`/api/interventions/log/${activeLogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          duration_seconds: timerDuration,
          completed_full_session: true
        })
      });
      
      if (response.ok) {
        setSessionCompleted('success');
        await refreshUser(); // Update Aura globally in header/profile
        await fetchDashboardData(); // Update statistics & calendar
      }
    } catch (err) {
      console.error('Failed to log completed intervention', err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const activeToken = token || localStorage.getItem('token');
      const res = await fetch('/api/dashboard/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not add urge category.');
      }

      setNewCategoryName('');
      await fetchDashboardData();
      setSelectedCategory(data.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTierMetadata = (tier) => {
    switch (tier) {
      case 'gen_z':
        return {
          title: 'Gen Z / Lock-in Master',
          badge: '🥦 Broccoli Hair Certified',
          accent: 'from-violet-500 to-teal-500',
          textColor: 'text-violet-400',
          emoji: '💀💅🔥'
        };
      case 'gen_alpha':
        return {
          title: 'Gen Alpha / Sigma Rizzler',
          badge: '🚽 Skibidi Sigma Vibe',
          accent: 'from-rose-500 to-amber-500',
          textColor: 'text-rose-400',
          emoji: '👑🧃✈️'
        };
      case 'millennial':
        return {
          title: 'Millennial / Avocado Survivor',
          badge: '🥑 Avocado Toast Toastmaster',
          accent: 'from-emerald-600 to-teal-700',
          textColor: 'text-emerald-700',
          emoji: '☕️💼🧘‍♀️'
        };
      case 'boomer_genx':
        return {
          title: 'Boomer & Gen X / Spacing Expert',
          badge: '📠 Double Space Pioneer',
          accent: 'from-emerald-600 to-teal-700',
          textColor: 'text-emerald-700',
          emoji: '🏌️‍♂️📠✍️'
        };
      default:
        return {
          title: 'Vibe Enthusiast',
          badge: '✨ Pure Aura',
          accent: 'from-indigo-500 to-violet-600',
          textColor: 'text-indigo-400',
          emoji: '🔮'
        };
    }
  };

  const getTabNames = (tier) => {
    switch (tier) {
      case 'millennial':
        return { focus: 'Centering Space', wellness: 'Wellness Hub' };
      case 'gen_alpha':
        return { focus: 'Sigma Chamber', wellness: 'Rizz Central' };
      case 'gen_z':
      default:
        return { focus: 'Aura Locker', wellness: 'Vibe Hub' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg text-brand-text">
        <RefreshCw className="w-12 h-12 text-brand-primary animate-spin mb-4" />
        <p className="font-display text-lg tracking-wide text-brand-text-muted">Loading your Aura Stats...</p>
      </div>
    );
  }

  if (showUrgeSurfing) {
    return (
      <UrgeSurfing
        categoryId={selectedCategory}
        onClose={async (success, secondsLasted) => {
          setShowUrgeSurfing(false);
          setSessionCompleted(success ? 'success' : 'aborted');
          await refreshUser();
          await fetchDashboardData();
        }}
      />
    );
  }

  const userTier = user?.generation_tier || 'gen_z';
  const tierMeta = getTierMetadata(userTier);
  const tabNames = getTabNames(userTier);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans pb-16 transition-colors duration-300">
      
      {/* Top Banner Navigation */}
      <header className="border-b border-brand-card-border bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
              <Sparkles className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-brand-text">
              control<span className="text-brand-primary">U</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-brand-text-muted hidden sm:inline-block border-r border-brand-card-border pr-4 font-mono">
              Authenticated: <span className="text-brand-primary font-bold">{user?.email}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all interactive-btn cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Thematic Workspace Tabs */}
        <div className="flex border-b border-brand-card-border/60 pb-px">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('focus')}
              className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all relative cursor-pointer ${
                activeTab === 'focus'
                  ? 'text-brand-primary font-black animate-pulse'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {tabNames.focus}
              {activeTab === 'focus' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('wellness')}
              className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all relative cursor-pointer ${
                activeTab === 'wellness'
                  ? 'text-brand-primary font-black animate-pulse'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {tabNames.wellness}
              {activeTab === 'wellness' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
              )}
            </button>
          </div>
        </div>

        {activeTab === 'focus' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: User Aura Profile, Roast Card, and Urge Additions */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Glowing Aura Profile Card */}
          <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 glow-card relative overflow-hidden card">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Flame className="w-32 h-32 text-brand-primary" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div>
                <span className={`inline-block px-3.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${tierMeta.accent} text-white shadow-md mb-3`}>
                  {tierMeta.badge}
                </span>
                <h2 className="font-display font-extrabold text-3xl text-brand-text tracking-tight">
                  {tierMeta.title}
                </h2>
                <p className="text-xs text-brand-text-muted font-mono mt-1">
                  GEN VIBE LEVEL: {tierMeta.emoji}
                </p>
              </div>

              {/* Massive Aura Points Metric */}
              <div className="bg-brand-bg/70 border border-brand-card-border/80 rounded-2xl p-6 flex items-center justify-between shadow-inner">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">
                    Aura Points Status
                  </p>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    {theme === 'millennial' ? 'Wellness score accumulating.' : 'Keep streak locked in for multiplier.'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/30">
                    <Flame className="w-6 h-6 text-brand-primary animate-bounce" />
                  </div>
                  <div>
                    <span className="font-display font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                      +{user?.aura_points}
                    </span>
                  </div>
                </div>
              </div>

              {/* Install Prompt Banner */}
              {deferredPrompt && (
                <div className="mt-4 p-5 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex flex-col gap-4 animate-fadeIn">
                  <div className="text-left space-y-1">
                    <p className="text-xs font-bold text-brand-text">
                      {userTier === 'millennial' ? '🧘‍♀️ Bring calm to your screen' : userTier === 'gen_alpha' ? '👑 Unlock Sigma Locker' : '🥦 Install Aura Locker'}
                    </p>
                    <p className="text-[10px] text-brand-text-muted leading-relaxed">
                      {userTier === 'millennial' 
                        ? 'Add Wellness Companion to your home screen for quick, offline centering.' 
                        : userTier === 'gen_alpha' 
                        ? 'Add Get Sigma to access your focus chamber instantly without lag.' 
                        : 'Cache the Urge Surfing tools and log urges instantly on the go.'}
                    </p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold py-2.5 rounded-xl transition-all interactive-btn cursor-pointer"
                  >
                    {userTier === 'millennial' && "🧘‍♀️ Install Wellness Companion"}
                    {userTier === 'gen_z' && "🥦 Install Aura Locker App"}
                    {userTier === 'gen_alpha' && "👑 Get Sigma App"}
                    {userTier !== 'millennial' && userTier !== 'gen_z' && userTier !== 'gen_alpha' && "📲 Install controlU App"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Daily Generation Roast & Advice */}
          <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 relative card">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shrink-0">
                <ShieldAlert className="w-6 h-6 text-brand-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="font-display font-bold text-lg text-brand-text">
                  The Urge Roast of the Day
                </h3>
                <p className="text-sm italic text-brand-text/90 bg-brand-bg/60 p-4 border-l-2 border-brand-primary rounded-r-xl leading-relaxed">
                  "{stats?.roast || 'Distractions are transient. Aura is forever.'}"
                </p>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary mt-2">
                    Actionable Focus Advice
                  </h4>
                  <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                    {stats?.advice || 'Close open browser tabs and take a single step forward.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Management Panel */}
          <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 space-y-6 card">
            <h3 className="font-display font-bold text-lg text-brand-text">
              My Urge Categories
            </h3>
            
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Social Media, Sugar Craving"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-brand-bg border border-brand-card-border rounded-2xl px-4 py-3 text-brand-text placeholder-brand-text-muted/50 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
              <button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-2xl px-4 py-3 flex items-center justify-center interactive-btn cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
              {categories.length === 0 ? (
                <p className="text-xs text-brand-text-muted italic">No urge categories created yet. Add one above!</p>
              ) : (
                categories.map(cat => (
                  <span 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                      selectedCategory === cat.id
                        ? 'bg-brand-primary/20 text-brand-primary border-brand-primary'
                        : 'bg-brand-bg text-brand-text-muted border-brand-card-border hover:border-brand-primary/50'
                    }`}
                  >
                    {cat.name}
                  </span>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Intervention Timer, Habits Calendar & Recent History */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* INTERACTIVE INTERVENTION TIMER CARD */}
          <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 space-y-8 relative overflow-hidden card">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-brand-text">
                  Urge Intervention Locker
                </h3>
                <p className="text-xs text-brand-text-muted mt-1">
                  {vocabulary.lockerSubtitle}
                </p>
              </div>
              <div className="px-3 py-1 bg-brand-bg border border-brand-card-border rounded-xl text-[10px] text-brand-primary font-mono font-bold uppercase">
                {vocabulary.streakLabel}
              </div>
            </div>

            {!timerRunning && (
              <div className="space-y-6 animate-fadeIn">
                {/* Configuration Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted block pl-1">
                      Distracting Urge
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-card-border rounded-2xl p-4 text-brand-text text-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value="" disabled>-- Select Urge --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Timer Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted block pl-1">
                      Focus Duration
                    </label>
                    <select
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                      className="w-full bg-brand-bg border border-brand-card-border rounded-2xl p-4 text-brand-text text-sm focus:outline-none focus:border-brand-primary font-mono"
                    >
                      <option value="10">10 Seconds (Developer Quick Test!)</option>
                      <option value="30">30 Seconds (Fast Mode)</option>
                      <option value="60">1 Minute (Standard Quick)</option>
                      <option value="300">5 Minutes (Deep Breath)</option>
                      <option value="600">10 Minutes (Standard Lock-in)</option>
                      <option value="1200">20 Minutes (Sigma Mode)</option>
                    </select>
                  </div>
                </div>

                {/* Status alerts of previous runs */}
                {sessionCompleted === 'success' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 animate-bounce">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-200">
                      {vocabulary.successToast}
                    </p>
                  </div>
                )}

                {sessionCompleted === 'aborted' && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-200">
                      {vocabulary.failureToast}
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePanicClick}
                  className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 interactive-btn cursor-pointer"
                >
                  <Flame className="w-5 h-5" />
                  <span>{vocabulary.panicButton}</span>
                </button>
              </div>
            )}

            {timerRunning && (
              <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-pulse">
                
                {/* Massive Animated Visual Timer */}
                <div className="relative flex items-center justify-center">
                  {/* Outer spinning borders */}
                  <div className="w-48 h-48 rounded-full border-4 border-brand-card-border border-t-brand-primary animate-spin absolute" />
                  
                  {/* Central digit timer */}
                  <div className="w-40 h-40 rounded-full bg-brand-bg flex flex-col items-center justify-center border border-brand-card-border">
                    <span className="font-display font-black text-4xl text-brand-text tracking-wider font-mono">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-brand-accent font-bold mt-1 font-mono">
                      {vocabulary.timerActive}
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-sm">
                  <p className="text-sm font-medium text-brand-text">
                    Aura points are accumulating in real-time.
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    Isolating from: <span className="text-brand-primary font-bold font-mono">
                      {categories.find(c => c.id === selectedCategory)?.name || 'Distraction'}
                    </span>
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md bg-brand-bg h-2 rounded-full overflow-hidden border border-brand-card-border">
                  <div 
                    className="bg-brand-primary h-full transition-all duration-1000"
                    style={{ width: `${((timerDuration - timeLeft) / timerDuration) * 100}%` }}
                  />
                </div>

                <button
                  onClick={handleAbortTimer}
                  className="px-6 py-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all interactive-btn cursor-pointer"
                >
                  Give in to the urge (Forfeit Aura Points)
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Calendar Grid */}
          <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 card space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-primary" />
                <h3 className="font-display font-bold text-lg text-brand-text">
                  {theme === 'millennial' ? 'Mindfulness Habits' : theme === 'gen_alpha' ? 'Sigma Aura Grid' : 'Habits Calendar Grid'}
                </h3>
              </div>
              <span className="text-xs text-brand-text-muted font-mono">{currentMonthStr}</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarData?.days?.map((day) => {
                const dayIndex = parseInt(day.date.split('-')[2], 10);
                let statusColor = 'bg-brand-card-border/10 border-brand-card-border/30 text-brand-text-muted/40';
                if (day.status === 'surfed') {
                  statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
                } else if (day.status === 'reset') {
                  statusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold';
                }
                
                return (
                  <div 
                    key={day.date} 
                    title={`${day.date}: ${day.status.toUpperCase()} (${day.log_count} sessions)`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border text-xs font-semibold ${statusColor} hover:scale-105 transition-all cursor-help`}
                  >
                    {dayIndex}
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-brand-text-muted font-mono pt-2 border-t border-brand-card-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-brand-card-border/10 border border-brand-card-border/30" />
                <span>Clean</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
                <span>{theme === 'millennial' ? 'Mindful' : 'Surfed'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/40" />
                <span>{theme === 'millennial' ? 'Interrupted' : 'Cooked'}</span>
              </div>
            </div>
          </div>

          {/* RECENT INTERVENTION LOGS */}
          <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 space-y-6 card">
            <h3 className="font-display font-bold text-lg text-brand-text">
              Recent Intervention Logs
            </h3>

            <div className="divide-y divide-brand-card-border/60 max-h-[300px] overflow-y-auto pr-2 space-y-3">
              {(!stats?.recent_logs || stats.recent_logs.length === 0) ? (
                <div className="text-center py-6 text-brand-text-muted italic text-sm">
                  Aura clean slate! No intervention logs yet. Lock in a session to register data.
                </div>
              ) : (
                stats.recent_logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between pt-3 first:pt-0">
                    <div className="flex items-center gap-3">
                      {log.completed_full_session ? (
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                          <XCircle className="w-4 h-4 text-rose-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-brand-text">
                          Resisted: <span className="text-brand-primary font-bold font-mono">{log.category_name}</span>
                        </p>
                        <p className="text-[10px] text-brand-text-muted mt-0.5">
                          {new Date(log.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xs font-bold ${log.completed_full_session ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.completed_full_session ? 'COMPLETED' : 'ABORTED'}
                      </p>
                      <p className="text-[10px] text-brand-text-muted font-mono mt-0.5">
                        Duration: {log.duration_seconds}s
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
        </div>
      ) : (
        <div className="animate-fadeIn">
          <WellnessHub calendarData={calendarData} />
        </div>
      )}
      </main>
    </div>
  );
}
