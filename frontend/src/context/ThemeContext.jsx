import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

const VOCABULARIES = {
  millennial: {
    panicButton: 'Take a Breath',
    streakLabel: 'Wellness Journey',
    greeting: 'Welcome to your wellness space.',
    statsHeading: 'Your Progress Journal',
    timerActive: 'Centering your mind...',
    timerCompleted: 'Session Complete. Namaste.',
    timerAborted: 'Mindfulness interrupted.',
    lockerSubtitle: 'Commit to a period of mindfulness.',
    actionButton: 'Begin Centering Session',
    successToast: 'Mindfulness achieved. Namaste.',
    failureToast: 'Wellness journey paused.'
  },
  gen_z: {
    panicButton: 'Lock In',
    streakLabel: 'Aura Streak',
    greeting: 'Main character energy only.',
    statsHeading: 'Aura Points Board',
    timerActive: 'ISOLATING AURA...',
    timerCompleted: 'Session cleared! +50 Aura Points.',
    timerAborted: 'Streak broken! Cooked.',
    lockerSubtitle: 'Isolate from brainrot. Do not forfeit.',
    actionButton: 'Lock In Now',
    successToast: 'Locked in. +50 Aura Points stacked.',
    failureToast: 'Cooked. Distraction took 500 aura points.'
  },
  gen_alpha: {
    panicButton: 'Emergency Aura Save',
    streakLabel: 'Sigma Mindset',
    greeting: 'Time to grind, Sigma!',
    statsHeading: 'Sigma Board',
    timerActive: 'SIGMA GRIND IN PROGRESS...',
    timerCompleted: 'Sigma status loaded!',
    timerAborted: 'No rizz! Lost aura.',
    lockerSubtitle: 'Initiate ultimate sigma isolation chamber.',
    actionButton: 'Initiate Sigma Chamber',
    successToast: 'Sigma status unlocked. Rizz verified.',
    failureToast: 'Beta status! Lost 500 aura points.'
  }
};

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState('gen_z'); // Neutral default

  useEffect(() => {
    let activeTheme = 'gen_z';

    if (user && user.generation_tier) {
      const tier = user.generation_tier;
      if (tier === 'boomer_genx') {
        activeTheme = 'millennial';
      } else if (tier === 'millennial' || tier === 'gen_z' || tier === 'gen_alpha') {
        activeTheme = tier;
      }
    }

    setTheme(activeTheme);

    // Apply the class to the document root element
    document.documentElement.className = `theme-${activeTheme}`;
  }, [user]);

  const vocabulary = VOCABULARIES[theme] || VOCABULARIES.gen_z;

  const value = {
    theme,
    vocabulary
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
