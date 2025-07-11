import React from 'react';
import { Pencil, Trash2, Eye, FileText } from 'lucide-react';
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
      <div className={isMobile ? "flex w-full justify-between px-1" : "flex flex-wrap gap-2"}>
        {/* Continue/Edit button/badge */}
        <button
          onClick={onContinue}
          className={`flex items-center justify-center rounded-full transition-all ${
            isMobile 
              ? 'w-10 h-10 rounded-full bg-amber-600/90 text-white flex items-center justify-center shadow-md hover:bg-amber-500 hover:scale-105 transition-all'
              : 'w-10 h-10 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center justify-center shadow-sm transition-colors'
          }`}
          aria-label="Editar/Continuar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        
        {/* Read button/badge */}
        <button
          onClick={onRead}
          className={`flex items-center justify-center rounded-full transition-all ${
            isMobile 
              ? 'w-10 h-10 rounded-full bg-green-600/90 text-white flex items-center justify-center shadow-md hover:bg-green-500 hover:scale-105 transition-all'
              : 'w-10 h-10 rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center shadow-sm transition-colors'
          }`}
          aria-label="Leer cuento"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {/* PDF Download button/badge */}
        <button
          onClick={onDownloadPdf}
          disabled={!pdfUrl}
          className={`flex items-center justify-center rounded-full transition-all ${
            isMobile 
              ? 'w-10 h-10 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-md hover:bg-purple-500 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100'
              : 'w-10 h-10 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center justify-center shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
          aria-label={isMobile ? (pdfUrl ? "Descargar PDF" : "Generando PDF...") : undefined}
        >
          <FileText className="w-4 h-4" />
        </button>
        
        {/* Delete button/badge */}
        <button
          onClick={(e) => onDelete(e, story)}
          className={`flex items-center justify-center rounded-full transition-all ${
            isMobile 
              ? 'w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md hover:bg-red-500 hover:scale-105 transition-all'
              : 'w-10 h-10 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center shadow-sm transition-colors ml-auto'
          }`}
          aria-label="Eliminar cuento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        {!isPurchased && !isMobile && (
          <AddToCartButton
            storyId={story.id}
            storyTitle={story.title}
            storyThumbnail={imageUrl}
            variant="outline"
            size="sm"
            className="w-full"
          />
        )}
      </div>
    );
  }

  // Draft buttons
  return (
    <div className={isMobile ? "flex gap-3 justify-center items-center py-2" : "flex gap-2"}>
      <button
        onClick={onContinue}
        className={`flex items-center justify-center rounded-full transition-all ${
          isMobile 
            ? 'w-10 h-10 bg-amber-600/90 text-white hover:bg-amber-500 shadow-lg hover:shadow-xl hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'
            : 'flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium hover:from-blue-600 hover:to-indigo-600 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
        aria-label="Continuar escribiendo"
      >
        <Pencil className={isMobile ? 'w-5 h-5' : 'w-4 h-4 flex-shrink-0'} />
        {!isMobile && <span className="ml-2">Continuar</span>}
      </button>
      
      <button
        onClick={(e) => onDelete(e, story)}
        className={`flex items-center justify-center rounded-full transition-all ${
          isMobile 
            ? 'w-10 h-10 bg-red-600/90 text-white hover:bg-red-500 shadow-lg hover:shadow-xl hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            : 'w-10 h-10 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
        }`}
        aria-label="Eliminar borrador"
      >
        <Trash2 className={isMobile ? 'w-5 h-5' : 'w-5 h-5'} />
      </button>
    </div>
  );
};

export default ActionButtons;