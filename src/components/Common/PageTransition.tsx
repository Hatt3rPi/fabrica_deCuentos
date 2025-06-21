import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { useState, useCallback } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  to,
  onClick,
  className = '',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Prevent multiple simultaneous navigations
    if (isAnimating) {
      e.preventDefault();
      return;
    }
    
    // Execute custom onClick if provided
    if (onClick) {
      onClick();
    }
    
    // If no 'to' prop, let default behavior proceed (no navigation)
    if (!to) {
      return;
    }

    // Set animating state briefly to prevent rapid clicks
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, onClick, to]);

  // If there's a 'to' prop, use Link for proper React Router navigation
  if (to) {
    return (
      <Link 
        to={to}
        onClick={handleClick}
        className={className}
      >
        {children}
      </Link>
    );
  }

  // If no 'to' prop, render as button for custom onClick behavior
  return (
    <button 
      onClick={handleClick} 
      className={className}
      disabled={isAnimating}
      type="button"
    >
      {children}
    </button>
  );
};

export const PageTransitionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
