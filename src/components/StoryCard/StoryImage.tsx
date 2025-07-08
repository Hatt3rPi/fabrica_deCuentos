import React from 'react';
import { BookOpen, Loader } from 'lucide-react';

interface StoryImageProps {
  imageUrl: string;
  title: string;
  isLoading: boolean;
  variant?: 'mobile' | 'desktop';
  className?: string;
}

const StoryImage: React.FC<StoryImageProps> = ({
  imageUrl,
  title,
  isLoading,
  variant = 'desktop',
  className = ''
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
        <img 
          src={imageUrl} 
          alt={title} 
          loading="lazy" 
          className={imageClasses}
        />
      ) : (
        <div className={fallbackClasses}>
          <BookOpen className={`text-gray-400 dark:text-gray-600 ${
            isMobile ? 'w-12 h-12' : 'w-10 h-10'
          }`} />
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      )}
    </div>
  );
};

export default StoryImage;