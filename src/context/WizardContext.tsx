import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { usePersistence } from '../hooks/usePersistence';
import { Character, StorySettings, DesignSettings, WizardState, EstadoFlujo } from '../types';
import { useWizardFlowStore } from '../stores/wizardFlowStore';
import { storyService } from '../services/storyService';
import { logger, wizardLogger } from '../utils/logger';
import { useStory } from './StoryContext';

export type WizardStep = 'characters' | 'story' | 'design' | 'preview' | 'dedicatoria-choice' | 'dedicatoria' | 'export';

interface WizardContextType {
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  storySettings: StorySettings;
  setStorySettings: (settings: StorySettings) => void;
  designSettings: DesignSettings;
  setDesignSettings: (settings: DesignSettings) => void;
  generatedPages: GeneratedPage[];
  setGeneratedPages: (pages: GeneratedPage[]) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  isRegeneratingModal: boolean;
  setIsRegeneratingModal: (value: boolean) => void;
  generatePageImage: (pageId: string, customPrompt?: string) => Promise<void>;
  generateCoverImage: (customPrompt?: string) => Promise<void>;
  updateStoryTitle: (title: string) => void;
  updatePageContent: (pageId: string, updates: { text?: string; prompt?: string }) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  skipToStep: (step: WizardStep) => void;
  canProceed: () => boolean;
  resetWizard: () => void;
  // New parallel generation functionality
  bulkGenerationProgress: BulkGenerationProgress;
  pageStates: Record<string, PageGenerationState>;
  generateAllImagesParallel: () => Promise<void>;
  updatePageState: (pageId: string, state: PageGenerationState) => void;
  retryFailedPages: () => Promise<void>;
  // Story completion functionality
  completeStory: (saveToLibrary?: boolean) => Promise<import('../types').CompletionResult>;
  isCompleting: boolean;
  completionResult: import('../types').CompletionResult | null;
  isPdfOutdated: boolean;
  // Loader messages from story
  loaderMessages: string[];
}

export interface GeneratedPage {
  id: string;
  pageNumber: number;
  text: string;
  imageUrl: string;
  prompt: string;
}

export type PageGenerationState = 'pending' | 'generating' | 'completed' | 'error';

export interface BulkGenerationProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: string[]; // IDs de páginas generándose
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard debe usarse dentro de un WizardProvider');
  }
  return context;
};

