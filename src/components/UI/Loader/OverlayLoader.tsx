import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { getLoaderMessages, Etapa } from '../../../config/loaderMessages';

export interface OverlayLoaderProps {
  etapa: Etapa;
  context?: Record<string, string>;
  timeoutMs?: number;
  onTimeout?: () => void;
  onCancel?: () => void;
  progress?: { current: number; total: number };
}

const MESSAGE_INTERVAL = 7000;
const DEFAULT_TIMEOUT = 40000;

const OverlayLoader: React.FC<OverlayLoaderProps> = ({
  etapa,
  context = {},
  timeoutMs = DEFAULT_TIMEOUT,
  onTimeout,
  onCancel,
  progress,
}) => {
  const [index, setIndex] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);

  const messages = getLoaderMessages(etapa, context);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % messages.length);
    }, MESSAGE_INTERVAL);
    return () => clearInterval(id);
  }, [messages]);

  useEffect(() => {
    const id = setTimeout(() => {
      setIsTimeout(true);
      onTimeout && onTimeout();
    }, timeoutMs);
    return () => clearTimeout(id);
  }, [timeoutMs, onTimeout]);

  const message = isTimeout
    ? 'Esto está tardando más de lo esperado...' // could also fetch from messages
    : messages[index] || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" aria-live="polite" role="alert">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs text-center space-y-4 focus:outline-none">
        <Loader className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
        <p className="text-sm text-purple-700" data-testid="loader-message">{message}</p>
        {progress && (
          <p className="text-xs text-gray-600">{progress.current} / {progress.total}</p>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 text-xs text-purple-600 underline focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

export default OverlayLoader;
