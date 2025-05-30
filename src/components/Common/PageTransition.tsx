import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  const navigate = useNavigate();
  // La ubicación se maneja internamente

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Si hay un onClick personalizado, lo ejecutamos
    if (onClick) {
      onClick();
    }
    
    // Navegamos después de un pequeño retraso para permitir la animación
    setTimeout(() => {
      if (to) {
        navigate(to);
      }
      // Reseteamos el estado después de la navegación
      setTimeout(() => setIsAnimating(false), 500);
    }, 300);
  };

  return (
    <>
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: '#F8F4E9' }} // Color hueso
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
      
      <button 
        onClick={handleClick} 
        className={className}
        disabled={isAnimating}
      >
        {children}
      </button>
    </>
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
