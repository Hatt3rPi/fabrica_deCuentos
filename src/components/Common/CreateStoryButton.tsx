import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CreateStoryButton: React.FC = () => {
  const { supabase, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleNewStory = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { data: story, error } = await supabase
        .from('stories')
        .insert({ 
          user_id: user?.id, 
          status: 'draft', 
          title: 'Nuevo cuento',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Pequeña pausa para la animación
      await new Promise(resolve => setTimeout(resolve, 300));
      
      navigate(`/wizard/${story.id}`);
    } catch (err) {
      console.error('Error creating story:', err);
      // Mostrar algún feedback de error al usuario
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 md:right-6 md:bottom-6">
      {/* Botón flotante */}
      <motion.button
        onClick={handleNewStory}
        className={`relative flex items-center justify-center px-6 h-12 rounded-full text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 active:from-purple-800 active:to-blue-700 md:text-base md:px-8 md:h-14'
        }`}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        whileFocus={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        aria-label="Nuevo cuento"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <motion.div 
            className="flex items-center gap-2"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg font-medium">+</span>
            <span className="font-medium">nuevo cuento</span>
          </motion.div>
        )}
        
        {/* Efecto de pulso cuando no está cargando */}
        {!isLoading && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeOut' 
            }}
          />
        )}
      </motion.button>
    </div>
  );
};

export default CreateStoryButton;
