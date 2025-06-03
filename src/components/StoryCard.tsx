import React from 'react';
import { BookOpen, Pencil, Trash2, Loader } from 'lucide-react';
import { useStory } from '../context/StoryContext';

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
  onDelete: (story: any) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onContinue, onRead, onDelete }) => {
  const { covers } = useStory();
  const state = covers[story.id];

  const imageUrl = state?.url || story.cover_url;
  const isLoading = state?.status === 'generating';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="aspect-video bg-gray-100 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={story.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Loader className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{story.title}</h3>
          {story.status === 'draft' && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Borrador
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {new Date(story.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onRead(story.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Leer</span>
          </button>
          {story.status === 'draft' && (
            <button
              onClick={() => onContinue(story.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span>Continuar</span>
            </button>
          )}
          <button
            onClick={() => onDelete(story)}
            className="flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
