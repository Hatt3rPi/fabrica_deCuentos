import React from 'react';
import { useWizard } from '../../../context/WizardContext';
import { visualStyleOptions, colorPaletteOptions } from '../../../types';
import { Palette, Brush } from 'lucide-react';

const DesignStep: React.FC = () => {
  const { designSettings, setDesignSettings } = useWizard();

  const handleChange = (field: string, value: string) => {
    setDesignSettings({
      ...designSettings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Diseño Visual</h2>
        <p className="text-gray-600">
          Personaliza el aspecto visual de tu cuento
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estilo visual
            </label>
            <select
              value={designSettings.visualStyle}
              onChange={(e) => handleChange('visualStyle', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecciona un estilo</option>
              {visualStyleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paleta de colores
            </label>
            <select
              value={designSettings.colorPalette}
              onChange={(e) => handleChange('colorPalette', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Selecciona una paleta</option>
              {colorPaletteOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">
              Vista previa del estilo
            </h3>
          </div>

          <div className="aspect-square rounded-lg overflow-hidden bg-white shadow-md">
            {designSettings.visualStyle && designSettings.colorPalette ? (
              <div className="w-full h-full flex items-center justify-center">
                <Brush className="w-16 h-16 text-purple-600" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6 text-center">
                <p className="text-gray-500">
                  Selecciona un estilo visual y una paleta de colores para ver una vista previa
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignStep;