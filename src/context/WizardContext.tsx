import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useAutosave } from '../hooks/useAutosave';
import { Character, StorySettings, DesignSettings, WizardState } from '../types';
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

  useAutosave(state, storyId || null);

  useEffect(() => {
    const loadDraft = async () => {
      if (!storyId || !user) {
        return;
      }

      try {
        const savedState = localStorage.getItem(`story_draft_${storyId}`);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.state) setState(parsed.state);
          else setState(parsed);
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          if (parsed.storySettings) setStorySettings(parsed.storySettings);
          if (parsed.designSettings) setDesignSettings(parsed.designSettings);
          if (parsed.characters) setCharacters(parsed.characters);
          if (parsed.generatedPages) setGeneratedPages(parsed.generatedPages);
          return;
        }

        const draft = await storyService.getStoryDraft(storyId);
        if (draft.story) {
          setState({
            ...INITIAL_STATE,
            meta: {
              title: draft.story.title || '',
              targetAge: draft.story.target_age || '',
              literaryStyle: draft.story.literary_style || '',
              centralMessage: draft.story.central_message || '',
              additionalDetails: draft.story.additional_details || '',
              status: draft.story.status,
            },
          });
          setStorySettings({
            theme: '',
            targetAge: draft.story.target_age || '',
            literaryStyle: draft.story.literary_style || '',
            centralMessage: draft.story.central_message || '',
            additionalDetails: draft.story.additional_details || '',
          });
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

        let step: WizardStep = 'characters';
        if (draft.pages && draft.pages.length > 0) step = 'preview';
        else if (draft.design) step = 'design';
        else if (draft.story && draft.story.central_message) step = 'story';
        else if (draft.characters && draft.characters.length > 0) step = 'story';
        setCurrentStep(step);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadDraft();
  }, [storyId, user]);

  const steps: WizardStep[] = ['characters', 'story', 'design', 'preview', 'export'];

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const resetWizard = () => {
    setState(INITIAL_STATE);
    setCurrentStep('characters');
    setCharacters([]);
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
        targetAge: storySettings.targetAge,
        literaryStyle: storySettings.literaryStyle,
        centralMessage: storySettings.centralMessage,
        additionalDetails: storySettings.additionalDetails,
      },
    };
    setState(newState);
    const local = {
      state: newState,
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