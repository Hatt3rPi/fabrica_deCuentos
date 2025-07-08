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
    <div className="hidden md:flex flex-col h-full">
      {/* Cover image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
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
      <div className="flex flex-col flex-1 p-4">
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
          <h3 className="text-lg font-medium text-gray-800 dark:text-white line-clamp-2 mb-1">
            {story.title || <span className="text-gray-400 italic">Sin título</span>}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
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