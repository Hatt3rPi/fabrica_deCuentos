import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, User, SupabaseClient } from '@supabase/supabase-js';
import { sentryLogger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  supabase: SupabaseClient;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      
      // Manejar errores de token corrupto
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('Token refresh failed, clearing session');
        supabase.auth.signOut();
      }
      
      // Configurar contexto de usuario en Sentry
      if (user) {
        sentryLogger.setUserContext({
          id: user.id,
          email: user.email
        });
      } else {
        sentryLogger.clearUserContext();
      }
    });

    // Verificar sesión inicial y limpiar si está corrupta
    supabase.auth.getSession().catch((error) => {
      if (error.message.includes('Invalid Refresh Token')) {
        console.warn('Invalid refresh token detected, clearing session');
        supabase.auth.signOut();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, supabase, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};