import React from 'react';
import { useWizard } from '../../../context/WizardContext';
import { ageOptions, styleOptions, messageOptions } from '../../../types';
import { BookOpen } from 'lucide-react';
import { storyService } from '../../../services/storyService';

const StoryStep: React.FC = () => {
  const { characters, storySettings, setStorySettings } = useWizard();
  const [isLoading, setIsLoading] = React.useState(false);
  const [generated, setGenerated] = React.useState<{ title: string; paragraphs: string[] } | null>(null);

  const characterNames = characters.map(c => c.name).join(' y ');
  const suggestions = [
    `Una aventura donde ${characterNames} descubren un tesoro`,
    `El día que ${characterNames} salvaron su pueblo`,
    `Cómo ${characterNames} aprendieron el valor de la amistad`
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    setGenerated(null);
    try {
      const result = await storyService.generateStory({
        theme: storySettings.theme,
        characters,
        settings: storySettings
      });
      if (result && result.title && Array.isArray(result.paragraphs)) {
        setGenerated(result);
      } else {
        alert('Respuesta inválida');
      }
    } catch (err) {
      console.error('Error generating story:', err);
      alert('No fue posible generar la historia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSurprise = () => {
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    handleChange('theme', random);
  };

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
              Temática del cuento
            </label>
            <textarea
              value={storySettings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              placeholder="Describe la temática de tu cuento..."
              className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChange('theme', s)}
                  className="text-xs bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded"
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSurprise}
                className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
              >
                Sorpréndeme
              </button>
            </div>
          </div>
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
                  className={`group cursor-pointer p-4 rounded-lg border-2 transition-all relative overflow-hidden ${
                    storySettings.literaryStyle === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 mb-2">{option.label}</h3>
                  <div className="relative">
                    <p className="text-sm text-gray-600 line-clamp-2 group-hover:line-clamp-none">
                      {option.example}
                    </p>
                    {/* Overlay that appears on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none" />
                  </div>
                  {/* Expanded text that shows on hover */}
                  <div className="absolute inset-0 bg-white p-4 opacity-0 group-hover:opacity-100 transition-opacity overflow-y-auto">
                    <h3 className="font-medium text-gray-900 mb-2">{option.label}</h3>
                    <p className="text-sm text-gray-600">{option.example}</p>
                  </div>
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

      <div className="text-center space-y-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !storySettings.theme}
          className={`px-5 py-2 rounded-lg flex items-center justify-center gap-2 ${
            !storySettings.theme || isLoading
              ? 'bg-gray-300 text-gray-500'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isLoading ? 'Generando...' : 'Generar la Historia'}
        </button>

        {generated && (
          <div className="mt-6 space-y-3 text-left">
            <h3 className="text-xl font-bold text-purple-700 text-center">
              {generated.title}
            </h3>
            {generated.paragraphs.map((p, i) => (
              <p key={i} className="text-gray-700">
                {p}
              </p>
            ))}
            <div className="text-center">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                {isLoading ? 'Generando...' : 'Generar nuevamente'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryStep;