import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import CharactersStep from './steps/CharactersStep';
import StoryStep from './steps/StoryStep';
import DesignStep from './steps/DesignStep';
import PreviewStep from './steps/PreviewStep';
import ExportStep from './steps/ExportStep';
import WizardNav from './WizardNav';
import StepIndicator from './StepIndicator';

const Wizard: React.FC = () => {
  const { currentStep, setCurrentStep } = useWizard();
  const { storyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!storyId) {
      navigate('/');
    }
  }, [storyId, navigate]);

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