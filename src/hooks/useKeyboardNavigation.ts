import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  onEscape: () => void;
  dependencies?: any[];
}

export const useKeyboardNavigation = ({
  onNext,
  onPrev,
  onEscape,
  dependencies = []
}: UseKeyboardNavigationProps): void => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        onPrev();
        break;
      case 'ArrowRight':
        onNext();
        break;
      case 'Escape':
        onEscape();
        break;
    }
  }, [onNext, onPrev, onEscape, ...dependencies]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
};