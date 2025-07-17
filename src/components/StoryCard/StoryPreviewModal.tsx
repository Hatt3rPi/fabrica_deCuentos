import React from 'react';
import { X } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import BookCover from '../Common/BookCover';

export interface StoryPreviewModalProps {
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
  onDownloadPdf?: () => void;
  onDelete: (e: React.MouseEvent, story: any) => void;
  isPurchased: boolean;
  pdfUrl?: string;
}

const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  isOpen,
  onClose,
  story,
  onRead,
  onContinue,
  onDownloadPdf,
  onDelete,
  isPurchased,
  pdfUrl,
}) => {
  const [showInfoCards, setShowInfoCards] = React.useState(true);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div 
        className="fixed inset-0 bg-black/60" 
        aria-hidden="true" 
        onClick={onClose} 
      />
      <div 
        className="fixed inset-0 flex items-center justify-center p-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <Dialog.Panel className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-blue-50 shadow-2xl overflow-hidden">
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:shadow-lg active:scale-95"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
          
          <div className="p-6 h-full">
            <div className="flex flex-col md:flex-row gap-6 h-full">
              {/* Left Column - Book Cover */}
              <div className="w-full md:w-5/12 lg:w-2/5 relative">
                <div className="relative h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-blue-100/30 rounded-2xl -rotate-1 scale-95 hover:rotate-0 hover:scale-100 transition-all duration-300 ease-in-out"></div>
                  <div className="relative bg-white rounded-2xl p-1 h-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out border border-gray-100 overflow-hidden">
                    {story.status === 'draft' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-center">
                        <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center text-blue-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">¡Tu historia está en progreso!</h3>
                        <p className="text-sm text-gray-600">Lo que tu imaginas</p>
                        <div className="mt-4 w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                      </div>
                    ) : (
                      <BookCover 
                        src={story.cover_url} 
                        alt={story.title} 
                        status={story.status}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Book Info */}
              <div className="w-full md:w-7/12 lg:w-3/5 space-y-4 overflow-y-auto max-h-[calc(90vh-48px)] pr-2 -mr-2 flex flex-col" style={{ minHeight: '400px' }}>
                {/* Title */}
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {story.title}
                  </h2>
                </div>
                
                {/* Description */}
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
                  <p className="text-gray-600 text-sm line-clamp-4">
                    {story.description || 'No hay descripción disponible para esta historia.'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Máximo 4 líneas</p>
                </div>
                
                {/* Info Cards Section */}
                {showInfoCards && (
                  <div className="relative">
                    <button
                      onClick={() => setShowInfoCards(false)}
                      className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
                      aria-label="Ocultar información"
                    >
                      <X className="w-3 h-3 text-gray-600" />
                    </button>
                    <div className="flex w-full gap-3">
                      {/* Character Card */}
                      <div className="w-1/3 bg-purple-50 rounded-xl p-3 border border-purple-100 shadow-sm">
                        <h4 className="text-xs font-medium text-purple-800 mb-2">PERSONAJE</h4>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 overflow-hidden border-2 border-white">
                            <img 
                              src="https://i.picsum.photos/id/64/200/200.jpg?hmac=7lz0Q0KqQqQ0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0Q0" 
                              alt="Personaje"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Karla</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Values Card */}
                      <div className="w-1/3 bg-blue-50 rounded-xl p-3 border border-blue-100 shadow-sm">
                        <h4 className="text-xs font-medium text-blue-800 mb-2">VALORES</h4>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-blue-800">Amistad, Valentía</span>
                        </div>
                      </div>
                      
                      {/* Pages Card */}
                      <div className="w-1/3 bg-green-50 rounded-xl p-3 border border-green-100 shadow-sm">
                        <h4 className="text-xs font-medium text-green-800 mb-2">PÁGINAS</h4>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600">24 páginas</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">~5 min de lectura</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {story.status === 'completed' ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRead();
                          onClose();
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Ver completo
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadPdf?.();
                        }}
                        disabled={!pdfUrl}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Descargar PDF
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to cart logic here
                          console.log('Añadir al carrito', story);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        </svg>
                        Comprar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContinue();
                        onClose();
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors col-span-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Continuar
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onDelete(e, story);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors ${story.status === 'completed' ? '' : 'col-span-2'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default StoryPreviewModal;
