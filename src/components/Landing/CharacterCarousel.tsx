import React, { useMemo, useState, useEffect } from 'react';
import { ThemeType } from './BackgroundCarousel';
import { motion, AnimatePresence } from 'framer-motion';

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    description: string;
    image: string;
    theme: string;
  };
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => (
  <div 
    className="relative max-w-md p-8 text-center md:text-left bg-amber-50/90 backdrop-blur-sm shadow-xl transform rotate-1 transition-all duration-300 hover:rotate-0 hover:shadow-2xl" 
    style={{
      background: 'linear-gradient(to bottom right, #fef3c7, #fffbeb)',
      clipPath: 'polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderTop: '1px solid rgba(255, 255, 255, 0.5)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.5)'
    }}
  >
    <div 
      className="absolute bottom-0 right-0 w-12 h-12 bg-amber-200/30" 
      style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}
    />
    
    <h3 
      className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-amber-900 mb-3 sm:mb-4 relative pb-2"
      style={{
        borderBottom: '2px solid #d97706',
        display: 'inline-block',
        fontSize: 'clamp(1.25rem, 5vw, 1.875rem)'
      }}
    >
      {character.name}
    </h3>
    <p className="text-sm sm:text-base text-amber-900/90 leading-relaxed font-serif">
      {character.description}
    </p>
    
    <div className="absolute -bottom-4 -right-4 w-16 h-16 opacity-20">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
          stroke="#92400e" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

export interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  theme: string;
}

interface CharacterCarouselProps {
  characters: Character[];
  currentTheme: ThemeType;
}

const CharacterCarousel: React.FC<CharacterCarouselProps> = ({
  characters,
  currentTheme
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Find the current character based on the theme
  const currentCharacter = useMemo(() => {
    return characters.find(char => char.id === currentTheme.id) || characters[0];
  }, [characters, currentTheme.id]);
  
  useEffect(() => {
    // Set animating state when character changes
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [currentTheme.id]);
  
  if (!currentCharacter) return null;


  // For single character, show without animations
  if (characters.length <= 1) {
    return (
      <div className="relative w-full max-w-5xl mx-auto">
        <div className="relative min-h-[32rem] flex items-center justify-center">
          <div className="w-full">
            <CharacterCard character={{
              ...currentCharacter,
              theme: currentTheme.name
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto px-3 sm:px-6">
      <div className="relative flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8">
        {/* Character Image */}
        <div className="w-full md:w-1/2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`character-${currentCharacter.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: {
                  duration: 0.7,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              exit={{ 
                opacity: 0, 
                x: 20,
                transition: {
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1]
                }
              }}
              className="relative w-full h-[280px] sm:h-[350px] md:h-[500px] flex items-center justify-center -mt-6 sm:mt-0"
            >
              <motion.img 
                src={currentCharacter.image} 
                alt={currentCharacter.name}
                className="h-full w-full object-contain object-center"
                loading="lazy"
                style={{
                  filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3))',
                  transform: 'translateZ(0)',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                whileHover={{ 
                  scale: 1.03,
                  transition: { type: 'spring', stiffness: 300, damping: 15 }
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Book-style Text Box */}
        <div className="w-full md:w-1/2 relative">
          <div className="relative bg-amber-50 p-6 sm:p-8 md:p-10 rounded-lg shadow-xl transform md:rotate-1 hover:md:rotate-0 transition-transform duration-300 -mt-4 sm:mt-0"
               style={{
                 background: 'linear-gradient(145deg, #fff8e1, #ffecb3)',
                 boxShadow: '8px 8px 16px #d5c9a1, -8px -8px 16px #ffffe5',
                 border: '1px solid rgba(0,0,0,0.1)',
                 borderTop: '1px solid rgba(255,255,255,0.5)',
                 borderLeft: '1px solid rgba(255,255,255,0.5)'
               }}>
            {/* Book fold effect */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-200/50 to-transparent"></div>
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-amber-300/30 to-transparent"></div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.2, duration: 0.6 }
              }}
              className="relative z-10"
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900 mb-3 sm:mb-4 pb-2 border-b border-amber-200">
                {currentCharacter.name}
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-amber-900/90 leading-relaxed font-serif mb-4 sm:mb-6">
                {currentCharacter.description}
              </p>
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-amber-200">
                <button className="w-full sm:w-auto px-5 py-2 sm:px-6 sm:py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base">
                  Crear una historia
                </button>
              </div>
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 opacity-10">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Visual indicator dots */}
      <div className="flex justify-center gap-3 mt-12">
        {characters.map((char) => (
          <button
            key={char.id}
            className={`h-2 rounded-full transition-all duration-300 ${
              char.id === currentTheme.id
                ? 'bg-amber-500 w-10 shadow-[0_0_15px_rgba(245,158,11,0.6)]' 
                : 'bg-amber-200/50 w-6 hover:bg-amber-300/70'
            }`}
            aria-label={`Ver ${char.name}`}
            onClick={() => {
              // Find the index of the character and trigger theme change
              const index = characters.findIndex(c => c.id === char.id);
              if (index >= 0) {
                // This would be handled by the parent component
                // You might want to add an onCharacterChange prop
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacterCarousel;
