import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useProfileStore } from '../stores/profileStore';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const { profile, updateProfile } = useProfileStore();

  // Cargar el tema al iniciar
  useEffect(() => {
    // Primero intentar cargar del perfil
    if (profile?.theme_preference) {
      const themeFromProfile = profile.theme_preference as Theme;
      setThemeState(themeFromProfile);
      document.documentElement.classList.toggle('dark', themeFromProfile === 'dark');
      localStorage.setItem('theme', themeFromProfile);
    } else {
      // Si no hay tema en el perfil, cargar del localStorage
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored === 'dark' || stored === 'light') {
        setThemeState(stored);
        document.documentElement.classList.toggle('dark', stored === 'dark');
      }
    }
  }, [profile]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Actualizar en el perfil del usuario si está autenticado
    if (profile) {
      try {
        await updateProfile({ theme_preference: newTheme });
      } catch (error) {
        console.error('Error al actualizar el tema en el perfil:', error);
      }
    }
  }, [profile, updateProfile]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    await setTheme(newTheme);
  }, [theme, setTheme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};

export { ThemeProvider, useTheme };
