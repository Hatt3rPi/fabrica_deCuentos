import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import StoryImage from './StoryImage';
import { Trash2, X } from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface StoryCardMobileProps {
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
  isPurchased: boolean;
}

const StoryCardMobile: React.FC<StoryCardMobileProps> = ({
  story,
  imageUrl,
  isLoading,
  onRead,
  onContinue,
  onDelete,
  isPurchased
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleteModalOpen) {
      onDelete(e, story);
      setIsDeleteModalOpen(false);
    } else {
      setIsDeleteModalOpen(true);
    }
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
    <>
      <div 
        className="md:hidden relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer group"
        onClick={story.status === 'completed' ? onRead : onContinue}
      >
        {/* Background image */}
        <div className="relative w-full h-full">
          <StoryImage
            imageUrl={imageUrl}
            title={story.title}
            isLoading={isLoading}
            variant="mobile"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            showTitleOverlay={false}
          />
          
          {/* Hover overlay with buttons */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 space-y-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                story.status === 'completed' ? onRead() : onContinue();
              }}
              className="w-3/4 px-4 py-2 bg-white/90 text-gray-800 rounded-lg font-medium hover:bg-white transition-colors duration-200"
            >
              {story.status === 'completed' ? 'Leer' : 'Continuar'}
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(e);
              }}
              className="w-3/4 px-4 py-2 bg-red-500/90 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
        
        {/* Status badge */}
        <div className="absolute top-2 left-2 z-10">
          <StatusBadge
            status={story.status}
            isPurchased={isPurchased}
            variant="mobile"
          />
        </div>
        
        {/* Title at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <h3 className="text-white font-medium text-sm line-clamp-1">
            {story.title || <span className="italic">Sin título</span>}
          </h3>
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
    </>
  );
};

export default StoryCardMobile;