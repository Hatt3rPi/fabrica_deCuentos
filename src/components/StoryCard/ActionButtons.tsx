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
      <div className={isMobile ? "flex gap-2 justify-center" : "space-y-2"}>
        {/* Read button/badge */}
        <button
          onClick={onRead}
          className={`flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
            isMobile 
              ? 'w-8 h-8 bg-green-600/90 text-white hover:bg-green-600 shadow-lg'
              : 'flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white text-sm font-medium hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800'
          }`}
          aria-label={isMobile ? "Leer cuento" : undefined}
        >
          <BookOpen className={isMobile ? 'w-4 h-4' : 'w-4 h-4 flex-shrink-0'} />
          {!isMobile && <span>Leer cuento</span>}
        </button>
        
        {/* Delete button/badge */}
        <button
          onClick={(e) => onDelete(e, story)}
          className={`flex items-center justify-center rounded-lg transition-colors ${
            isMobile 
              ? 'w-8 h-8 bg-red-600/90 text-white hover:bg-red-600 shadow-lg'
              : 'w-10 h-10 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800'
          }`}
          aria-label="Eliminar cuento"
        >
          <Trash2 className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
        </button>
        
        {/* Purchase/Download button/badge */}
        {isPurchased ? (
          <button
            onClick={onDownloadPdf}
            disabled={!pdfUrl}
            className={`flex items-center justify-center gap-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isMobile 
                ? 'w-8 h-8 bg-purple-600/90 text-white hover:bg-purple-600 shadow-lg disabled:bg-gray-600/90'
                : 'w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 text-white text-sm font-medium hover:from-purple-600 hover:to-indigo-600 dark:hover:from-purple-700 dark:hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed'
            }`}
            aria-label={isMobile ? (pdfUrl ? "Descargar PDF" : "Generando PDF...") : undefined}
          >
            <FileDown className={isMobile ? 'w-4 h-4' : 'w-4 h-4 flex-shrink-0'} />
            {!isMobile && <span>{pdfUrl ? 'Descargar PDF' : 'Generando PDF...'}</span>}
          </button>
        ) : (
          !isMobile && (
            <AddToCartButton
              storyId={story.id}
              storyTitle={story.title}
              storyThumbnail={imageUrl}
              variant="outline"
              size="sm"
              className="w-full"
            />
          )
        )}
      </div>
    );
  }

  // Draft buttons
  return (
    <div className={isMobile ? "flex gap-2 justify-center" : "flex gap-2"}>
      <button
        onClick={onContinue}
        className={`flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
          isMobile 
            ? 'w-8 h-8 bg-amber-600/90 text-white hover:bg-amber-600 shadow-lg'
            : 'flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white text-sm font-medium hover:from-amber-600 hover:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-gray-800'
        }`}
        aria-label={isMobile ? "Continuar editando" : undefined}
      >
        <Pencil className={isMobile ? 'w-4 h-4' : 'w-4 h-4 flex-shrink-0'} />
        {!isMobile && <span>Continuar</span>}
      </button>
      
      <button
        onClick={(e) => onDelete(e, story)}
        className={`flex items-center justify-center rounded-lg transition-colors ${
          isMobile 
            ? 'w-8 h-8 bg-red-600/90 text-white hover:bg-red-600 shadow-lg'
            : 'w-10 h-10 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800'
        }`}
        aria-label="Eliminar cuento"
      >
        <Trash2 className={isMobile ? 'w-4 h-4' : 'w-4 h-4'} />
      </button>
    </div>
  );
};

export default ActionButtons;