import React from 'react';
import { Sparkles, Flame, ShieldAlert, Calendar, Zap, Play, CheckCircle } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden font-sans relative">
      
      {/* Dynamic Cyberpunk Lighting Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/10 blur-[150px] pointer-events-none" />

      {/* Cyber Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370c_1px,transparent_1px),linear-gradient(to_bottom,#1f29370c_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-white">
              control<span className="text-indigo-400">U</span>
            </span>
          </div>
          
          <button 
            onClick={onGetStarted}
            className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/30 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all hover:scale-105 cursor-pointer"
          >
            Launch Chamber
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Left Column (Copy) */}
          <div className="lg:col-span-7 text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold tracking-widest uppercase">
              <Zap className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              Next-Gen Focus Protocol V1.0
            </div>
            
            <h1 className="font-display font-black text-5xl sm:text-7xl text-white tracking-tight leading-none">
              Tame the urge.<br />
              Stack your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">Aura Points</span>.
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-sans">
              Designed for Millennials, Gen Z, and Gen Alpha. controlU gamifies discipline. 
              Isolate from digital slop, conquer instant gratification through our somatic urge surfing engine, 
              and build an undeniable streak of high-vibe focus.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/30"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300 pointer-events-none" />
                <span className="relative">Unlock Your Chamber</span>
                <Play className="w-4 h-4 fill-white relative group-hover:translate-x-1 transition-transform" />
              </button>
              
              <a 
                href="#features"
                className="px-8 py-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/30 text-slate-300 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Scan Features
              </a>
            </div>

            {/* Quick Trust / Metrics Bar */}
            <div className="pt-6 border-t border-slate-900 flex flex-wrap gap-x-12 gap-y-4 text-left font-mono">
              <div>
                <p className="text-2xl font-black text-white">+50 points</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Per Focus Session</p>
              </div>
              <div>
                <p className="text-2xl font-black text-rose-500">-500 points</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Forfeit Penalty</p>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-400">100%</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">NPC-Free Experience</p>
              </div>
            </div>
          </div>

          {/* Hero Right Column (Cyber Visual Preview) */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0 flex justify-center">
            
            {/* Visual Glassmorphic Mockup */}
            <div className="w-full max-w-sm aspect-[4/5] bg-slate-900/40 border border-slate-800/80 rounded-[32px] p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col justify-between select-none transform hover:rotate-2 hover:scale-[1.02] transition-all duration-500">
              
              {/* Inner Glowing Grid Accent */}
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Flame className="w-40 h-40 text-indigo-500" />
              </div>
              
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase font-mono">Aura Locker Active</span>
                </div>
                <div className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] text-indigo-400 font-mono font-bold">
                  SIGMA MULTIPLIER
                </div>
              </div>

              {/* Central Glowing Visual Core */}
              <div className="my-8 flex flex-col items-center space-y-4">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-full border border-dashed border-indigo-500/30 absolute animate-spin" style={{ animationDuration: '30s' }} />
                  <div className="w-32 h-32 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 absolute animate-spin" style={{ animationDuration: '4s' }} />
                  <div className="w-24 h-24 rounded-full bg-[#030712] border border-slate-800/80 flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-black tracking-wider text-white">09:59</span>
                    <span className="text-[7px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5 font-mono">Surfing Urge</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center font-sans font-medium px-4">
                  "Isolating from distraction. Inhale pure aura. Lock in focus."
                </p>
              </div>

              {/* Aura Status Overlay */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Aura Level</p>
                  <p className="text-xs font-bold text-white mt-0.5">Broccoli Hair Certified 🥦</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Current Status</p>
                  <p className="text-sm font-extrabold text-indigo-400 font-mono">+1,350 AP</p>
                </div>
              </div>
            </div>
            
            {/* Visual Backdrops decoratives */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Value Prop/Features Section */}
      <section id="features" className="relative z-10 border-t border-slate-900 bg-slate-950/40 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-16">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              Defeat Impulse. Regain Sovereignty.
            </h2>
            <p className="text-base text-slate-400 font-sans max-w-2xl mx-auto">
              Our attention spans are being farmed by slot-machine notification algorithms. 
              controlU provides the ultimate chemical intervention protocol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 rounded-3xl p-8 text-left space-y-4 hover:bg-slate-900/50 transition-all duration-300 card">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">The Aura Point Economy</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans">
                Gamify your discipline. Succeeding in a focus block rewards you with massive Aura Points. 
                Failing or forfeiting penalizes you with a heavy aura tax. Keep your high status!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/30 border border-slate-900 hover:border-violet-500/20 rounded-3xl p-8 text-left space-y-4 hover:bg-slate-900/50 transition-all duration-300 card">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Somatic Urge Surfing</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans">
                When a dopamine craving hits, trigger our breathing and surfing module. 
                A guided 60-second somatic focus cycle synchronizes your breath to let the urge peak and fade.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/30 border border-slate-900 hover:border-cyan-500/20 rounded-3xl p-8 text-left space-y-4 hover:bg-slate-900/50 transition-all duration-300 card">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Sigma Habit Calendars</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans">
                A highly-visual, custom grid aggregates your daily focus logs. 
                Keep your month entirely green (Clean/Surfed) and avoid the dreaded red (Streak Reset) nodes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section className="relative z-10 py-20 border-t border-slate-900 overflow-hidden">
        
        {/* Glow backdrop CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono tracking-wider">
            FREE ACCESS & BULLSHIT-FREE SIGNUP
          </div>
          
          <h2 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
            Stop scrolling slop.<br />
            Reclaim your attention.
          </h2>
          
          <p className="text-base text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
            Configure your urge categories, boot your isolation timer, and build your digital aura immediately. No credit cards required.
          </p>

          <button 
            onClick={onGetStarted}
            className="group relative px-10 py-5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
          >
            <span className="relative flex items-center justify-center gap-2 text-base">
              <span>Access Focus Protocols</span>
              <Sparkles className="w-5 h-5" />
            </span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-950 bg-[#02050e] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-500 text-xs font-mono">
          <p>© {new Date().getFullYear()} controlU App. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Somatic Wellness</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Aura Economy</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Main Character Mode</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
