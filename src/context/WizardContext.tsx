import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useAutosave } from '../hooks/useAutosave';
import { Character, StorySettings, DesignSettings, WizardState, EstadoFlujo } from '../types';
import { useWizardFlowStore } from '../stores/wizardFlowStore';
import { storyService } from '../services/storyService';

export type WizardStep = 'characters' | 'story' | 'design' | 'preview' | 'export';

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
  generatePageImage: (pageId: string) => Promise<void>;
  updateStoryTitle: (title: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: () => boolean;
  resetWizard: () => void;
}

export interface GeneratedPage {
  id: string;
  pageNumber: number;
  text: string;
  imageUrl: string;
  prompt: string;
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

  const generatePageImage = async (pageId: string) => {
    if (!storyId) return;
    setIsGenerating(true);
    try {
      const imageUrl = await storyService.generatePageImage(storyId, pageId);
      setGeneratedPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, imageUrl } : p
      ));
    } catch (err) {
      console.error('Error regenerating page image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useAutosave(state, estado, storyId || null);

  // Mantener sincronizado el conteo de personajes en el store de flujo
  useEffect(() => {
    setPersonajes(characters.length);
  }, [characters, setPersonajes]);

  const stepFromEstado = (estado: EstadoFlujo): WizardStep => {
    if (estado.personajes.estado !== 'completado') return 'characters';
    if (estado.cuento !== 'completado') return 'story';
    if (estado.diseno !== 'completado') return 'design';
    return 'preview';
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
      });
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
        setGeneratedPages(mapped);
      }
      const etapaInicial = stepFromEstado(useWizardFlowStore.getState().estado);
      setCurrentStep(etapaInicial);
    });
  }, [storyId]);

  const steps: WizardStep[] = ['characters', 'story', 'design', 'preview', 'export'];
  const stepMap: Record<WizardStep, keyof EstadoFlujo | null> = {
    characters: 'personajes',
    story: 'cuento',
    design: 'diseno',
    preview: 'vistaPrevia',
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

  const updateStoryTitle = (title: string) => {
    setState(prevState => ({
      ...prevState,
      meta: {
        ...prevState.meta,
        title
      }
    }));
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
    console.log('[WizardFlow] resetWizard', useWizardFlowStore.getState().estado);
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
      },
    };
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
        generatePageImage,
        updateStoryTitle,
        nextStep,
        prevStep,
        canProceed,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};