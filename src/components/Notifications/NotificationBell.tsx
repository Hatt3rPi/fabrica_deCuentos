import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [bellAnimation, setBellAnimation] = useState(false);

  // Handle click outside to close notification center
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setBellAnimation(true);
      const timeout = setTimeout(() => {
        setBellAnimation(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [unreadCount]);

  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={bellRef}>
      <button
        onClick={toggleNotificationCenter}
        className={`relative p-2 rounded-full hover:bg-purple-100 transition-all duration-300 ${
          bellAnimation ? 'animate-bell' : ''
        }`}
        aria-label="Notificaciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50">
          <NotificationCenter onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

// Add this to your global CSS or in a style tag
const styles = `
@keyframes bellRing {
  0% { transform: rotate(0); }
  10% { transform: rotate(10deg); }
  20% { transform: rotate(-10deg); }
  30% { transform: rotate(8deg); }
  40% { transform: rotate(-8deg); }
  50% { transform: rotate(6deg); }
  60% { transform: rotate(-6deg); }
  70% { transform: rotate(4deg); }
  80% { transform: rotate(-4deg); }
  90% { transform: rotate(2deg); }
  100% { transform: rotate(0); }
}

.animate-bell {
  animation: bellRing 1s ease-in-out;
}
`;

