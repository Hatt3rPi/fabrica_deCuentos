import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import { useAuth } from '../../context/AuthContext';
import { useWizardFlowStore } from '../../stores/wizardFlowStore';
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
  const { skipCleanup, setSkipCleanup } = useWizardFlowStore();

  useEffect(() => {
    setSkipCleanup(false);
  }, [setSkipCleanup]);

  useEffect(() => {
    if (!storyId) {
      navigate('/');
    }
  }, [storyId, navigate]);

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (!storyId) return;
        if (skipCleanup) {
          setSkipCleanup(false);
          return;
        }
        const { data, error } = await supabase
          .from('story_characters')
          .select('character_id')
          .eq('story_id', storyId);
        if (error) {
          console.error('[Wizard] cleanup select error:', error);
          return;
        }
        console.log('[Wizard] cleanup characters found:', data?.length || 0);
        if (!data || data.length === 0) {
          const { error: delError } = await supabase.rpc('delete_full_story', { story_id: storyId });
          if (delError) {
            console.error('[Wizard] delete_full_story error:', delError);
          } else {
            console.log('[Wizard] delete_full_story success');
          }
        }
      };
      cleanup();
    };
  }, [storyId, supabase, skipCleanup, setSkipCleanup]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!storyId) return;
      const { data, error } = await supabase
        .from('story_characters')
        .select('character_id')
        .eq('story_id', storyId);
      if (error) {
        console.error('[Wizard] beforeunload select error:', error);
        return;
      }
      if (!data || data.length === 0) {
        const { error: delError } = await supabase.rpc('delete_full_story', { story_id: storyId });
        if (delError) {
          console.error('[Wizard] beforeunload delete error:', delError);
        } else {
          console.log('[Wizard] beforeunload delete success');
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
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