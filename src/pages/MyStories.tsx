import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, BookOpen, PenTool } from 'lucide-react';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { storyService } from '../services/storyService';
import { useNavigate, useLocation } from 'react-router-dom';
import StoryCard from '../components/StoryCard';
import { EstadoFlujo } from '../types';
import { initialFlowState } from '../stores/wizardFlowStore';
import type { WizardStep } from '../context/WizardContext';
import { logger } from '../utils/logger';

interface Story {
  id: string;
  title: string;
  created_at: string;
  status: 'draft' | 'completed';
  cover_url: string;
}

const MyStories: React.FC = () => {
  const { supabase, user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [deleteCharacters, setDeleteCharacters] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadStories();
  }, []);

  // Reload stories when user returns to the page (e.g., from wizard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is now visible, reload stories to get latest data
        loadStories();
      }
    };

    const handleFocus = () => {
      // Window regained focus, reload stories
      loadStories();
    };

    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Listen for window focus (returning from other window)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Reload stories when navigating back to home (e.g., from wizard)
  useEffect(() => {
    // Check if we just navigated to /home (reload to get fresh data)
    if (location.pathname === '/home') {
      loadStories();
    }
  }, [location.pathname]);

  // Optional: Soft polling for real-time updates when page is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startPolling = () => {
      // Poll every 30 seconds when page is visible and focused
      interval = setInterval(() => {
        if (!document.hidden && document.hasFocus()) {
          loadStories();
        }
      }, 30000); // 30 seconds
    };

    startPolling();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ids = (data || []).map((s) => s.id);
      const covers: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: pages } = await supabase
          .from('story_pages')
          .select('story_id,image_url')
          .in('story_id', ids)
          .eq('page_number', 0);
        (pages || []).forEach((p) => {
          covers[p.story_id] = p.image_url;
        });
      }

      setStories(
        (data || []).map((s) => ({ ...s, cover_url: covers[s.id] || '' })) as Story[]
      );
    } catch (error) {
      logger.error('Error loading stories:', error);
    }
  };

  const handleNewStory = async () => {
    logger.debug('Iniciando creación de historia');
    
    try {
      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          status: 'draft',
          title: 'Nuevo cuento',
          wizard_state: initialFlowState
        })
        .select()
        .single();

      if (error) throw error;

      logger.debug('Historia creada, navegando a wizard');
      navigate(`/wizard/${story.id}`);
    } catch (error) {
      logger.error('Error creating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la historia';
      alert('Error al crear la historia: ' + errorMessage);
    }
  };

  const stepFromEstado = (estado: EstadoFlujo): WizardStep => {
    if (estado.personajes.estado !== 'completado') return 'characters';
    if (estado.cuento !== 'completado') return 'story';
    if (estado.diseno !== 'completado') return 'design';
    return 'preview';
  };

  const handleContinueStory = (storyId: string) => {
    (async () => {
      let draft: any = null;
      try {
        draft = await storyService.getStoryDraft(storyId);
      } catch (error) {
        console.error('Error preloading draft:', error);
      }

      const flow: EstadoFlujo =
        draft?.story?.wizard_state || {
          personajes: { estado: 'no_iniciada', personajesAsignados: 0 },
          cuento: 'no_iniciada',
          diseno: 'no_iniciada',
          vistaPrevia: 'no_iniciada'
        };

      const step = stepFromEstado(flow);

      console.log('[Home] wizard_state', { storyId, wizard_state: flow });

      console.log('[Home] continuar', {
        storyId,
        irA: step,
        campos: {
          personajes: draft?.characters?.length || 0,
          cuento: draft?.pages?.length || draft?.generatedPages?.length || 0,
          diseno: draft?.design?.visual_style || null,
          vistaPrevia: draft?.pages?.length ? 'listo' : null
        }
      });

      navigate(`/wizard/${storyId}`);
    })();
  };

  const handleReadStory = (storyId: string) => {
    navigate(`/story/${storyId}/read`);
  };

  const handleDeleteClick = (story: Story) => {
    setStoryToDelete(story);
    setDeleteCharacters(true);
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);
    try {
      if (deleteCharacters) {
        await storyService.deleteStoryWithCharacters(storyToDelete.id);
      } else {
        await storyService.deleteStoryOnly(storyToDelete.id);
      }
      setStories(prev => prev.filter(s => s.id !== storyToDelete.id));
      alert('Cuento eliminado correctamente');
    } catch (err) {
      logger.error('Error deleting story:', err);
      alert('Error al eliminar el cuento');
    } finally {
      setIsDeleting(false);
      setStoryToDelete(null);
    }
  };

  const cancelDelete = () => setStoryToDelete(null);

  // Agrupar cuentos por estado
  const { completedStories, draftStories } = useMemo(() => {
    const completed = stories.filter(story => story.status === 'completed');
    const drafts = stories.filter(story => story.status === 'draft');
    return {
      completedStories: completed,
      draftStories: drafts
    };
  }, [stories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 relative z-0">
      <div className="max-w-7xl mx-auto relative z-0">
        <div className="mb-10 p-8 rounded-lg relative overflow-hidden bg-amber-50 dark:bg-amber-900/20 shadow-md hover:shadow-lg transition-shadow duration-300 border border-amber-100 dark:border-amber-800/30">
          {/* Textura de papel sutil */}
          <div className="absolute inset-0 opacity-20 dark:opacity-10 -z-10" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54 24c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h44c1.1 0 2 .9 2 2v16z\' fill=\'%239C92AC\' fill-opacity=\'0.08\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
            backgroundSize: '60px 60px'
          }} />
          
          <div className="relative z-0">
            <div className="flex items-center justify-center sm:justify-start mb-4">
              <BookOpen className="text-amber-600 dark:text-amber-400 mr-3 w-8 h-8 md:w-10 md:h-10" />
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-900 dark:text-amber-50 tracking-tight">
                Mis Cuentos
              </h1>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mb-6 mx-auto sm:mx-0" />
            <p className="text-lg text-amber-800/90 dark:text-amber-100/90 max-w-2xl pb-2 font-medium italic text-center sm:text-left">
              Aquí encontrarás todos tus cuentos creados, tanto los completados como los que están en progreso.
            </p>
          </div>
          
          {/* Esquina doblada */}
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200 dark:bg-amber-800/40 transform rotate-45 origin-top-right -translate-y-1/2 translate-x-1/2" />
          </div>
        </div>

        {/* Sección de Cuentos Completados */}
        {completedStories.length > 0 && (
          <div className="mb-16">
            <div className="relative bg-amber-50/80 dark:bg-amber-900/10 rounded-xl p-4 sm:p-5 mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.12)] transition-all duration-300 group/section max-w-3xl mx-auto">
              {/* Textura de papel sutil */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10 -z-10" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54 24c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h44c1.1 0 2 .9 2 2v16z\' fill=\'%239C92AC\' fill-opacity=\'0.08\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                backgroundSize: '60px 60px',
                borderRadius: '0.5rem'
              }} />
              
              <div className="relative z-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.05)] group-hover/section:rotate-1 transition-all duration-300 flex-shrink-0">
                      <BookOpen className="w-7 h-7 text-green-600 dark:text-green-400" />
                      {/* Checkmark */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-50 font-serif tracking-tight relative">
                          Cuentos Completados
                          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-green-400 to-green-200 dark:from-green-500 dark:to-green-300 rounded-full" />
                        </h2>
                        <span className="hidden sm:flex items-center gap-1 text-green-600 dark:text-green-400">
                          <span className="w-2 h-2 rounded-full bg-green-400 dark:bg-green-500 animate-pulse" />
                          <span className="text-xs font-medium">Completado</span>
                        </span>
                      </div>
                      <p className="text-sm text-amber-700/90 dark:text-amber-200/80 italic font-medium">
                        Disfruta de tus historias finalizadas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-medium border border-amber-200/80 dark:border-amber-700/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 flex items-center gap-1.5 group-hover/section:translate-x-1">
                      <span className="font-bold text-amber-700 dark:text-amber-300">{completedStories.length}</span>
                      <span className="hidden sm:inline">{completedStories.length === 1 ? 'cuento' : 'cuentos'}</span>
                      <span className="sm:hidden">{completedStories.length === 1 ? 'historia' : 'historias'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right w-4 h-4 opacity-70 group-hover/section:translate-x-1 transition-transform">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Barra indicadora de estado */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-green-400 to-green-300 dark:from-green-500 dark:to-green-400 rounded-full" />
            </div>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {completedStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onContinue={handleContinueStory}
                  onRead={handleReadStory}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sección de Borradores */}
        {draftStories.length > 0 && (
          <div className="mt-16">
            <div className="relative bg-amber-50/80 dark:bg-amber-900/10 rounded-xl p-4 sm:p-5 mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.12)] transition-all duration-300 group/section-draft max-w-3xl mx-auto">
              {/* Textura de papel sutil */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10 -z-10" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54 24c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h44c1.1 0 2 .9 2 2v16z\' fill=\'%239C92AC\' fill-opacity=\'0.08\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                backgroundSize: '60px 60px',
                borderRadius: '0.5rem'
              }} />
              
              <div className="relative z-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.05)] group-hover/section-draft:rotate-1 transition-all duration-300 flex-shrink-0">
                      <PenTool className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                      {/* Indicador de borrador */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pen-tool">
                          <path d="m12 19 7-7 3 3-7 7-3-3z" />
                          <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-50 font-serif tracking-tight relative">
                          En Progreso
                          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-200 dark:from-amber-500 dark:to-amber-300 rounded-full" />
                        </h2>
                        <span className="hidden sm:flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 animate-pulse" />
                          <span className="text-xs font-medium">Borrador</span>
                        </span>
                      </div>
                      <p className="text-sm text-amber-700/90 dark:text-amber-200/80 italic font-medium">
                        Continúa creando tus historias
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm font-medium border border-amber-200/80 dark:border-amber-700/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 flex items-center gap-1.5 group-hover/section-draft:translate-x-1">
                      <span className="font-bold text-amber-700 dark:text-amber-300">{draftStories.length}</span>
                      <span className="hidden sm:inline">{draftStories.length === 1 ? 'borrador' : 'borradores'}</span>
                      <span className="sm:hidden">{draftStories.length === 1 ? 'historia' : 'historias'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right w-4 h-4 opacity-70 group-hover/section-draft:translate-x-1 transition-transform">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Barra indicadora de estado */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-amber-400 to-amber-300 dark:from-amber-500 dark:to-amber-400 rounded-full" />
            </div>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {draftStories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onContinue={handleContinueStory}
                  onRead={handleReadStory}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
            
            {/* Paginación Mejorada */}
            {draftStories.length > itemsPerPage && (
              <div className="mt-10 px-4 py-3 flex items-center justify-between sm:px-6">
                {/* Versión Móvil */}
                <div className="w-full sm:hidden">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="text-xs font-medium text-brown-700/90 dark:text-brown-200/80">
                      Página <span className="font-bold">{currentPage}</span> de <span className="font-bold">{Math.ceil(draftStories.length / itemsPerPage)}</span>
                    </p>
                    <p className="text-xs font-medium text-brown-700/90 dark:text-brown-200/80">
                      <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, draftStories.length)}</span> de <span className="font-bold">{draftStories.length}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-brown-200 dark:border-brown-900/50 p-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                        currentPage === 1
                          ? 'text-brown-300 dark:text-brown-800 cursor-not-allowed'
                          : 'text-brown-700 dark:text-brown-300 active:bg-brown-100 dark:active:bg-brown-900/20 active:scale-95'
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="ml-1 text-sm font-medium">Anterior</span>
                    </button>
                    
                    <div className="flex items-center space-x-2 bg-brown-50/50 dark:bg-brown-900/10 rounded-lg px-3 py-1.5 border border-brown-100 dark:border-brown-800/30">
                      <span className="text-sm font-bold text-brown-800 dark:text-brown-200">
                        {currentPage}
                      </span>
                      <span className="text-brown-500 dark:text-brown-500">/</span>
                      <span className="text-sm font-medium text-brown-600 dark:text-brown-400">
                        {Math.ceil(draftStories.length / itemsPerPage)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(draftStories.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(draftStories.length / itemsPerPage)}
                      className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                        currentPage === Math.ceil(draftStories.length / itemsPerPage)
                          ? 'text-brown-300 dark:text-brown-800 cursor-not-allowed'
                          : 'text-brown-700 dark:text-brown-300 active:bg-brown-100 dark:active:bg-brown-900/20 active:scale-95'
                      }`}
                    >
                      <span className="mr-1 text-sm font-medium">Siguiente</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:flex-col sm:items-center sm:justify-between space-y-4">
                  <div className="w-full text-center">
                    <p className="text-sm text-amber-700/90 dark:text-amber-200/80 font-medium">
                      Mostrando <span className="font-bold text-amber-800 dark:text-amber-100">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                      <span className="font-bold text-amber-800 dark:text-amber-100">
                        {Math.min(currentPage * itemsPerPage, draftStories.length)}
                      </span>{' '}
                      de <span className="font-bold text-amber-800 dark:text-amber-100">{draftStories.length}</span> historias
                    </p>
                  </div>
                  <div className="w-full flex justify-center">
                    <nav className="relative z-0 inline-flex rounded-full shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-amber-100 dark:border-amber-900/50 p-1" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                          currentPage === 1
                            ? 'text-amber-300 dark:text-amber-700 cursor-not-allowed'
                            : 'text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                        }`}
                      >
                        <span className="sr-only">Anterior</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Números de página */}
                      <div className="flex items-center space-x-1 mx-2">
                        {(() => {
                          const totalPages = Math.ceil(draftStories.length / itemsPerPage);
                          const buttons = [];
                          const maxButtons = 5;
                          
                          // Calcular el rango de páginas a mostrar
                          let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                          let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                          
                          if (endPage - startPage + 1 < maxButtons) {
                            startPage = Math.max(1, endPage - maxButtons + 1);
                          }
                          
                          // Botón para la primera página si es necesario
                          if (startPage > 1) {
                            buttons.push(
                              <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                              >
                                1
                              </button>
                            );
                            
                            if (startPage > 2) {
                              buttons.push(
                                <span key="ellipsis-start" className="px-1 text-amber-500 dark:text-amber-600">
                                  ...
                                </span>
                              );
                            }
                          }
                          
                          // Botones de páginas
                          for (let i = startPage; i <= endPage; i++) {
                            buttons.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                  currentPage === i
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                          
                          // Botón para la última página si es necesario
                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              buttons.push(
                                <span key="ellipsis-end" className="px-1 text-amber-500 dark:text-amber-600">
                                  ...
                                </span>
                              );
                            }
                            
                            buttons.push(
                              <button
                                key={totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                              >
                                {totalPages}
                              </button>
                            );
                          }
                          
                          return buttons;
                        })()}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(draftStories.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(draftStories.length / itemsPerPage)}
                        className={`relative inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                          currentPage === Math.ceil(draftStories.length / itemsPerPage)
                            ? 'text-amber-300 dark:text-amber-700 cursor-not-allowed'
                            : 'text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                        }`}
                      >
                        <span className="sr-only">Siguiente</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje cuando no hay cuentos */}
        {stories.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="absolute -top-2 -left-2 w-24 h-24 bg-purple-200 dark:bg-purple-900/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-blue-200 dark:bg-blue-900/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="relative z-0">
                <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              ¡Comienza tu aventura literaria!
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Aún no has creado ningún cuento. Da el primer paso para dar vida a historias increíbles.
            </p>
            <button
              onClick={handleNewStory}
              data-testid="create-first-story"
              className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 ease-out shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"></span>
              <Plus className="relative w-5 h-5 mr-2 group-hover:animate-bounce" />
              <span className="relative font-semibold">Crear mi primer cuento</span>
            </button>
          </div>
        )}

      {/* Botón flotante solo se muestra cuando hay cuentos existentes */}
      {stories.length > 0 && (
        <div className="fixed bottom-6 right-6 z-5">
          <button
            onClick={handleNewStory}
            data-testid="create-new-story"
            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 ease-out hover:from-purple-700 hover:to-indigo-700 transform hover:-translate-y-1"
            aria-label="Crear nuevo cuento"
          >
            <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
            <span className="text-sm font-medium pr-1">Nuevo cuento</span>
          </button>
        </div>
      )}
      <ConfirmDialog
        isOpen={storyToDelete !== null}
        title="Eliminar cuento"
        message="¿Estás seguro de que deseas eliminar este cuento?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirmLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      >
        <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
          <input
            type="checkbox"
            checked={deleteCharacters}
            onChange={e => setDeleteCharacters(e.target.checked)}
          />
          Eliminar personajes asociados
        </label>
      </ConfirmDialog>
    </div>

  </div>
);
};

export default MyStories;