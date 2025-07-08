import { useCallback } from 'react';
import { useStoryPurchaseStatus } from './useStoryPurchaseStatus';

interface StoryActionsProps {
  storyId: string;
  onContinue: (id: string) => void;
  onRead: (id: string) => void;
  onDelete: (story: any) => void;
}

export const useStoryActions = ({
  storyId,
  onContinue,
  onRead,
  onDelete
}: StoryActionsProps) => {
  const purchaseStatus = useStoryPurchaseStatus(storyId);

  const handleContinue = useCallback(() => {
    onContinue(storyId);
  }, [onContinue, storyId]);

  const handleRead = useCallback(() => {
    onRead(storyId);
  }, [onRead, storyId]);

  const handleDelete = useCallback((e: React.MouseEvent, story: any) => {
    e.stopPropagation();
    onDelete(story);
  }, [onDelete]);

  const handleDownloadPdf = useCallback(() => {
    if (purchaseStatus.pdfUrl) {
      window.open(purchaseStatus.pdfUrl, '_blank');
    }
  }, [purchaseStatus.pdfUrl]);

  return {
    handleContinue,
    handleRead,
    handleDelete,
    handleDownloadPdf,
    purchaseStatus
  };
};