import React from 'react';

interface BookCoverProps {
  src: string;
  alt: string;
  className?: string;
  status?: 'completed' | 'draft';
  showStatus?: boolean;
}

const BookCover: React.FC<BookCoverProps> = ({
  src,
  alt,
  className = '',
  status = 'completed',
  showStatus = true
}) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <div className="relative group w-full h-full">
        {/* Decorative Elements */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-50/30 to-blue-50/30 dark:from-gray-800/30 dark:to-gray-900/30" />
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-100/40 to-blue-100/40 dark:from-purple-900/20 dark:to-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Main Image Container */}
        <div className="absolute inset-0.5 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/5 dark:from-white/10 dark:to-black/20" />
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/default-book-cover.png';
            }}
          />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
        
        {/* Status Badge */}
        {showStatus && (
          <span 
            className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm shadow-lg ${
              status === 'completed' 
                ? 'bg-gradient-to-r from-green-500/95 to-emerald-500/95 text-white' 
                : 'bg-gradient-to-r from-amber-500/95 to-orange-500/95 text-white'
            } transition-all duration-300 group-hover:shadow-xl group-hover:scale-105`}
          >
            {status === 'completed' ? 'Completado' : 'En progreso'}
          </span>
        )}
      </div>
    </div>
  );
};

export default BookCover;
