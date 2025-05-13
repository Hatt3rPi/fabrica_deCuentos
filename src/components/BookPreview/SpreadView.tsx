import React from 'react';

interface SpreadViewProps {
  imageUrl: string;
  text: string;
  pageNumber: number;
  onTextChange?: (text: string) => void;
}

const SpreadView: React.FC<SpreadViewProps> = ({ imageUrl, text, pageNumber, onTextChange }) => {
  return (
    <div className="w-full aspect-[2/1] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Spread container - 40cm × 20cm (2:1 aspect ratio) */}
      <div className="flex h-full">
        {/* Left page - Illustration */}
        <div className="w-1/2 h-full relative">
          <img 
            src={imageUrl} 
            alt={`Ilustración página ${pageNumber}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right page - Text */}
        <div className="w-1/2 h-full bg-white p-8">
          {onTextChange ? (
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              className="w-full h-full resize-none border-none focus:ring-0 text-lg"
              placeholder="Escribe el texto de la historia aquí..."
            />
          ) : (
            <div className="w-full h-full text-lg overflow-y-auto">
              {text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpreadView;