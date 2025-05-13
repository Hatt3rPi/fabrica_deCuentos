import React from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ageOptions, styleOptions, messageOptions } from '../../../types';
import { BookOpen } from 'lucide-react';

const StoryStep: React.FC = () => {
  const { storySettings, setStorySettings } = useWizard();

  const handleChange = (field: string, value: string) => {
    setStorySettings({
      ...storySettings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Configura tu Historia</h2>
        <p className="text-gray-600">
          Define los elementos clave que darán forma a tu cuento
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edad objetivo
            </label>
            <select
              value={storySettings.targetAge}
              onChange={(e) => handleChange('targetAge', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecciona una edad</option>
              {ageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estilo literario
            </label>
            <div className="grid grid-cols-2 gap-4">
              {styleOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleChange('literaryStyle', option.value)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    storySettings.literaryStyle === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 mb-2">{option.label}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{option.example}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje central
            </label>
            <select
              value={storySettings.centralMessage}
              onChange={(e) => handleChange('centralMessage', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecciona un mensaje</option>
              {messageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">
              Detalles adicionales
            </h3>
          </div>
          <textarea
            value={storySettings.additionalDetails}
            onChange={(e) => handleChange('additionalDetails', e.target.value)}
            placeholder="Añade detalles específicos para tu historia, como elementos especiales que quieras incluir, temas a evitar, o cualquier otra consideración importante..."
            className="w-full h-[250px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default StoryStep;