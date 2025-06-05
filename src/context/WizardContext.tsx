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
  } = useWizardFlowStore();
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
    const loadDraft = async () => {
      if (!storyId || !user) {
        return;
      }

      console.log('[WizardFlow] loadDraft inicio');
      try {
        const savedState = localStorage.getItem(`story_draft_${storyId}`);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.state) setState(parsed.state);
          else setState(parsed);
          if (parsed.storySettings) setStorySettings(parsed.storySettings);
          if (parsed.designSettings) setDesignSettings(parsed.designSettings);
          if (parsed.characters) setCharacters(parsed.characters);
          if (parsed.generatedPages) setGeneratedPages(parsed.generatedPages);
          if (parsed.flow) {
            setEstadoCompleto(parsed.flow);
          }
          const estadoActual = parsed.flow || useWizardFlowStore.getState().estado;
          const step = stepFromEstado(estadoActual);
          setCurrentStep(step);
          console.log('[WizardFlow] borrador local cargado', estadoActual);
          return;
        }

        const draft = await storyService.getStoryDraft(storyId);
        if (draft.story) {
          setState({
            ...INITIAL_STATE,
            meta: {
              title: draft.story.title || '',
              theme: draft.story.theme || '',
              targetAge: draft.story.target_age || '',
              literaryStyle: draft.story.literary_style || '',
              centralMessage: draft.story.central_message || '',
              additionalDetails: draft.story.additional_details || '',
              status: draft.story.status,
            },
          });
          setStorySettings({
            theme: draft.story.theme || '',
            targetAge: draft.story.target_age || '',
            literaryStyle: draft.story.literary_style || '',
            centralMessage: draft.story.central_message || '',
            additionalDetails: draft.story.additional_details || '',
          });
          if (draft.story.wizard_state) {
            setEstadoCompleto(draft.story.wizard_state);
          }
        }
        if (draft.characters) {
          setCharacters(draft.characters);
        }
        if (draft.design) {
          setDesignSettings({
            visualStyle: draft.design.visual_style,
            colorPalette: draft.design.color_palette,
          });
        }
        if (draft.pages) {
          const pages = draft.pages.map(p => ({
            id: p.id,
            pageNumber: p.page_number,
            text: p.text,
            imageUrl: p.image_url,
            prompt: p.prompt,
          }));
          setGeneratedPages(pages);
        }

        console.log('[WizardFlow] borrador remoto cargado', useWizardFlowStore.getState().estado);

        if (draft.characters) setPersonajes(draft.characters.length);

        const current = draft.story.wizard_state || useWizardFlowStore.getState().estado;
        const next = stepFromEstado(current);
        setCurrentStep(next);
        console.log('[WizardFlow] estado tras load', current);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadDraft();
  }, [storyId, user]);

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
      const etapa = stepMap[currentStep];
      if (etapa) {
        regresarEtapa(etapa);
      }
      setCurrentStep(steps[currentIndex - 1]);
    }
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
    const local = {
      state: newState,
      flow: estado,
      currentStep,
      storySettings,
      designSettings,
      characters,
      generatedPages,
    };
    localStorage.setItem(`story_draft_${storyId}`, JSON.stringify(local));
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