const INITIAL_STATE: WizardState = {
  characters: [],
  styles: [],
  spreads: [],
  meta: {
    title: '',
    synopsis: '',
    theme: '',
    targetAge: '',
    literaryStyle: '',
    centralMessage: '',
    additionalDetails: '',
    status: 'draft'
  }
};

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { supabase, user } = useAuth();
  const { loadExistingCovers } = useStory();

  const {
    estado,
    setPersonajes,
    avanzarEtapa,
    regresarEtapa,
    resetEstado,
    setEstadoCompleto,
    setStoryId,
  } = useWizardFlowStore();

  useEffect(() => {
    if (storyId) {
      setStoryId(storyId);
    }
  }, [storyId, setStoryId]);

  useEffect(() => {
    return () => {
      // resetEstado(); // REMOVED: Don't reset wizard state on unmount to preserve character assignments
      setStoryId(null);
      localStorage.removeItem('current_story_draft_id');
    };
  }, [setStoryId]);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState<WizardStep>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [storySettings, setStorySettings] = useState<StorySettings>({
    theme: '',
    targetAge: '',
    literaryStyle: '',
    centralMessage: '',
    additionalDetails: '',
  });
  const [designSettings, setDesignSettings] = useState<DesignSettings>({
    visualStyle: 'default',
    colorPalette: 'pastel_vibrant',
  });
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRegeneratingModal, setIsRegeneratingModal] = useState<boolean>(false);
  
  // New states for parallel generation
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState<BulkGenerationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: []
  });
  const [pageStates, setPageStates] = useState<Record<string, PageGenerationState>>({});
  const [loaderMessages, setLoaderMessages] = useState<string[]>([]);
  
  // Story completion states
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [completionResult, setCompletionResult] = useState<import('../types').CompletionResult | null>(null);
  const [isPdfOutdated, setIsPdfOutdated] = useState<boolean>(false);

  const generatePageImage = async (pageId: string, customPrompt?: string) => {
    if (!storyId) return;
    setIsGenerating(true);
    try {
      const imageUrl = await storyService.generatePageImage(storyId, pageId, customPrompt);
      logger.debug('[WizardContext] Image generated for page:', { pageId, imageUrl });
      
      setGeneratedPages(prev => {
        const updated = prev.map(p => {
          if (p.id === pageId) {
            // Add timestamp to force cache refresh
            const imageUrlWithTimestamp = imageUrl ? `${imageUrl}?t=${Date.now()}` : imageUrl;
            const updatedPage = { ...p, imageUrl: imageUrlWithTimestamp, ...(customPrompt ? { prompt: customPrompt } : {}) };
            logger.debug('[WizardContext] Updating page:', { 
              pageId: p.id, 
              oldUrl: p.imageUrl, 
              newUrl: imageUrlWithTimestamp 
            });
            return updatedPage;
          }
          return p;
        });
        return updated;
      });
      
      // Mark PDF as outdated since page has changed
      if (completionResult?.success) {
        setIsPdfOutdated(true);
      }
    } catch (err) {
      logger.error('Error regenerating page image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCoverImage = async (customPrompt?: string) => {
    if (!storyId) return;
    setIsGenerating(true);
    try {
      const imageUrl = await storyService.generateCoverImage(storyId, customPrompt);
      // Add timestamp to force cache refresh
      const imageUrlWithTimestamp = imageUrl ? `${imageUrl}?t=${Date.now()}` : imageUrl;
      setGeneratedPages(prev => prev.map(p =>
        p.pageNumber === 0 ? { ...p, imageUrl: imageUrlWithTimestamp, prompt: customPrompt || p.prompt } : p
      ));
      // Mark PDF as outdated since cover has changed
      if (completionResult?.success) {
        setIsPdfOutdated(true);
      }
    } catch (err) {
      logger.error('Error regenerating cover image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePageContent = async (pageId: string, updates: { text?: string; prompt?: string }) => {
    if (!storyId) return;

    try {
      // Update in database
      await storyService.updatePageContent(pageId, updates);
      
      // Update local state
      setGeneratedPages(prev => prev.map(p => {
        if (p.id === pageId) {
          return {
            ...p,
            ...(updates.text !== undefined && { text: updates.text }),
            ...(updates.prompt !== undefined && { prompt: updates.prompt })
          };
        }
        return p;
      }));

      // Mark PDF as outdated since content has changed
      if (completionResult?.success) {
        setIsPdfOutdated(true);
      }
    } catch (error) {
      logger.error('Error updating page content:', error);
      throw error;
    }
  };

  // Helper function to update individual page state
  const updatePageState = (pageId: string, state: PageGenerationState) => {
    setPageStates(prev => ({ ...prev, [pageId]: state }));
  };

  // Helper functions are now inline in the main function since they need pageId context

  // Main parallel generation function
  const generateAllImagesParallel = async () => {
    if (!storyId) return;
    
    const pagesToGenerate = generatedPages.filter(p => p.pageNumber !== 0 && !p.imageUrl);
    const totalPages = pagesToGenerate.length;
    
    if (totalPages === 0) return;

    // Initialize progress state
    setBulkGenerationProgress({
      total: totalPages,
      completed: 0,
      failed: 0,
      inProgress: pagesToGenerate.map(p => p.id)
    });

    // Initialize all pages as generating
    const initialStates: Record<string, PageGenerationState> = {};
    pagesToGenerate.forEach(page => {
      initialStates[page.id] = 'generating';
    });
    setPageStates(initialStates);
    
    setIsGenerating(true);

    try {
      // Generate all images in parallel using Promise.allSettled
      const generationPromises = pagesToGenerate.map(async (page) => {
        try {
          logger.debug(`[Parallel Generation] Starting generation for page ${page.pageNumber}`);
          const url = await storyService.generatePageImage(storyId, page.id);
          
          // Update page with new image URL
          setGeneratedPages(prev =>
            prev.map(p => (p.id === page.id ? { ...p, imageUrl: url } : p))
          );
          
          // Update state and progress
          updatePageState(page.id, 'completed');
          setBulkGenerationProgress(prev => ({ 
            ...prev, 
            completed: prev.completed + 1,
            inProgress: prev.inProgress.filter(id => id !== page.id)
          }));
          
          logger.debug(`[Parallel Generation] Completed page ${page.pageNumber}`);
          return { pageId: page.id, success: true, url };
        } catch (error) {
          logger.error(`[Parallel Generation] Failed page ${page.pageNumber}:`, error);
          updatePageState(page.id, 'error');
          setBulkGenerationProgress(prev => ({ 
            ...prev, 
            failed: prev.failed + 1,
            inProgress: prev.inProgress.filter(id => id !== page.id)
          }));
          return { pageId: page.id, success: false, error };
        }
      });

      // Wait for all generations to complete (successful or failed)
      const results = await Promise.allSettled(generationPromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failCount = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
      
      logger.debug(`[Parallel Generation] Completed: ${successCount} successful, ${failCount} failed`);
      
    } catch (error) {
      logger.error('[Parallel Generation] Unexpected error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to retry only failed pages
  const retryFailedPages = async () => {
    if (!storyId) return;
    
    const failedPageIds = Object.entries(pageStates)
      .filter(([, state]) => state === 'error')
      .map(([pageId]) => pageId);
    
    const failedPages = generatedPages.filter(p => failedPageIds.includes(p.id));
    
    if (failedPages.length === 0) return;

    logger.debug(`[Retry Failed] Retrying ${failedPages.length} failed pages`);
    
    // Reset failed pages to generating state
    failedPages.forEach(page => updatePageState(page.id, 'generating'));
    
    // Reset counters
    setBulkGenerationProgress(prev => ({
      ...prev,
      failed: prev.failed - failedPages.length,
      inProgress: [...prev.inProgress, ...failedPageIds]
    }));

    setIsGenerating(true);

    try {
      const retryPromises = failedPages.map(async (page) => {
        try {
          const url = await storyService.generatePageImage(storyId, page.id);
          setGeneratedPages(prev =>
            prev.map(p => (p.id === page.id ? { ...p, imageUrl: url } : p))
          );
          updatePageState(page.id, 'completed');
          setBulkGenerationProgress(prev => ({ 
            ...prev, 
            completed: prev.completed + 1,
            inProgress: prev.inProgress.filter(id => id !== page.id)
          }));
          return { pageId: page.id, success: true, url };
        } catch (error) {
          updatePageState(page.id, 'error');
          setBulkGenerationProgress(prev => ({ 
            ...prev, 
            failed: prev.failed + 1,
            inProgress: prev.inProgress.filter(id => id !== page.id)
          }));
          return { pageId: page.id, success: false, error };
        }
      });

      await Promise.allSettled(retryPromises);
    } finally {
      setIsGenerating(false);
    }
  };

  // Story completion function
  const completeStory = async (saveToLibrary: boolean = true): Promise<import('../types').CompletionResult> => {
    if (!storyId) {
      return { success: false, error: 'No hay ID de cuento disponible' };
    }

    setIsCompleting(true);
    setCompletionResult(null);

    // Notify persistence system that export is starting
    window.dispatchEvent(new CustomEvent('export-start', { 
      detail: { storyId } 
    }));

    try {
      const result = await storyService.completeStory(storyId, saveToLibrary);
      
      setCompletionResult(result);
      // Reset PDF outdated flag if successful
      if (result.success) {
        setIsPdfOutdated(false);
        
        // Disparar evento para refrescar el estado de bloqueo
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('story-status-updated', { 
            detail: { storyId, status: 'completed' } 
          }));
        }, 1000);
      }
      return result;
    } catch (error) {
      const errorResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al finalizar el cuento' 
      };
      setCompletionResult(errorResult);
      return errorResult;
    } finally {
      setIsCompleting(false);
    }
  };

  const { pausePersistence, resumePersistence } = usePersistence(state, estado, storyId || null);

  // Mantener sincronizado el conteo de personajes en el store de flujo
  useEffect(() => {
    setPersonajes(characters.length);
  }, [characters, setPersonajes]);

  // Sincronizar storySettings con state para persistencia correcta
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      meta: {
        ...prevState.meta,
        theme: storySettings.theme,
        targetAge: storySettings.targetAge,
        literaryStyle: storySettings.literaryStyle,
        centralMessage: storySettings.centralMessage,
        additionalDetails: storySettings.additionalDetails,
      },
      dedicatoria: storySettings.dedicatoria
    }));
  }, [storySettings]);

  const stepFromEstado = (estado: EstadoFlujo): WizardStep => {
    if (estado.personajes.estado !== 'completado') return 'characters';
    if (estado.cuento !== 'completado') return 'story';
    if (estado.diseno !== 'completado') return 'design';
    if (estado.vistaPrevia !== 'completado') return 'preview';
    if (estado.dedicatoriaChoice !== 'completado') return 'dedicatoria-choice';
    if (estado.dedicatoria !== 'completado') return 'dedicatoria';
    return 'export';
  };

  useEffect(() => {
    if (!storyId) return;

    useWizardFlowStore.getState().resetEstado();

    const backupKey = `story_draft_${storyId}_backup`;
    const mainKey = `story_draft_${storyId}`;
    const localBackup = localStorage.getItem(backupKey);
    const localDraft = !localBackup ? localStorage.getItem(mainKey) : null;

    if (localBackup || localDraft) {
      const raw = JSON.parse(localBackup || localDraft!);
      const { state: localState, flow } = raw;
      useWizardFlowStore.getState().setEstadoCompleto(flow);
      setCharacters(localState.characters || []);
      setStorySettings(localState.meta || INITIAL_STATE.meta);
      if (localState.designSettings) setDesignSettings(localState.designSettings);
      if (localState.spreads) {
        const mapped = localState.spreads.map((p: any) => ({
          id: p.id,
          pageNumber: p.pageNumber,
          text: p.text,
          imageUrl: p.imageUrl,
          prompt: p.prompt,
        }));
        setGeneratedPages(mapped);
      }
      const etapaInicial = stepFromEstado(useWizardFlowStore.getState().estado);
      setCurrentStep(etapaInicial);
      return;
    }

    storyService.getStoryDraft(storyId).then(draft => {
      const s = draft.story;
      if (s.wizard_state) {
        setEstadoCompleto(s.wizard_state);
      } else {
        useWizardFlowStore.getState().resetEstado();
      }
      if (draft.characters) setCharacters(draft.characters);
      setStorySettings({
        theme: s.theme || '',
        targetAge: s.target_age || '',
        literaryStyle: s.literary_style || '',
        centralMessage: s.central_message || '',
        additionalDetails: s.additional_details || '',
        dedicatoria: (s.dedicatoria_chosen || s.dedicatoria_text || s.dedicatoria_image_url) ? {
          text: s.dedicatoria_text || '',
          imageUrl: s.dedicatoria_image_url || undefined,
          layout: s.dedicatoria_layout?.layout || 'imagen-arriba',
          alignment: s.dedicatoria_layout?.alignment || 'centro',
          imageSize: s.dedicatoria_layout?.imageSize || 'mediana'
        } : undefined
      });
      
      // CRÍTICO: Preservar el título al cargar desde base de datos
      if (s.title) {
        console.log('[WizardContext] Restaurando título desde BD:', s.title);
        updateStoryTitle(s.title);
      } else {
        console.log('[WizardContext] No hay título en BD para restaurar');
      }
      
      // Cargar mensajes personalizados del loader
      if (Array.isArray(s.loader)) {
        console.log('[WizardContext] Cargando mensajes personalizados del loader:', s.loader);
        setLoaderMessages(s.loader as string[]);
      } else {
        console.log('[WizardContext] No hay mensajes personalizados del loader');
        setLoaderMessages([]);
      }
      if (draft.design) {
        setDesignSettings({
          visualStyle: draft.design.visual_style || '',
          colorPalette: draft.design.color_palette || '',
        });
      }
      if (draft.pages) {
        const mapped = draft.pages.map(p => ({
          id: p.id,
          pageNumber: p.page_number,
          text: p.text,
          imageUrl: p.image_url || '',
          prompt: p.prompt || ''
        }));
        console.log('[WizardContext] DEBUG - Páginas cargadas desde BD:', {
          storyId,
          totalPages: mapped.length,
          pagesWithImages: mapped.filter(p => p.imageUrl).length,
          pagesSummary: mapped.map(p => ({ 
            pageNumber: p.pageNumber, 
            hasImage: !!p.imageUrl,
            imageUrl: p.imageUrl?.substring(0, 50) + '...' 
          }))
        });
        setGeneratedPages(mapped);
      } else {
        console.log('[WizardContext] DEBUG - No hay páginas en draft.pages para story:', storyId);
      }
      const etapaInicial = stepFromEstado(useWizardFlowStore.getState().estado);
      setCurrentStep(etapaInicial);
      
      // Load existing covers when continuing any story (not just from MyStories)
      // This ensures covers are loaded regardless of wizard state
      console.log('[WizardContext] Attempting to load existing covers for story:', storyId);
      loadExistingCovers(storyId);
    });
  }, [storyId]);

  const steps: WizardStep[] = ['characters', 'story', 'design', 'preview', 'dedicatoria-choice', 'dedicatoria', 'export'];
  const stepMap: Record<WizardStep, keyof EstadoFlujo | null> = {
    characters: 'personajes',
    story: 'cuento',
    design: 'diseno',
    preview: 'vistaPrevia',
    'dedicatoria-choice': 'dedicatoriaChoice',
    dedicatoria: 'dedicatoria',
    export: null,
  };

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const etapa = stepMap[currentStep];
      if (etapa) {
        avanzarEtapa(etapa);
      }
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const skipToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const updateStoryTitle = (title: string) => {
    console.log('[WizardContext] updateStoryTitle llamado con:', title);
    wizardLogger.step('updateStoryTitle', { title });
    setState(prevState => {
      const newState = {
        ...prevState,
        meta: {
          ...prevState.meta,
          title
        }
      };
      console.log('[WizardContext] Título actualizado en state:', newState.meta.title);
      logger.debug('New state meta.title:', newState.meta.title);
      return newState;
    });
  };

  const resetWizard = () => {
    setState(INITIAL_STATE);
    setCurrentStep('characters');
    setCharacters([]);
    resetEstado();
    setStorySettings({
      theme: '',
      targetAge: '',
      literaryStyle: '',
      centralMessage: '',
      additionalDetails: '',
    });
    setDesignSettings({
      visualStyle: 'default',
      colorPalette: 'pastel_vibrant',
    });
    setGeneratedPages([]);
    setIsGenerating(false);
    logger.debug('[WizardFlow] resetWizard', useWizardFlowStore.getState().estado);
  };

  useEffect(() => {
    if (!storyId) return;
    const spreads = generatedPages.map(p => ({
      page: p.pageNumber,
      text: p.text,
      prompt: p.prompt,
      imageUrl: p.imageUrl,
    }));
    const newState: WizardState = {
      characters,
      styles: [],
      spreads,
      meta: {
        ...state.meta,
        theme: storySettings.theme,
        targetAge: storySettings.targetAge,
        literaryStyle: storySettings.literaryStyle,
        centralMessage: storySettings.centralMessage,
        additionalDetails: storySettings.additionalDetails,
        // IMPORTANTE: preservar el título si ya existe
        title: state.meta.title || ''
      },
    };
    logger.debug('useEffect reconstruyendo estado, título preservado:', state.meta.title);
    setState(newState);
    // El estado del wizard se mantiene en memoria y se sincroniza mediante autosave
  }, [storyId, characters, storySettings, designSettings, generatedPages, currentStep]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'characters':
        return characters.every((c) => {
          const name = typeof c.name === 'string' ? c.name.trim() : '';
          const description = typeof c.description === 'object' 
            ? c.description.es.trim() 
            : typeof c.description === 'string' 
              ? c.description.trim() 
              : '';
          return name !== '' && description !== '' && c.thumbnailUrl !== null;
        });
      case 'story':
        // The "story" step now only requires the story text and cover
        // generation to be completed, which is represented by having
        // generated pages available.
        return generatedPages.length > 0;
      case 'design':
        return designSettings.visualStyle !== '' && designSettings.colorPalette !== '';
      case 'preview':
        return generatedPages.length > 0;
      case 'dedicatoria-choice':
        // El choice debe hacerse mediante los botones del componente
        return true;
      case 'dedicatoria':
        // La dedicatoria es opcional, siempre permitir avanzar
        return true;
      case 'export':
        return true;
      default:
        return true;
    }
  };

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        characters,
        setCharacters,
        storySettings,
        setStorySettings,
        designSettings,
        setDesignSettings,
        generatedPages,
        setGeneratedPages,
        isGenerating,
        setIsGenerating,
        isRegeneratingModal,
        setIsRegeneratingModal,
        generatePageImage,
        generateCoverImage,
        updateStoryTitle,
        updatePageContent,
        nextStep,
        prevStep,
        skipToStep,
        canProceed,
        resetWizard,
        // New parallel generation functionality
        bulkGenerationProgress,
        pageStates,
        generateAllImagesParallel,
        updatePageState,
        retryFailedPages,
        // Story completion functionality
        completeStory,
        isCompleting,
        completionResult,
        isPdfOutdated,
        // Loader messages from story
        loaderMessages,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};