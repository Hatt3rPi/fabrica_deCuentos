import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Wizard from '../components/Wizard/Wizard';
import { useWizard } from '../context/WizardContext';
import { useStory } from '../context/StoryContext';

const StoryCreationWizard: React.FC = () => {
  const { storyId } = useParams();
  const { designSettings, storySettings, currentStep } = useWizard();
  const { generateCover } = useStory();
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!requested && currentStep === 'export' && storyId) {
      setRequested(true);
      generateCover(storyId, storySettings.theme || storySettings.centralMessage || '');
    }
  }, [currentStep, requested, storyId]);

  return <Wizard />;
};

export default StoryCreationWizard;
