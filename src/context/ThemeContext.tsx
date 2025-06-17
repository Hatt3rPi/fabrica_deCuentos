import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProfileStore } from '../stores/profileStore';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { profile, updateTheme } = useProfileStore();
  const [theme, setThemeState] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from multiple sources with priority order:
  // 1. Profile preference (from database)
  // 2. localStorage (backup)
  // 3. System preference
  // 4. Default to light
  useEffect(() => {
    const initializeTheme = () => {
      let initialTheme: Theme = 'light';

      // Check profile preference first
      if (profile?.theme_preference) {
        initialTheme = profile.theme_preference as Theme;
      } else {
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('theme_preference');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          initialTheme = savedTheme as Theme;
        } else {
          // Fallback to system preference
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            initialTheme = 'dark';
          }
        }
      }

      setThemeState(initialTheme);
      applyTheme(initialTheme);
      setIsInitialized(true);
    };

    initializeTheme();
  }, [profile]);

  // Apply theme to document and save to localStorage
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Always save to localStorage as backup
    localStorage.setItem('theme_preference', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Update profile store (which will sync to database)
    updateTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (!isInitialized) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-change if no explicit preference is set
      if (!profile?.theme_preference && !localStorage.getItem('theme_preference')) {
        const systemTheme = e.matches ? 'dark' : 'light';
        setThemeState(systemTheme);
        applyTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isInitialized, profile]);

  // Prevent flash of incorrect theme by not rendering until initialized
  if (!isInitialized) {
    return null;
  }

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};