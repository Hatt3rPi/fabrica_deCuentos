import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { getLoaderMessages, Etapa } from '../../../config/loaderMessages';

export interface OverlayLoaderProps {
  etapa: Etapa;
  context?: Record<string, string>;
  /** Mensajes personalizados para mostrar. Reemplaza a los configurados por etapa */
  messages?: string[];
  timeoutMs?: number;
  onTimeout?: () => void;
  onCancel?: () => void;
  /** Callback que se ejecuta cuando se supera el tiempo límite absoluto */
  onFallback?: () => void;
  /** Tiempo en milisegundos para activar onFallback. Por defecto 60s */
  fallbackDelayMs?: number;
  progress?: { current: number; total: number };
}

const MESSAGE_INTERVAL = 7000;
const DEFAULT_TIMEOUT = 300000; // 5 minutos
const DEFAULT_FALLBACK_DELAY = 360000; // 6 minutos

const OverlayLoader: React.FC<OverlayLoaderProps> = ({
  etapa,
  context = {},
  messages,
  timeoutMs = DEFAULT_TIMEOUT,
  onTimeout,
  onCancel,
  onFallback,
  fallbackDelayMs = DEFAULT_FALLBACK_DELAY,
  progress,
}) => {
  const [index, setIndex] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);

  const computedMessages = messages && messages.length > 0
    ? messages
    : getLoaderMessages(etapa, context);

  useEffect(() => {
    if (computedMessages.length <= 1) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % computedMessages.length);
    }, MESSAGE_INTERVAL);
    return () => clearInterval(id);
  }, [computedMessages]);

  useEffect(() => {
    const id = setTimeout(() => {
      setIsTimeout(true);
      onTimeout && onTimeout();
    }, timeoutMs);
    return () => clearTimeout(id);
  }, [timeoutMs, onTimeout]);

  useEffect(() => {
    if (!onFallback) return;
    const id = setTimeout(() => {
      onFallback();
    }, fallbackDelayMs);
    return () => clearTimeout(id);
  }, [onFallback, fallbackDelayMs]);

  const message = isTimeout
    ? 'Esto está tardando más de lo esperado...'
    : computedMessages[index] || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" aria-live="polite" role="alert">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center space-y-6 focus:outline-none border border-gray-100">
        {/* 1. Spinner animado */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"></div>
            <Loader className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
        </div>

        {/* 2. Mensaje del loader personalizado */}
        <div className="space-y-1">
          <p className="text-lg font-medium text-purple-700 leading-tight" data-testid="loader-message">
            {message}
          </p>
        </div>

        {/* 3. "Estamos preparando tu cuento..." */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-800">
            Estamos preparando tu cuento...
          </h3>
        </div>

        {/* 4. "Algunas páginas aún están en proceso..." */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            Algunas páginas aún están en proceso. Podrás continuar cuando todas estén listas.
          </p>
        </div>

        {/* 5. Barra de progreso mejorada */}
        {progress && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Progreso</span>
              <span className="font-semibold text-purple-600">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}% completado
            </p>
          </div>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 text-sm text-purple-600 hover:text-purple-700 underline focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default OverlayLoader;
