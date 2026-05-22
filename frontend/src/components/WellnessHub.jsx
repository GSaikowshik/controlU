import React, { useState, useEffect } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, 
  RefreshCw, Thermometer, MapPin, HeartPulse, Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Suggesions Engine mapping weather condition and local hour to tailored generation tips
const getContextSuggestion = (weatherCode, hour, themeName) => {
  let weatherCondition = 'fair'; // default
  if (weatherCode === 0) {
    weatherCondition = 'clear';
  } else if (weatherCode >= 51) {
    weatherCondition = 'precip'; // rain, snow, drizzle, storms
  }

  let timeOfDay = 'morning';
  if (hour >= 22 || hour < 5) {
    timeOfDay = 'late_night';
  } else if (hour >= 17) {
    timeOfDay = 'evening';
  } else if (hour >= 12) {
    timeOfDay = 'afternoon';
  }

  const millennialSuggestions = {
    precip: {
      morning: 'Gloomy weather drizzle outside. Take a slow morning to breathe, stretch, and sip a warm coffee inside.',
      afternoon: 'Rainy afternoon fatigue. Avoid screen cravings by reading a chapter of a physical book or practicing mindfulness.',
      evening: 'Rainy evening. Light a candle, disconnect from emails, and let your mind center. Wellness starts within.',
      late_night: 'Gloomy late night is high risk. The sound of rain increases comfort scroll cravings. Turn on grayscale mode and sleep.'
    },
    clear: {
      morning: 'Beautiful sunshine! Start your wellness journey with a 10-minute mindful outdoor walk and feel the sun.',
      afternoon: 'Sunny skies outside. Take a screen break, stand up, step outdoors, and breathe fresh air.',
      evening: 'Clear evening sky. Take a moment to stretch on your balcony, reflect on today\'s wins, and calm your thoughts.',
      late_night: 'Quiet starry night. Put down all digital screens, close your eyes, and take 10 deep centering breaths.'
    },
    fair: {
      morning: 'Overcast skies this morning. A perfect opportunity to set your daily intentions without flashing digital noise.',
      afternoon: 'Cloudy afternoon slump. Don\'t reach for quick notification hits. Stand up and do a quick mindful stretch.',
      evening: 'Calm overcast evening. Unwind with a cup of herbal tea and do some light journaling about your progress.',
      late_night: 'Silent cloudy night. High risk for late night doomscrolling. Close all open browser tabs and wind down.'
    }
  };

  const genZSuggestions = {
    precip: {
      morning: 'Gloomy weather outside increases screen slop cravings. Stay alert, do a quick indoor workout, and stay locked in.',
      afternoon: 'Rainy afternoon. Main character energy does not scroll vertical video slop. Go crush a focus block instead.',
      evening: 'Precipitation is heavy. Lock in for a cozy coding, reading, or creative session. Protect your aura streak.',
      late_night: 'Rainy late night is major high risk. Turn on grayscale mode and place the phone across the room. Guard your aura!'
    },
    clear: {
      morning: 'Vibrant sun outside! No cap, go touch some organic grass for 10 minutes to level up your biological aura.',
      afternoon: 'Clear skies. Taking a screen break now is absolute main character energy. Go get some sunlight.',
      evening: 'Sunset is clear. Go look at the sky, relax your neck, and reset your attention span before locking back in.',
      late_night: 'Clear late night. Put the phone on sleep mode. Staying up doomscrolling is major NPC behavior.'
    },
    fair: {
      morning: 'Overcast sky. Lock in your hardest task right now before the distraction cravings start creeping.',
      afternoon: 'Overcast afternoon slump. Don\'t let the gloom tax your day. Switch up your desk space or do a quick stretch.',
      evening: 'Cloudy evening vibes. Review your daily progress, check your aura dashboard, and prepare to lock in tomorrow.',
      late_night: 'Late night is high risk. Put the screen on grayscale, lock down your devices, and sleep like a boss.'
    }
  };

  const genAlphaSuggestions = {
    precip: {
      morning: 'Gloomy weather increases brainrot cravings. Don\'t let the rain turn you into a beta! Start a quick grind session.',
      afternoon: 'Precipitation outside is wild. Fanum tax the distractions before they tax your attention. Sigma mindsets only!',
      evening: 'Rainy evening grind. Initiate your sigma chamber early and level up your skills. Stack those aura points!',
      late_night: 'Late night is maximum high risk! Emergency Aura Save activated: turn off the screen and go to sleep, Sigma!'
    },
    clear: {
      morning: 'Sun is shining, Sigma! Step outside, rizz up the fresh air, and start your morning grind strong.',
      afternoon: 'Mega clear skies outside! Go touch some real grass, hydration check, and recharge your sigma energy.',
      evening: 'Clear sunset. Put down the gaming console, take a stretch, and review your daily aura metrics.',
      late_night: 'Late night. Doomscrolling is pure beta behavior. Put down the device, lock in your sleep schedule, and dominate.'
    },
    fair: {
      morning: 'Overcast sky. Level up your focus early today and show your true sigma energy.',
      afternoon: 'Cloudy afternoon slump. Don\'t let the low energy tax your rizz. Stand up and do 10 jumping jacks.',
      evening: 'Quiet cloudy evening. Take a break from the screens, review your sigma calendar stats, and chill.',
      late_night: 'Silent late night. Put on grayscale mode, charge your devices across the room, and get your sleep gains.'
    }
  };

  const currentSuggestions = 
    themeName === 'millennial' ? millennialSuggestions :
    themeName === 'gen_alpha' ? genAlphaSuggestions :
    genZSuggestions;

  return currentSuggestions[weatherCondition][timeOfDay] || currentSuggestions.fair.afternoon;
};

