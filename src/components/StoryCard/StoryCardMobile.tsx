import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import StoryImage from './StoryImage';
import StoryPreviewModalMobile from './StoryPreviewModalMobile';

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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(e, story);
    setIsPreviewModalOpen(false);
  };

  return (
    <>
      <div 
        className="md:hidden relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer group"
        onClick={handleCardClick}
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
          
          {/* Hover overlay with buttons - Removed in favor of preview modal */}
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

      {/* Preview Modal */}
      <StoryPreviewModalMobile
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        story={story}
        onRead={onRead}
        onContinue={onContinue}
        onDelete={handleConfirmDelete}
        isPurchased={isPurchased}
      />
    </>
  );
};

export default StoryCardMobile;