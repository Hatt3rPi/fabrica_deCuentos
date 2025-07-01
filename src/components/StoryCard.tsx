import React from 'react';
import { BookOpen, Pencil, Trash2, Loader, FileDown, CheckCircle } from 'lucide-react';
import { useStory } from '../context/StoryContext';
import { useStoryPurchaseStatus } from '../hooks/useStoryPurchaseStatus';
import AddToCartButton from './Cart/AddToCartButton';

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    created_at: string;
    status: 'draft' | 'completed';
    cover_url: string;
  };
  onContinue: (id: string) => void;
  onRead: (id: string) => void;
  onDelete: (story: {
    id: string;
    title: string;
    created_at: string;
    status: 'draft' | 'completed';
    cover_url: string;
  }) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onContinue, onRead, onDelete }) => {
  const { covers } = useStory();
  const state = covers[story.id];
  const purchaseStatus = useStoryPurchaseStatus(story.id);

  const imageUrl = state?.url || story.cover_url;
  const isLoading = state?.status === 'generating';
  
  // Función para descargar PDF
  const handleDownloadPdf = () => {
    if (purchaseStatus.pdfUrl) {
      window.open(purchaseStatus.pdfUrl, '_blank');
    }
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-transparent hover:-translate-y-1">
      {/* Efecto de resplandor en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
      
      {/* Imagen de portada */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={story.title} 
            loading="lazy" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
            <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          </div>
        )}
        
        {/* Estado de carga */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <Loader className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
        
        {/* Badge de estado */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {story.status === 'draft' ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100/90 dark:bg-amber-900/80 text-amber-800 dark:text-amber-100 border border-amber-200 dark:border-amber-800 backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mr-1.5 animate-pulse"></span>
              En progreso
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100/90 dark:bg-green-900/80 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-800 backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-1.5"></span>
              Completado
            </span>
          )}
          
          {/* Badge de comprado */}
          {purchaseStatus.isPurchased && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100/90 dark:bg-purple-900/80 text-purple-800 dark:text-purple-100 border border-purple-200 dark:border-purple-800 backdrop-blur-sm shadow-sm">
              <CheckCircle className="w-3 h-3 mr-1.5" />
              Comprado
            </span>
          )}
        </div>
      </div>
      
      {/* Contenido de la tarjeta */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {story.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Creado el {new Date(story.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        {/* Acciones */}
        <div className="space-y-3 mt-4">
          {story.status === 'completed' ? (
            <>
              {/* Fila de botones principales */}
              <div className="flex gap-2">
                <button
                  onClick={() => onRead(story.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>Leer cuento</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(story);
                  }}
                  className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                  aria-label="Eliminar cuento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Botón de agregar al carrito o descargar PDF */}
              {purchaseStatus.isPurchased ? (
                <button
                  onClick={handleDownloadPdf}
                  disabled={!purchaseStatus.pdfUrl}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-indigo-600 dark:hover:from-purple-700 dark:hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {purchaseStatus.pdfUrl ? 'Descargar PDF' : 'Generando PDF...'}
                  </span>
                </button>
              ) : (
                <AddToCartButton
                  storyId={story.id}
                  storyTitle={story.title}
                  storyThumbnail={imageUrl}
                  variant="outline"
                  size="sm"
                  className="w-full"
                />
              )}
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onContinue(story.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 dark:hover:from-amber-700 dark:hover:to-orange-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-gray-800"
              >
                <Pencil className="w-4 h-4 flex-shrink-0" />
                <span>Continuar</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(story);
                }}
                className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                aria-label="Eliminar cuento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