export default function WellnessHub({ calendarData }) {
  const { theme, vocabulary } = useTheme();
  const { user } = useAuth();
  
  const [coords, setCoords] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState('');
  const [usingDefault, setUsingDefault] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError('Geolocation not supported by browser.');
      setUsingDefault(true);
      fetchWeatherData(40.7128, -74.0060); // Default to New York
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setCoords({ lat, lon });
        setUsingDefault(false);
        fetchWeatherData(lat, lon);
      },
      (err) => {
        console.warn('Geolocation permission denied. Falling back to New York.', err);
        setUsingDefault(true);
        fetchWeatherData(40.7128, -74.0060); // Default to New York
      }
    );
  }, []);

  const fetchWeatherData = async (lat, lon) => {
    setLoadingWeather(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
      );
      if (!response.ok) throw new Error('Failed to retrieve forecast conditions.');
      const data = await response.json();
      setWeather(data.current);
    } catch (err) {
      setWeatherError(err.message);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Maps Open-Meteo codes to dynamic animations and colored weather icons
  const getWeatherInfo = (code) => {
    if (code === undefined || code === null) {
      return { icon: <Cloud className="w-10 h-10 text-brand-primary" />, text: 'Cloudy' };
    }
    if (code === 0) {
      return { icon: <Sun className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />, text: 'Clear Sky' };
    }
    if (code >= 1 && code <= 3) {
      return { icon: <Cloud className="w-10 h-10 text-slate-300" />, text: 'Partly Cloudy' };
    }
    if (code >= 45 && code <= 48) {
      return { icon: <Cloud className="w-10 h-10 text-slate-400" />, text: 'Foggy' };
    }
    if (code >= 51 && code <= 57) {
      return { icon: <CloudRain className="w-10 h-10 text-blue-400" />, text: 'Drizzle' };
    }
    if (code >= 61 && code <= 67) {
      return { icon: <CloudRain className="w-10 h-10 text-blue-500 animate-bounce" />, text: 'Rainy' };
    }
    if (code >= 71 && code <= 77) {
      return { icon: <CloudSnow className="w-10 h-10 text-sky-200" />, text: 'Snowy' };
    }
    if (code >= 80 && code <= 82) {
      return { icon: <CloudRain className="w-10 h-10 text-blue-500" />, text: 'Showers' };
    }
    if (code >= 85 && code <= 86) {
      return { icon: <CloudSnow className="w-10 h-10 text-sky-300" />, text: 'Snow Showers' };
    }
    if (code >= 95 && code <= 99) {
      return { icon: <CloudLightning className="w-10 h-10 text-violet-400 animate-pulse" />, text: 'Thunderstorm' };
    }
    return { icon: <Cloud className="w-10 h-10 text-slate-300" />, text: 'Cloudy' };
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Slice calendar summary to display last 7 days ending today
  const currentDate = new Date();
  const todayNum = currentDate.getDate();
  const startIndex = Math.max(0, todayNum - 7);
  const sevenDays = calendarData?.days?.slice(startIndex, todayNum) || [];

  const weatherInfo = getWeatherInfo(weather?.weather_code);
  const currentHour = currentDate.getHours();
  const suggestionText = getContextSuggestion(weather?.weather_code || 0, currentHour, theme);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 7-DAY HABIT STRIP */}
      <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 card space-y-6">
        <div>
          <h3 className="font-display font-bold text-lg text-brand-text">
            {theme === 'millennial' ? 'Your Wellness Strip' : theme === 'gen_alpha' ? '7-Day Sigma Status' : '7-Day Focus Tracker'}
          </h3>
          <p className="text-xs text-brand-text-muted mt-1">
            {theme === 'millennial' ? 'Tracking your daily mindfulness habits.' : 'Color-coded habit streaks over the last 7 days.'}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap justify-between gap-3 items-center">
          {sevenDays.length === 0 ? (
            <div className="text-center w-full py-4 text-brand-text-muted italic text-xs">
              No calendar summary details loaded.
            </div>
          ) : (
            sevenDays.map((day) => {
              // Color code days: Green (Clean), Amber (Surfed), Red (Reset)
              let colorClass = 'bg-brand-card-border/10 border-brand-card-border/30 text-brand-text-muted/50';
              if (day.status === 'clean') {
                colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
              } else if (day.status === 'surfed') {
                colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold';
              } else if (day.status === 'reset') {
                colorClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold';
              }

              return (
                <div 
                  key={day.date}
                  title={`${day.date}: ${day.status.toUpperCase()} (${day.log_count} urges mapped)`}
                  className="flex-1 min-w-[70px] flex flex-col items-center p-3.5 bg-brand-bg/50 border border-brand-card-border/50 rounded-2xl transition-all hover:scale-105"
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-text-muted font-mono mb-2">
                    {getDayName(day.date)}
                  </span>
                  <div className={`w-11 h-11 rounded-full border flex items-center justify-center text-xs ${colorClass}`}>
                    {new Date(day.date).getDate()}
                  </div>
                  <span className="text-[9px] uppercase font-mono font-extrabold tracking-widest mt-2">
                    {day.status === 'clean' ? 'Clean' : day.status === 'surfed' ? 'Surfed' : 'Reset'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* WEATHER INTEGRATION CARD */}
      <div className="bg-brand-card border border-brand-card-border rounded-3xl p-8 card relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <HeartPulse className="w-32 h-32 text-brand-primary" />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-primary" />
              <span className="text-xs text-brand-text-muted font-bold font-mono">
                {usingDefault ? 'Default Workspace Coordinates (NYC)' : 'Local Geolocation Loaded'}
              </span>
            </div>
            
            {loadingWeather ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-brand-primary animate-spin" />
                <span className="text-sm text-brand-text-muted">Querying weather conditions...</span>
              </div>
            ) : weatherError && !weather ? (
              <p className="text-xs text-rose-400">Failed to load meteorological data.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-brand-bg border border-brand-card-border rounded-2xl shadow-inner">
                  {weatherInfo.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-5 h-5 text-brand-primary shrink-0" />
                    <span className="font-display font-black text-3xl text-brand-text">
                      {weather?.temperature_2m !== undefined ? Math.round(weather.temperature_2m) : '--'}°C
                    </span>
                  </div>
                  <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest font-mono mt-0.5">
                    {weatherInfo.text}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CONTEXT SUGGESTIONS ENGINE TEXT CARD */}
          <div className="md:col-span-7 bg-brand-bg/60 border border-brand-card-border/80 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-brand-primary font-mono">
                {theme === 'millennial' ? 'Contextual Wellness Advice' : theme === 'gen_alpha' ? 'Sigma Context Check' : 'Smart Focus Directive'}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-brand-text/90 italic font-medium">
              "{suggestionText}"
            </p>
            <p className="text-[10px] text-brand-text-muted font-mono">
              Auto-updating based on current weather code ({weather?.weather_code ?? 0}) & hour ({currentHour}:00).
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
