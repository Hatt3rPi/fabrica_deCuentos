import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, KeyRound, Mail, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import BackgroundCarousel, { ThemeType } from '../Landing/BackgroundCarousel';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');
const tokenSchema = z.string().length(8, 'El código debe tener 8 caracteres');

// Define los temas para el carrusel
const loginThemes: ThemeType[] = [
  {
    id: 'forest',
    name: 'Aventura Prehistórica',
    background: '/images/backgrounds/forest-bg.jpg',
    character: 'Dinosaurio Amigable',
    characterImage: '/images/characters/dinosaur-log.png',
    characterDescription: 'Un amigable dinosaurio que te guiará a través de emocionantes aventuras prehistóricas.'
  },
  {
    id: 'castle',
    name: 'Reino de Fantasía',
    background: '/images/backgrounds/castle-bg.png',
    character: 'Castillo Mágico',
    characterImage: '/images/characters/castle-log.png',
    characterDescription: 'Un majestuoso castillo lleno de misterios y aventuras por descubrir.'
  },
  {
    id: 'space',
    name: 'Aventura Espacial',
    background: '/images/backgrounds/space-bg.png',
    character: 'Nave Espacial',
    characterImage: '/images/characters/space-logg.png',
    characterDescription: 'Explora las maravillas del espacio con esta increíble nave espacial.'
  }
];

const LoginForm: React.FC = () => {
  // Mantenemos el estado del tema actual para posibles usos futuros
  const [, setCurrentTheme] = useState<ThemeType>(loginThemes[0]);
  
  const handleThemeChange = useCallback((theme: ThemeType) => {
    setCurrentTheme(theme);
  }, []);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tokenSent, setTokenSent] = useState(false);
  const { signIn, supabase } = useAuth();

  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      setEmailError('');
      return true;
    } catch {
      if (err instanceof z.ZodError) {
        setEmailError(err.errors[0].message);
      }
      return false;
    }
  };

  const validatePassword = (password: string) => {
    try {
      passwordSchema.parse(password);
      setPasswordError('');
      return true;
    } catch {
      if (err instanceof z.ZodError) {
        setPasswordError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      // After successful login, navigate to home page
      navigate('/home');
    } catch {
      setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
      setIsLoading(false);
    }
  };

  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setIsLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase.rpc('create_reset_token', {
        user_email: email
      });

      if (dbError) throw dbError;

      // Send email with token
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reset-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          token: data
        })
      });

      if (!response.ok) {
        throw new Error('Error sending recovery email');
      }

      setTokenSent(true);
    } catch {
      setError('Error al enviar el correo de recuperación. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) return;

    try {
      tokenSchema.parse(recoveryToken);
    } catch {
      setError('El código de recuperación debe tener 8 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.rpc('reset_password', {
        p_token: recoveryToken,
        p_new_password: newPassword
      });

      if (updateError) throw updateError;

      // Reset form and show success message
      setIsRecovering(false);
      setTokenSent(false);
      setRecoveryToken('');
      setNewPassword('');
      setError('');
      alert('Contraseña actualizada correctamente. Por favor, inicia sesión.');
    } catch {
      setError('Error al restablecer la contraseña. Por favor, verifica el código e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRecoveryForm = () => (
    <form onSubmit={tokenSent ? handlePasswordReset : handleRecoveryRequest} className="space-y-6 p-1">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              emailError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
            required
            disabled={tokenSent}
          />
          <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      {tokenSent && (
        <>
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Código de recuperación
            </label>
            <input
              id="token"
              type="text"
              value={recoveryToken}
              onChange={(e) => setRecoveryToken(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-300 bg-white/80 text-amber-900 placeholder-amber-600/60"
              placeholder="XXXXXXXX"
              maxLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  passwordError ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                required
              />
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Procesando...</span>
          </>
        ) : tokenSent ? (
          <span>Restablecer contraseña</span>
        ) : (
          <span>Enviar código de recuperación</span>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setIsRecovering(false);
          setTokenSent(false);
          setError('');
        }}
        className="w-full py-2 px-4 text-amber-700 hover:text-amber-800 flex items-center justify-center gap-2 font-medium hover:bg-amber-100/50 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio de sesión</span>
      </button>
    </form>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              emailError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
            required
          />
          <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-300 bg-white/80 text-amber-900 placeholder-amber-600/60 ${
              passwordError ? 'border-red-300' : 'border-amber-200'
            }`}
            placeholder="••••••••"
            required
          />
          <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        {passwordError && (
          <p className="mt-1 text-sm text-red-600">{passwordError}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsRecovering(true)}
          className="text-sm text-amber-700 hover:text-amber-800 font-medium"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-amber-700 text-white rounded-lg hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Iniciando sesión...</span>
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            <span>Iniciar sesión</span>
          </>
        )}
      </button>
    </form>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-amber-50">
      {/* Fondo con carrusel */}
      <div className="absolute inset-0 z-0">
        <BackgroundCarousel 
          themes={loginThemes} 
          interval={8000}
          onThemeChange={handleThemeChange}
        />
        <div className="absolute inset-0 bg-amber-900/40 backdrop-blur-sm" />
      </div>
      
      {/* Contenido del formulario con apariencia de libro */}
      <div className="relative z-10 w-full max-w-2xl mx-4 my-8">
        <div className="relative">
          {/* Lomo del libro */}
          <div className="absolute -left-2 top-0 h-full w-8 bg-gradient-to-r from-amber-800 to-amber-700 rounded-l-lg shadow-lg border-r-2 border-amber-900/30" />
          
          {/* Página del libro */}
          <div className="relative bg-amber-50/95 backdrop-blur-sm p-8 pl-12 rounded-lg shadow-[8px_8px_20px_rgba(0,0,0,0.2)] border-l-4 border-amber-200 min-h-[500px] flex flex-col">
            {/* Botón de retroceso */}
            <button 
              onClick={() => window.history.back()}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-amber-100 transition-colors text-amber-700"
              aria-label="Volver a la página anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Decoración de esquina */}
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-amber-200 rounded-tr-lg" />
            
            {/* Contenido del formulario */}
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full border-4 border-amber-200 shadow-inner mb-4">
                  <LogIn className="w-10 h-10 text-amber-700" />
                </div>
                <h2 className="text-3xl font-bold text-amber-900 font-serif tracking-wide">
                  {isRecovering ? 'Recuperar contraseña' : 'La CuenterIA'}
                </h2>
                <p className="text-amber-700 mt-2">
                  {isRecovering ? 'Ingresa tus datos para recuperar el acceso' : 'Inicia tu aventura'}
                </p>
              </div>
              
              <div className="flex-1 flex items-center">
                <div className="w-full max-w-md mx-auto">
                  {isRecovering ? renderRecoveryForm() : renderLoginForm()}
                </div>
              </div>
            </div>
            
            {/* Pie de página decorativo */}
            <div className="mt-8 pt-4 border-t border-amber-200 text-center text-amber-600 text-sm">
              <p>© {new Date().getFullYear()} La CuenterIA - Todos los derechos reservados</p>
            </div>
          </div>
          
          {/* Sombra inferior */}
          <div className="absolute -bottom-4 left-4 right-4 h-4 bg-amber-900/20 rounded-b-lg blur-md" />
        </div>
      </div>
    </div>
  );
};

export default LoginForm;