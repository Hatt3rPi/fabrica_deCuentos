import React from 'react';
import { useWizard, WizardStep } from '../../context/WizardContext';
import { UserRound, BookText, Palette, FileText, Heart, Download } from 'lucide-react';

const StepIndicator: React.FC = () => {
  const { currentStep } = useWizard();

  const steps: { id: WizardStep; label: string; icon: React.ReactElement }[] = [
    { id: 'characters', label: 'Personajes', icon: <UserRound className="w-5 h-5" /> },
    { id: 'story', label: 'Cuento', icon: <BookText className="w-5 h-5" /> },
    { id: 'design', label: 'Diseño', icon: <Palette className="w-5 h-5" /> },
    { id: 'preview', label: 'Vista Previa', icon: <FileText className="w-5 h-5" /> },
    { id: 'dedicatoria', label: 'Dedicatoria', icon: <Heart className="w-5 h-5" /> },
    { id: 'export', label: 'Descarga', icon: <Download className="w-5 h-5" /> },
  ];

  const getCurrentStepIndex = () => steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-gray-700 dark:to-gray-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = getCurrentStepIndex() > index;
            
            return (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1"
              >
                <div className="flex items-center w-full">
                  {index > 0 && (
                    <div 
                      className={`h-1 flex-1 ${
                        isCompleted || (isCurrent && index > 0)
                          ? 'bg-purple-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      isCurrent
                        ? 'bg-purple-600 ring-4 ring-purple-200 dark:ring-purple-800'
                        : isCompleted
                        ? 'bg-purple-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    {step.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 ${
                        isCompleted ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs sm:text-sm font-medium ${
                    isCurrent
                      ? 'text-purple-700 dark:text-purple-300'
                      : isCompleted
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;