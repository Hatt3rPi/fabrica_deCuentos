import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onEscape: () => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  onPrevious,
  onNext,
  onEscape,
  enabled = true
}: UseKeyboardNavigationProps) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'ArrowLeft':
        onPrevious();
        break;
      case 'ArrowRight':
        onNext();
        break;
      case 'Escape':
        onEscape();
        break;
    }
  }, [onPrevious, onNext, onEscape, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, enabled]);
};