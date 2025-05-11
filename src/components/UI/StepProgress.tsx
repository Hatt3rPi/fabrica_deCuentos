import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between w-full mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="relative">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                index < currentStep
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : index === currentStep
                  ? 'border-purple-600 text-purple-600'
                  : 'border-gray-300 text-gray-300'
              }`}
            >
              {index < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span
              className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm ${
                index <= currentStep ? 'text-purple-600' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-full mx-4 ${
                index < currentStep ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepProgress;