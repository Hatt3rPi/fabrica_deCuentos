import React from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { WizardStep } from '../../context/WizardContext';
import WizardNav from './WizardNav';
import StepIndicator from './StepIndicator';

const Wizard: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const location = useLocation();
  
  const getCurrentStep = (): WizardStep => {
    const path = location.pathname.split('/').pop();
    switch (path) {
      case 'personajes': return 'characters';
      case 'historia': return 'story';
      case 'diseno': return 'design';
      case 'vista-previa': return 'preview';
      case 'exportacion': return 'export';
      default: return 'characters';
    }
  };

  if (!storyId) {
    return <div>Error: No story ID provided</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 mb-8">
      <StepIndicator currentStep={getCurrentStep()} />
      <div className="p-6">
        <Outlet />
      </div>
      <WizardNav currentStep={getCurrentStep()} />
    </div>
  );
};

export default Wizard;
