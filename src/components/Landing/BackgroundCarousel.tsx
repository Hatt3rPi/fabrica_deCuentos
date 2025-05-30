import React, { useState, useEffect, useCallback } from 'react';

interface ThemeType {
  id: string;
  background: string;
  character: string;
  name: string;
  characterImage: string;
  characterDescription: string;
}

interface CarouselState {
  currentIndex: number;
  isTransitioning: boolean;
  currentTheme: ThemeType;
}

export interface BackgroundCarouselProps {
  themes: ThemeType[];
  interval?: number;
  onThemeChange?: (theme: ThemeType) => void;
}

const BackgroundCarousel: React.FC<BackgroundCarouselProps> = ({
  themes,
  interval = 7000, // 7 seconds by default
  onThemeChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Notify parent of theme changes
  useEffect(() => {
    if (onThemeChange && themes[currentIndex]) {
      onThemeChange(themes[currentIndex]);
    }
  }, [currentIndex, onThemeChange, themes]);

  // Preload images
  useEffect(() => {
    themes.forEach(theme => {
      const bgImg = new Image();
      bgImg.src = theme.background;
      
      const charImg = new Image();
      charImg.src = theme.character;
    });
  }, [themes]);

  // Handle the transition to the next image
  const goToNext = useCallback(() => {
    if (themes.length <= 1) return;
    
    setIsTransitioning(true);
    
    // After the transition, update indices
    const transitionTimer = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % themes.length);
      setNextIndex(prev => (prev + 1) % themes.length);
      setIsTransitioning(false);
    }, 1000); // Match this with CSS transition duration
    
    return () => clearTimeout(transitionTimer);
  }, [themes.length]);

  // Set up the auto-advance timer
  useEffect(() => {
    if (themes.length <= 1) return;
    
    const timer = setInterval(() => {
      if (!isTransitioning) {
        goToNext();
      }
    }, interval);
    
    return () => {
      clearInterval(timer);
    };
  }, [goToNext, themes.length, interval, isTransitioning]);

  if (themes.length === 0) return null;
  
  // If there's only one theme, just show it without any transitions
  if (themes.length === 1) {
    return (
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${themes[0].background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      {/* Current Image */}
      <div 
        key={`current-${currentIndex}`}
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${themes[currentIndex].background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          opacity: isTransitioning ? 0 : 1,
          zIndex: 1,
        }}
      />
      
      {/* Next Image */}
      <div 
        key={`next-${nextIndex}`}
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${themes[nextIndex].background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          opacity: isTransitioning ? 1 : 0,
          zIndex: 2,
        }}
      />
    </div>
  );
};

// Export types
export type { CarouselState, ThemeType };

export default React.memo(BackgroundCarousel);
