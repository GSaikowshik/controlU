import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Heart, Sparkles, AlertCircle, XCircle } from 'lucide-react';

export default function UrgeSurfing({ categoryId, onClose }) {
  const { token } = useAuth();
  const { theme } = useTheme();

  const [timeLeft, setTimeLeft] = useState(60);
  const [logId, setLogId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const countdownInterval = useRef(null);
  const activeLogIdRef = useRef(null);

  // Initialize the session instantly when mounted
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const activeToken = token || localStorage.getItem('token');
        if (!activeToken) {
          setError('User is unauthenticated. Cannot start intervention.');
          setLoading(false);
          return;
        }

        const baseUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${baseUrl}/api/interventions/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ category_id: categoryId })
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok) {
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Could not start Urge Surfing session.');
          } else {
            throw new Error('Server connection failed');
          }
        }

        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server connection failed');
        }

        const data = await response.json();
        setLogId(data.id);
        activeLogIdRef.current = data.id;
        setLoading(false);
        startTimer();
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initializeSession();

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [categoryId, token]);

  const startTimer = () => {
    countdownInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          handleSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Triggers API when the 60s timer hits zero
  const handleSuccess = async () => {
    const activeToken = token || localStorage.getItem('token');
    const logIdToUse = activeLogIdRef.current;
    if (!logIdToUse) {
      onClose(true, 60);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/interventions/log/${logIdToUse}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          duration_seconds: 60,
          completed_full_session: true
        })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to log successful exercise completion');
        } else {
          throw new Error('Server connection failed');
        }
      }
    } catch (err) {
      console.error('Failed to log successful exercise completion', err);
    } finally {
      onClose(true, 60);
    }
  };

  // Exit hatch: user stops early
  const handleStopEarly = async () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    const elapsed = 60 - timeLeft;
    const activeToken = token || localStorage.getItem('token');
    const logIdToUse = activeLogIdRef.current;

    if (!logIdToUse) {
      onClose(false, elapsed);
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/interventions/log/${logIdToUse}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          duration_seconds: elapsed,
          completed_full_session: false
        })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to log aborted exercise session');
        } else {
          throw new Error('Server connection failed');
        }
      }
    } catch (err) {
      console.error('Failed to log aborted exercise session', err);
    } finally {
      onClose(false, elapsed);
    }
  };

  // Breathing 19s cycle calculation: 4s Breathe In, 7s Hold, 8s Exhale
  const elapsed = 60 - timeLeft;
  const cycleTime = elapsed % 19;

  let phase = 'in'; // 'in', 'hold', 'out'
  let instruction = 'Breathe In';
  let subInstruction = '';
  let scale = 1.0;

  if (cycleTime < 4) {
    phase = 'in';
    instruction = 'Breathe In';
    scale = 1.0 + (cycleTime / 4) * 0.8; // scales 1.0 -> 1.8

    if (theme === 'millennial') {
      subInstruction = 'Fill your lungs mindfully with calm energies.';
    } else if (theme === 'gen_alpha') {
      subInstruction = 'Sigma mindset loading... Breathe deep!';
    } else {
      subInstruction = 'Inhale pure aura. Lock in your focus.';
    }
  } else if (cycleTime < 11) {
    phase = 'hold';
    instruction = 'Hold';
    // subtle heartbeat scale pulse during hold
    const pulseFactor = Math.sin((cycleTime - 4) * Math.PI * 2) * 0.05;
    scale = 1.8 + pulseFactor; // scales stays around 1.8

    if (theme === 'millennial') {
      subInstruction = 'Hold the space. Stay perfectly in the moment.';
    } else if (theme === 'gen_alpha') {
      subInstruction = 'Hold that rizz, Sigma. Keep the grind alive!';
    } else {
      subInstruction = 'Hold the streak. Main character composure.';
    }
  } else {
    phase = 'out';
    instruction = 'Exhale';
    scale = 1.8 - ((cycleTime - 11) / 8) * 0.8; // scales 1.8 -> 1.0

    if (theme === 'millennial') {
      subInstruction = 'Slowly let go of all physical tension.';
    } else if (theme === 'gen_alpha') {
      subInstruction = 'Beta thoughts discarded! Leveling up...';
    } else {
      subInstruction = 'Reject digital slop. Flush the distractions.';
    }
  }

  // Define themed styling parameters
  let mainBg = 'bg-[#f5f7f5] text-[#2f3e37]';
  let accentColor = '#5c7a6e';
  let buttonStyle = 'bg-[#5c7a6e] hover:bg-[#486056] text-white';
  let outlineStyle = 'border-[#5c7a6e]/30 text-[#5c7a6e] hover:bg-[#5c7a6e]/10';

  if (theme === 'gen_z') {
    mainBg = 'bg-[#09090b] text-[#f4f4f5]';
    accentColor = '#8b5cf6';
    buttonStyle = 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white';
    outlineStyle = 'border-[#8b5cf6]/30 text-[#8b5cf6] hover:bg-[#8b5cf6]/10';
  } else if (theme === 'gen_alpha') {
    mainBg = 'bg-[#0b0f19] text-white';
    accentColor = '#f43f5e';
    buttonStyle = 'bg-[#f43f5e] hover:bg-[#e11d48] text-white';
    outlineStyle = 'border-[#f43f5e]/50 text-[#f43f5e] hover:bg-[#f43f5e]/15';
  }

  if (loading) {
    return (
      <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center ${mainBg}`}>
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 animate-pulse mx-auto" style={{ color: accentColor }} />
          <h2 className="font-display font-black text-2xl tracking-wide uppercase">Initializing Chamber...</h2>
          <p className="text-xs opacity-60 font-mono">Securing authentication parameters</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 ${mainBg}`}>
        <div className="max-w-md text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="font-display font-bold text-2xl">Intervention Failure</h2>
          <p className="text-sm opacity-80 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">{error}</p>
          <button onClick={() => onClose(false, 0)} className={`px-6 py-3 rounded-2xl font-bold cursor-pointer ${buttonStyle}`}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col justify-between items-center p-8 select-none overflow-hidden ${mainBg}`}>
      
      {/* Top Banner with Countdown */}
      <div className="w-full max-w-xl flex items-center justify-between z-10 pt-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 animate-pulse" style={{ color: accentColor }} />
          <span className="font-mono text-xs uppercase tracking-widest font-extrabold opacity-70">
            {theme === 'millennial' ? 'Mindfulness Sanctuary' : theme === 'gen_alpha' ? 'Sigma Grindroom' : 'Cybernetic Locker'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold opacity-60">Timer Remaining:</span>
          <div className="px-5 py-2.5 rounded-2xl border font-mono font-black text-xl tracking-wider shadow-inner" style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}10` }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Main Breathing Exercise Workspace */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-16 max-w-lg text-center relative w-full">
        
        {/* Dynamic Syncing Visualizer Shape */}
        <div className="relative flex items-center justify-center w-80 h-80">
          
          {/* Glowing Aura Outer Rings */}
          <div 
            className="absolute rounded-full opacity-10 transition-all duration-1000"
            style={{ 
              width: `${scale * 160}px`, 
              height: `${scale * 160}px`, 
              backgroundColor: accentColor,
              filter: 'blur(30px)'
            }} 
          />
          <div 
            className="absolute rounded-full opacity-20 transition-all duration-700"
            style={{ 
              width: `${scale * 140}px`, 
              height: `${scale * 140}px`, 
              border: `2px dashed ${accentColor}`
            }} 
          />

          {/* Central Tier-specific Morphing Geometric Shape */}
          <div 
            className="flex items-center justify-center shadow-2xl transition-all duration-700 select-none cursor-pointer"
            style={{ 
              width: `${scale * 100}px`, 
              height: `${scale * 100}px`, 
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              borderRadius: theme === 'millennial' ? '50%' : theme === 'gen_alpha' ? '30%' : '0%', // Circle vs Bouncy RoundRect vs Cyber Hexagon/Square
              background: `linear-gradient(135deg, ${accentColor}, ${theme === 'gen_alpha' ? '#eab308' : theme === 'gen_z' ? '#14b8a6' : '#a3b899'})`
            }}
          >
            {/* Center Core */}
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/80 animate-ping" />
            </div>
          </div>
        </div>

        {/* Breathing Prompts */}
        <div className="space-y-4 z-10">
          <h1 className="font-display font-black text-5xl sm:text-6xl uppercase tracking-wider transition-all duration-300">
            {instruction}
          </h1>
          <p className="text-sm font-medium tracking-wide max-w-sm mx-auto min-h-[40px] px-4 opacity-80 leading-relaxed">
            "{subInstruction}"
          </p>
        </div>

        {/* Linear progress bar */}
        <div className="w-full max-w-xs bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden border" style={{ borderColor: `${accentColor}20` }}>
          <div 
            className="h-full transition-all duration-1000"
            style={{ 
              width: `${(timeLeft / 60) * 100}%`,
              backgroundColor: accentColor
            }}
          />
        </div>
      </div>

      {/* Exit Hatch Button Footer */}
      <div className="w-full max-w-xs z-10 pb-4">
        <button
          onClick={handleStopEarly}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl border font-bold text-sm tracking-wider uppercase shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 ${outlineStyle}`}
        >
          <XCircle className="w-5 h-5" />
          <span>Stop Exercise</span>
        </button>
      </div>

    </div>
  );
}
