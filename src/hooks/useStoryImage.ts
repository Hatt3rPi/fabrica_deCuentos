import { useStory } from '../context/StoryContext';

interface StoryImageProps {
  storyId: string;
  coverUrl: string;
}

export const useStoryImage = ({ storyId, coverUrl }: StoryImageProps) => {
  const { covers } = useStory();
  const state = covers[storyId];

  const imageUrl = state?.url || coverUrl;
  const isLoading = state?.status === 'generating';

  return {
    imageUrl,
    isLoading
  };
};