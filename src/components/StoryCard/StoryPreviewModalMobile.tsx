import React from 'react';
import { X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import BookCover from '../Common/BookCover';

export interface StoryPreviewModalMobileProps {
  isOpen: boolean;
  onClose: () => void;
  story: {
    id: string;
    title: string;
    created_at: string;
    status: 'draft' | 'completed';
    cover_url: string;
    description?: string;
  };
  onRead: () => void;
  onContinue: () => void;
  onDelete: (e: React.MouseEvent, story: any) => void;
  isPurchased: boolean;
}

const StoryPreviewModalMobile: React.FC<StoryPreviewModalMobileProps> = ({
  isOpen,
  onClose,
  story,
  onRead,
  onContinue,
  onDelete,
  isPurchased,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <Dialog.Panel className="relative w-full max-w-md max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-y-auto">
          {/* Close Button */}
          <div className="sticky top-0 right-0 p-2 flex justify-end z-10 bg-white/80 backdrop-blur-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="p-4">
            {/* Book Cover */}
            {/* Square image container */}
            <div className="relative w-full aspect-square max-w-[180px] mx-auto mb-6">
              {story.status === 'draft' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center">
                  <div className="w-16 h-16 mb-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Lo que tu imaginas</p>
                </div>
              ) : (
                <BookCover 
                  src={story.cover_url} 
                  alt={story.title} 
                  status={story.status}
                  className="w-full h-full object-cover rounded-xl shadow-md"
                />
              )}
            </div>
            
            {/* Story Info */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                  {story.title || 'Sin título'}
                </h2>
                <p className="text-sm text-gray-500 text-center">
                  {new Date(story.created_at).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              
              {story.description && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
                    <p className="text-sm text-gray-600">{story.description || 'No hay descripción disponible para esta historia.'}</p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="pt-2">
                {story.status === 'draft' ? (
                  <div className="space-y-5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContinue();
                        onClose();
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Continuar
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(e, story);
                        onClose();
                      }}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Leer cuento */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRead();
                        onClose();
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Leer
                    </button>

                    {/* Descargar PDF */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add download PDF functionality
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      PDF
                    </button>

                    {/* Comprar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add purchase functionality
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                      Comprar
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(e, story);
                        onClose();
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default StoryPreviewModalMobile;
