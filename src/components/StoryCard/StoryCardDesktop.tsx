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
    <div className="hidden md:block">
      {/* Cover image */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
        <StoryImage
          imageUrl={imageUrl}
          title={story.title}
          isLoading={isLoading}
          variant="desktop"
          className="w-full h-full"
        />
        
        {/* Status badges in top right */}
        <div className="absolute top-3 right-3">
          <StatusBadge
            status={story.status}
            isPurchased={isPurchased}
            variant="desktop"
          />
        </div>
      </div>
      
      {/* Card content */}
      <div className="p-5 flex flex-col min-h-[200px]">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors min-h-[3rem] flex items-center">
            {story.title || <span className="text-gray-400 italic">Sin título</span>}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-auto">
            Creado el {new Date(story.created_at).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Actions */}
        <div className="mt-auto pt-3">
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