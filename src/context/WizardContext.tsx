import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useAutosave } from '../hooks/useAutosave';
import { Character, StorySettings, DesignSettings, WizardState } from '../types';

export type WizardStep = 'characters' | 'story' | 'design' | 'preview';

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

const samplePages: GeneratedPage[] = [
  {
    id: '1',
    pageNumber: 1,
    text: 'En un jardín mágico, Luna el gato descubrió una puerta brillante entre las flores...',
    imageUrl: 'https://images.pexels.com/photos/1314550/pexels-photo-1314550.jpeg',
    prompt: 'Un gato mágico en un jardín encantado con una puerta brillante, estilo acuarela suave',
  },
  {
    id: '2',
    pageNumber: 2,
    text: 'Al cruzar la puerta, se encontró con un mundo de nubes de algodón y estrellas danzantes...',
    imageUrl: 'https://images.pexels.com/photos/1183434/pexels-photo-1183434.jpeg',
    prompt: 'Paisaje mágico con nubes de algodón y estrellas brillantes, estilo fantasía infantil',
  },
  {
    id: '3',
    pageNumber: 3,
    text: 'Allí conoció a Pip, un pequeño dragón que coleccionaba sonrisas en frascos de cristal...',
    imageUrl: 'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg',
    prompt: 'Un dragón adorable con frascos de cristal brillantes, estilo cartoon amigable',
  }
];

const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { storyId } = useParams();
  const { supabase } = useAuth();
  const [state, setState] = useState<WizardState>({
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
  });

  useAutosave(state, storyId || '');

  useEffect(() => {
    const loadDraft = async () => {
      if (!storyId || !isValidUUID(storyId)) {
        console.log('No valid storyId provided, skipping draft load');
        return;
      }

      const savedDraft = localStorage.getItem(`story_draft_${storyId}`);
      if (savedDraft) {
        setState(JSON.parse(savedDraft));
        return;
      }

      try {
        const { data: story, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (error) throw error;

        if (story) {
          setState({
            ...state,
            meta: {
              title: story.title,
              targetAge: story.target_age,
              literaryStyle: story.literary_style,
              centralMessage: story.central_message,
              additionalDetails: story.additional_details,
              status: story.status
            }
          });
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadDraft();
  }, [storyId]);

  const [currentStep, setCurrentStep] = useState<WizardStep>('characters');
  const [characters, setCharacters] = useState<Character[]>([{ id: '1', name: '', description: '', selectedVariant: null, variants: [] }]);
  const [storySettings, setStorySettings] = useState<StorySettings>({
    targetAge: '',
    literaryStyle: '',
    centralMessage: '',
    additionalDetails: '',
  });
  const [designSettings, setDesignSettings] = useState<DesignSettings>({
    visualStyle: '',
    colorPalette: '',
  });
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>(samplePages);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const steps: WizardStep[] = ['characters', 'story', 'design', 'preview'];

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

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'characters':
        return characters.every(
          (c) => c.name.trim() !== '' && c.description.trim() !== '' && c.selectedVariant !== null
        );
      case 'story':
        return (
          storySettings.targetAge !== '' &&
          storySettings.literaryStyle !== '' &&
          storySettings.centralMessage !== ''
        );
      case 'design':
        return designSettings.visualStyle !== '' && designSettings.colorPalette !== '';
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
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};