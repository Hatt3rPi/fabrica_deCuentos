import React from 'react';
import StatusBadge from './StatusBadge';
import StoryImage from './StoryImage';
import ActionButtons from './ActionButtons';

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
  onDownloadPdf: () => void;
  isPurchased: boolean;
  pdfUrl?: string;
}

const StoryCardMobile: React.FC<StoryCardMobileProps> = ({
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
    <div className="md:hidden relative h-64 bg-gray-100 dark:bg-gray-800">
      {/* Background image */}
      <StoryImage
        imageUrl={imageUrl}
        title={story.title}
        isLoading={isLoading}
        variant="mobile"
        className="w-full h-full"
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      
      {/* Content overlay */}
      <div className="relative h-full flex flex-col p-4">
        {/* Status badges in top right */}
        <div className="flex justify-end">
          <StatusBadge
            status={story.status}
            isPurchased={isPurchased}
            variant="mobile"
          />
        </div>
        
        {/* Title and actions at bottom */}
        <div className="mt-auto space-y-3">
          <h3 className="text-lg font-bold text-white line-clamp-2">
            {story.title || <span className="italic">Sin título</span>}
          </h3>
          
          <ActionButtons
            story={story}
            imageUrl={imageUrl}
            variant="mobile"
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

export default StoryCardMobile;