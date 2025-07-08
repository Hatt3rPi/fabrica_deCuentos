import React from 'react';
import { CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'draft' | 'completed';
  isPurchased?: boolean;
  variant?: 'mobile' | 'desktop';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  isPurchased = false, 
  variant = 'desktop' 
}) => {
  const isMobile = variant === 'mobile';
  
  const baseClasses = `inline-flex items-center rounded-full text-xs font-medium ${
    isMobile 
      ? 'px-2 py-0.5 border backdrop-blur-sm' 
      : 'px-3 py-1 border backdrop-blur-sm shadow-sm'
  }`;

  const statusBadge = status === 'draft' ? (
    <span className={`${baseClasses} bg-amber-100/90 text-amber-800 border-amber-200 ${
      !isMobile ? 'dark:bg-amber-900/80 dark:text-amber-100 dark:border-amber-800' : ''
    }`}>
      <span className={`bg-amber-500 rounded-full mr-1.5 animate-pulse ${
        isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
      } ${!isMobile ? 'dark:bg-amber-400' : ''}`}></span>
      En progreso
    </span>
  ) : (
    <span className={`${baseClasses} bg-green-100/90 text-green-800 border-green-200 ${
      !isMobile ? 'dark:bg-green-900/80 dark:text-green-100 dark:border-green-800' : ''
    }`}>
      <span className={`bg-green-500 rounded-full mr-1.5 ${
        isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
      } ${!isMobile ? 'dark:bg-green-400' : ''}`}></span>
      Completado
    </span>
  );

  const purchasedBadge = isPurchased && (
    <span className={`${baseClasses} bg-purple-100/90 text-purple-800 border-purple-200 ${
      !isMobile ? 'dark:bg-purple-900/80 dark:text-purple-100 dark:border-purple-800' : ''
    }`}>
      <CheckCircle className={`mr-${isMobile ? '0.5' : '1.5'} ${
        isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'
      }`} />
      Comprado
    </span>
  );

  return (
    <div className={`flex ${isMobile ? 'gap-2' : 'flex-col gap-2 items-end'}`}>
      {statusBadge}
      {purchasedBadge}
    </div>
  );
};

export default StatusBadge;