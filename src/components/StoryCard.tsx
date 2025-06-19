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

  const imageUrl = state?.url || story.cover_url;
  const isLoading = state?.status === 'generating';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={story.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-600" />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-800/60">
            <Loader className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{story.title}</h3>
          {story.status === 'draft' ? (
            <span className="px-3 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse"></div>
                En progreso
              </div>
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                Completado
              </div>
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {new Date(story.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-2">
          {story.status === 'completed' ? (
            <button
              onClick={() => onRead(story.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-800 dark:hover:to-emerald-800 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">Leer cuento</span>
            </button>
          ) : (
            <button
              onClick={() => onContinue(story.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 dark:bg-amber-600 text-white rounded-lg hover:bg-amber-600 dark:hover:bg-amber-700 shadow-sm hover:shadow-md transition-all duration-200 border-2 border-amber-400 dark:border-amber-500"
            >
              <Pencil className="w-4 h-4" />
              <span className="font-medium">Continuar editando</span>
            </button>
          )}
          <button
            onClick={() => onDelete(story)}
            className="flex items-center justify-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
