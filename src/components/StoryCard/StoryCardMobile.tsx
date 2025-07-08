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

  const handleMouseLeave = () => {
    if (isDeleteModalOpen) {
      setIsDeleteModalOpen(false);
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
        className="md:hidden relative h-64 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer"
        onClick={story.status === 'completed' ? onRead : onContinue}
      >
        {/* Background image */}
        <StoryImage
          imageUrl={imageUrl}
          title={story.title}
          isLoading={isLoading}
          variant="mobile"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          showTitleOverlay={false}
        />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col p-4">
          {/* Status and delete button top bar */}
          <div className="flex justify-between w-full">
            {/* Status badge on the left */}
            <div className="z-10">
              <StatusBadge
                status={story.status}
                isPurchased={isPurchased}
                variant="mobile"
              />
            </div>
            
            {/* Delete button on the right */}
            <button 
              onClick={handleDeleteClick}
              onMouseLeave={handleMouseLeave}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-10
                ${isDeleteModalOpen 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-white/90 hover:bg-white text-gray-700 hover:text-red-500'}
                hover:scale-110`}
              aria-label={isDeleteModalOpen ? 'Confirmar eliminar' : 'Eliminar cuento'}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          
          {/* Title at bottom */}
          <div className="mt-auto">
            <div className="relative overflow-hidden px-3 py-2.5 rounded-b-lg bg-[#f5f2e9] border border-amber-100 shadow-[0_2px_5px_rgba(0,0,0,0.05)]">
              {/* Textura de papel con patrón sutil */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29-22c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM32 63c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm57-13c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-9-21c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e6d9bc' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`
              }} />
              
              <h3 className="relative text-sm font-serif font-medium text-amber-900/90 text-center leading-snug tracking-normal line-clamp-2">
                {story.title || <span className="italic">Sin título</span>}
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent mx-auto mt-2 rounded-full" />
              </h3>
            </div>
          </div>
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