import React from 'react';
import { BookOpen, Pencil, Trash2, FileDown } from 'lucide-react';
import AddToCartButton from '../Cart/AddToCartButton';

interface ActionButtonsProps {
  story: {
    id: string;
    title: string;
    status: 'draft' | 'completed';
  };
  imageUrl: string;
  variant?: 'mobile' | 'desktop';
  onRead: () => void;
  onContinue: () => void;
  onDelete: (e: React.MouseEvent, story: any) => void;
  onDownloadPdf: () => void;
  isPurchased: boolean;
  pdfUrl?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  story,
  imageUrl,
  variant = 'desktop',
  onRead,
  onContinue,
  onDelete,
  onDownloadPdf,
  isPurchased,
  pdfUrl
}) => {
  const isMobile = variant === 'mobile';
  
  if (story.status === 'completed') {
    return (
      <div className="space-y-2">
        {/* Read and Delete buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRead}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
              isMobile 
                ? 'px-3 py-2 bg-white/90 text-green-700 text-xs font-medium hover:bg-white'
                : 'px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white text-sm font-medium hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800'
            }`}
          >
            <BookOpen className={isMobile ? 'w-3 h-3' : 'w-4 h-4 flex-shrink-0'} />
            <span>{isMobile ? 'Leer' : 'Leer cuento'}</span>
          </button>
          
          <button
            onClick={(e) => onDelete(e, story)}
            className={`flex items-center justify-center rounded-lg transition-colors ${
              isMobile 
                ? 'w-8 h-8 text-white/90 hover:text-red-300 hover:bg-white/10'
                : 'w-10 h-10 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800'
            }`}
            aria-label="Eliminar cuento"
          >
            <Trash2 className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        </div>
        
        {/* Purchase/Download button */}
        {isPurchased ? (
          <button
            onClick={onDownloadPdf}
            disabled={!pdfUrl}
            className={`w-full flex items-center justify-center gap-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isMobile 
                ? 'px-3 py-2 bg-white/90 text-purple-700 text-xs font-medium hover:bg-white'
                : 'px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 text-white text-sm font-medium hover:from-purple-600 hover:to-indigo-600 dark:hover:from-purple-700 dark:hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed'
            }`}
          >
            <FileDown className={isMobile ? 'w-3 h-3' : 'w-4 h-4 flex-shrink-0'} />
            <span>{pdfUrl ? 'Descargar PDF' : isMobile ? 'Generando...' : 'Generando PDF...'}</span>
          </button>
        ) : (
          <AddToCartButton
            storyId={story.id}
            storyTitle={story.title}
            storyThumbnail={imageUrl}
            variant="outline"
            size="sm"
            className={isMobile ? 'w-full text-xs py-1.5 bg-white/90 hover:bg-white' : 'w-full'}
          />
        )}
      </div>
    );
  }

  // Draft buttons
  return (
    <div className="flex gap-2">
      <button
        onClick={onContinue}
        className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
          isMobile 
            ? 'px-3 py-2 bg-white/90 text-amber-700 text-xs font-medium hover:bg-white'
            : 'px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white text-sm font-medium hover:from-amber-600 hover:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-gray-800'
        }`}
      >
        <Pencil className={isMobile ? 'w-3 h-3' : 'w-4 h-4 flex-shrink-0'} />
        <span>Continuar</span>
      </button>
      
      <button
        onClick={(e) => onDelete(e, story)}
        className={`flex items-center justify-center rounded-lg transition-colors ${
          isMobile 
            ? 'w-8 h-8 text-white/90 hover:text-red-300 hover:bg-white/10'
            : 'w-10 h-10 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800'
        }`}
        aria-label="Eliminar cuento"
      >
        <Trash2 className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    </div>
  );
};

export default ActionButtons;