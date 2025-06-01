import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import { useAuth } from '../../context/AuthContext';
import CharactersStep from './steps/CharactersStep';
import StoryStep from './steps/StoryStep';
import DesignStep from './steps/DesignStep';
import PreviewStep from './steps/PreviewStep';
import ExportStep from './steps/ExportStep';
import WizardNav from './WizardNav';
import StepIndicator from './StepIndicator';

const Wizard: React.FC = () => {
  const { currentStep } = useWizard();
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { supabase } = useAuth();

  useEffect(() => {
    sessionStorage.removeItem('skipWizardCleanup');
  }, []);

  useEffect(() => {
    if (!storyId) {
      navigate('/');
    }
  }, [storyId, navigate]);

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (!storyId) return;
        const skip = sessionStorage.getItem('skipWizardCleanup');
        sessionStorage.removeItem('skipWizardCleanup');
        if (skip === 'true') return;
        const { data } = await supabase
          .from('story_characters')
          .select('character_id')
          .eq('story_id', storyId);
        if (!data || data.length === 0) {
          await supabase.rpc('delete_full_story', { story_id: storyId });
        }
      };
      cleanup();
    };
  }, [storyId, supabase]);

  const renderStep = () => {
    switch (currentStep) {
      case 'characters':
        return <CharactersStep />;
      case 'story':
        return <StoryStep />;
      case 'design':
        return <DesignStep />;
      case 'preview':
        return <PreviewStep />;
      case 'export':
        return <ExportStep />;
      default:
        return <CharactersStep />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-8">
      <StepIndicator />
      <div className="p-6">
        {renderStep()}
      </div>
      <WizardNav />
    </div>
  );
};

export default Wizard;