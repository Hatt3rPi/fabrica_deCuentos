import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, KeyRound, Mail, AlertCircle, Loader } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'token' | 'password'>('email');
  const [resetSuccess, setResetSuccess] = useState(false);
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
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('create_reset_token', {
        user_email: email
      });

      if (error) throw error;

      // Send email with token
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reset-email`, {
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

      setResetStep('token');
    } catch (err) {
      setError('No se pudo procesar la solicitud. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Por favor ingresa el token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('id')
        .eq('token', resetToken)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Token inválido o expirado');
      }

      setResetStep('password');
    } catch (err) {
      setError('Token inválido o expirado');
      
      // Increment attempts
      await supabase.rpc('increment_token_attempts', {
        token_value: resetToken
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!validatePassword(newPassword)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Mark token as used
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', resetToken);

      setResetSuccess(true);
      setTimeout(() => {
        setShowResetForm(false);
        setResetSuccess(false);
        setResetStep('email');
      }, 3000);
    } catch (err) {
      setError('Error al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Contraseña actualizada!</h2>
          <p className="text-gray-600">Serás redirigido al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <LogIn className="w-12 h-12 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          {showResetForm ? 'Recuperar Contraseña' : 'Fábrica de Cuentos'}
        </h2>
        
        {!showResetForm ? (
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

            <button
              type="button"
              onClick={() => setShowResetForm(true)}
              className="w-full text-center text-sm text-purple-600 hover:text-purple-700"
            >
              ¿Olvidaste tu contraseña?
            </button>

            <div className="text-center text-sm text-gray-600">
              <p>Credenciales de prueba:</p>
              <p>Email: test@fabrica.com</p>
              <p>Contraseña: test123</p>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {resetStep === 'email' && (
              <form onSubmit={handleResetRequest} className="space-y-6">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <input
                      id="reset-email"
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

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResetForm(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      'Enviar código'
                    )}
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'token' && (
              <form onSubmit={validateToken} className="space-y-6">
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                    Código de recuperación
                  </label>
                  <input
                    id="token"
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center uppercase"
                    placeholder="XXXX-XXXX"
                    maxLength={8}
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Ingresa el código que enviamos a tu correo electrónico
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResetStep('email')}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      'Verificar código'
                    )}
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'password' && (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
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

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                    <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResetStep('token')}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      'Actualizar contraseña'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;