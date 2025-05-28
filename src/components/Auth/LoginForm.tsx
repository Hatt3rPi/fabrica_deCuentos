import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, KeyRound, Mail, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');
const tokenSchema = z.string().length(8, 'El código debe tener 8 caracteres');

const LoginForm: React.FC = () => {
  console.log('El componente LoginForm está funcionando correctamente');
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      setError('Error al restablecer la contraseña. Por favor, verifica el código e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRecoveryForm = () => (
    <form onSubmit={tokenSent ? handlePasswordReset : handleRecoveryRequest} className="space-y-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
        className="w-full py-2 px-4 text-purple-600 hover:text-purple-700 flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio de sesión</span>
      </button>
    </form>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsRecovering(true)}
          className="text-sm text-purple-600 hover:text-purple-700"
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
        className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <LogIn className="w-12 h-12 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          {isRecovering ? 'Recuperar contraseña' : 'La CuenterIA'}
        </h2>
        
        {isRecovering ? renderRecoveryForm() : renderLoginForm()}
      </div>
    </div>
  );
};

export default LoginForm;