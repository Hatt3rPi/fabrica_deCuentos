import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ShoppingCart, Settings, Info, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import StatusBadge from './StatusBadge';
import StoryImage from './StoryImage';
import StoryPreviewModal from './StoryPreviewModal';

interface StoryCardDesktopProps {
  story: {
    id: string;
    title: string;
    created_at: string;
    status: 'draft' | 'completed';
    cover_url: string;
  };
  imageUrl: string;
  isLoading: boolean;
  onRead: () => void;
  onContinue: () => void;
  onDelete: (e: React.MouseEvent, story: any) => void;
  onDownloadPdf: () => void;
  isPurchased: boolean;
  pdfUrl?: string;
}

const StoryCardDesktop: React.FC<StoryCardDesktopProps> = ({
  story,
  imageUrl,
  isLoading,
  onRead,
  onContinue,
  onDelete,
  onDownloadPdf,
  isPurchased,
  pdfUrl
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
    setIsSettingsOpen(false);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(e, story);
    setIsDeleteModalOpen(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="hidden md:block relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden group">
      {/* Background image */}
      <div className="relative w-full h-full">
        <StoryImage
          imageUrl={imageUrl}
          title={story.title}
          isLoading={isLoading}
          variant="desktop"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          showTitleOverlay={false}
        />
        
        {/* Hover overlay for image */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Status badge */}
      <div className="absolute top-2 left-2">
        <StatusBadge
          status={story.status}
          isPurchased={isPurchased}
          variant="desktop"
        />
      </div>
      
      {/* Settings gear */}
      <div className="absolute top-2 right-2" ref={settingsRef}>
        <button
          onClick={handleSettingsClick}
          className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          aria-label="Configuración"
        >
          <Settings size={18} />
        </button>
        
        {/* Settings dropdown */}
        {isSettingsOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg py-1 z-10">
            <button
              onClick={handleDeleteClick}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        )}
      </div>
      
      {/* Title and date at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 group-hover:bg-gradient-to-t group-hover:from-black/90 group-hover:via-black/80 group-hover:to-transparent">
        <h3 className="text-white font-medium text-lg line-clamp-1 mb-1">
          {story.title || <span className="italic">Sin título</span>}
        </h3>
        <p className="text-white/80 text-sm">
          {new Date(story.created_at).toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}
        </p>
        
        {/* Action Buttons - Only show on hover */}
        <div className="h-0 opacity-0 group-hover:h-8 group-hover:opacity-100 transition-all duration-300 overflow-hidden flex items-center gap-2 mt-2">
          {story.status === 'draft' ? (
            // Only show Ver button for draft stories
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewModalOpen(true);
              }}
              className="w-full px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Vista previa del cuento"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              Ver
            </button>
          ) : (
            // Show all buttons for completed stories
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRead();
                }}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors flex-shrink-0"
                title="Leer cuento"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                Leer
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Add to cart logic here
                }}
                className="ml-auto px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors flex-shrink-0"
                title="Añadir al carrito"
              >
                <ShoppingCart size={14} />
                Comprar
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPreviewModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors flex-shrink-0"
                title="Vista previa"
              >
                <Info size={14} />
                Vista previa
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Confirmar eliminación
              </Dialog.Title>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <Dialog.Description className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar "{story.title}"? Esta acción no se puede deshacer.
            </Dialog.Description>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Story Preview Modal */}
      <StoryPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        story={story}
        onRead={onRead}
        onContinue={onContinue}
        onDelete={onDelete}
        onDownloadPdf={onDownloadPdf}
        isPurchased={isPurchased}
        pdfUrl={pdfUrl}
      />
    </div>
  );
};

export default StoryCardDesktop;