import React from 'react';
import { useWizard } from '../../context/WizardContext';
import CharactersStep from './steps/CharactersStep';
import StoryStep from './steps/StoryStep';
import DesignStep from './steps/DesignStep';
import PreviewStep from './steps/PreviewStep';
import WizardNav from './WizardNav';
import StepIndicator from './StepIndicator';

const Wizard: React.FC = () => {
  const { currentStep } = useWizard();

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