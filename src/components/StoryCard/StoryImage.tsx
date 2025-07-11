import React from 'react';
import { BookOpen, Loader } from 'lucide-react';

interface StoryImageProps {
  imageUrl: string;
  title: string;
  isLoading: boolean;
  variant?: 'mobile' | 'desktop';
  className?: string;
  showTitleOverlay?: boolean;
}

const StoryImage: React.FC<StoryImageProps> = ({
  imageUrl,
  title,
  isLoading,
  variant = 'desktop',
  className = '',
  showTitleOverlay = false
}) => {
  const isMobile = variant === 'mobile';
  
  const containerClasses = `relative overflow-hidden ${className}`;
  const imageClasses = isMobile 
    ? "w-full h-full object-cover absolute inset-0"
    : "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105";
  
  const fallbackClasses = `w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 ${
    isMobile ? 'absolute inset-0' : ''
  }`;

  return (
    <div className={containerClasses}>
      {imageUrl ? (
        <div className="relative w-full h-full">
          <img 
            src={imageUrl} 
            alt={title} 
            loading="lazy" 
            className={imageClasses}
          />
          {showTitleOverlay && (
            <div className="absolute inset-0 flex justify-center items-start pt-4 sm:pt-6 md:pt-8 px-3 sm:px-6 md:px-8 z-10">
              <div 
                className="relative" 
                style={{ 
                  background: 'rgba(0, 0, 0, 0.1)', 
                  padding: '2rem 3rem', 
                  borderRadius: '2rem', 
                  maxWidth: '85%', 
                  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 40px 0px', 
                  backdropFilter: 'blur(2px)', 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'flex-end' 
                }}
              >
                <div 
                  className="text-center" 
                  style={{ 
                    fontSize: '2rem', 
                    fontFamily: 'Ribeye, cursive', 
                    fontWeight: 'bold', 
                    color: 'rgb(255, 255, 255)', 
                    textShadow: 'rgba(0, 0, 0, 0.8) 3px 3px 6px', 
                    lineHeight: '1.4', 
                    textTransform: 'uppercase', 
                    width: '100%' 
                  }}
                >
                  {title}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={fallbackClasses}>
          <BookOpen className={`text-gray-400 dark:text-gray-600 ${
            isMobile ? 'w-12 h-12' : 'w-10 h-10'
          }`} />
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      )}
    </div>
  );
};

export default StoryImage;