import React from 'react';
import StatusBadge from './StatusBadge';
import StoryImage from './StoryImage';
import ActionButtons from './ActionButtons';

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
  return (
    <div className="hidden md:flex flex-col h-full relative group/book hover:z-10 transition-all duration-300 hover:-translate-x-1 bg-amber-50 dark:bg-amber-900/30 bg-[length:100%_24px] bg-repeat" style={{ 
      backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)',
      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.03)'
    }}>
      {/* Efecto de lomo del libro */}
      <div className="absolute -left-1 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-200 dark:from-amber-800 dark:via-amber-900 dark:to-amber-800 rounded-l-lg opacity-0 group-hover/book:opacity-100 transition-all duration-300 group-hover/book:shadow-[-2px_0_5px_rgba(0,0,0,0.1)]" />
      
      {/* Efecto de páginas del libro */}
      <div className="absolute -right-1 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700 opacity-0 group-hover/book:opacity-100 transition-opacity duration-300" />
      <div className="absolute -right-2 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-600 opacity-0 group-hover/book:opacity-100 transition-opacity duration-300 delay-75" />
      <div className="absolute -right-3 top-4 bottom-4 w-0.5 bg-gray-300 dark:bg-gray-500 opacity-0 group-hover/book:opacity-100 transition-opacity duration-300 delay-100" />
      {/* Cover image */}
      <div className="relative h-48 bg-amber-50 dark:bg-amber-900/20 flex-shrink-0 group-hover:shadow-[4px_0_15px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover/book:shadow-lg group-hover/book:border-r-0 group-hover/book:rounded-r-none border-b border-amber-100 dark:border-amber-800/50">
        <StoryImage
          imageUrl={imageUrl}
          title={story.title}
          isLoading={isLoading}
          variant="desktop"
          className="w-full h-full object-cover"
          showTitleOverlay={false}
        />
      </div>
      
      {/* Card content */}
      <div className="flex flex-col flex-1 p-6 group-hover/book:border-r group-hover/book:border-amber-200 dark:group-hover/book:border-amber-800/50 group-hover/book:rounded-r-lg group-hover/book:shadow-[2px_0_8px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden text-amber-900/90 dark:text-amber-50/90">
        {/* Textura de papel sutil */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54 24c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h44c1.1 0 2 .9 2 2v16z\' fill=\'%239C92AC\' fill-opacity=\'0.08\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          backgroundSize: '60px 60px'
        }} />
        
        {/* Efecto de borde de hoja */}
        <div className="absolute inset-0 border border-amber-100 dark:border-amber-800/30 pointer-events-none rounded-br-lg" />
        {/* Status badge top right */}
        <div className="flex justify-end mb-2">
          <StatusBadge
            status={story.status}
            isPurchased={isPurchased}
            variant="desktop"
          />
        </div>
        
        {/* Title and date */}
        <div className="mb-4">
          <h3 className="text-xl font-medium text-amber-900 dark:text-amber-50 line-clamp-2 mb-2 font-serif tracking-tight">
            {story.title || <span className="text-gray-400 italic">Sin título</span>}
          </h3>
          <p className="text-sm text-amber-700/80 dark:text-amber-200/80 italic">
            {new Date(story.created_at).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Actions */}
        <div className="mt-auto pt-2">
          <ActionButtons
            story={story}
            imageUrl={imageUrl}
            variant="desktop"
            onRead={onRead}
            onContinue={onContinue}
            onDelete={onDelete}
            onDownloadPdf={onDownloadPdf}
            isPurchased={isPurchased}
            pdfUrl={pdfUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default StoryCardDesktop;