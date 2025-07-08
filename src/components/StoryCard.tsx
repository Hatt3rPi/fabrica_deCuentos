import React from 'react';
import { useStoryActions } from '../hooks/useStoryActions';
import { useStoryImage } from '../hooks/useStoryImage';
import StoryCardMobile from './StoryCard/StoryCardMobile';
import StoryCardDesktop from './StoryCard/StoryCardDesktop';

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
  const { imageUrl, isLoading } = useStoryImage({
    storyId: story.id,
    coverUrl: story.cover_url
  });

  const {
    handleContinue,
    handleRead,
    handleDelete,
    handleDownloadPdf,
    purchaseStatus
  } = useStoryActions({
    storyId: story.id,
    onContinue,
    onRead,
    onDelete
  });

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-transparent hover:-translate-y-1">
      <StoryCardMobile
        story={story}
        imageUrl={imageUrl}
        isLoading={isLoading}
        onRead={handleRead}
        onContinue={handleContinue}
        onDelete={handleDelete}
        isPurchased={purchaseStatus.isPurchased}
      />
      
      <StoryCardDesktop
        story={story}
        imageUrl={imageUrl}
        isLoading={isLoading}
        onRead={handleRead}
        onContinue={handleContinue}
        onDelete={handleDelete}
        onDownloadPdf={handleDownloadPdf}
        isPurchased={purchaseStatus.isPurchased}
        pdfUrl={purchaseStatus.pdfUrl}
      />
    </div>
  );
};

export default StoryCard;
