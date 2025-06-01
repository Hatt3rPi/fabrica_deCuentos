import React, { useEffect, useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { visualStyleOptions, colorPaletteOptions } from '../../../types';
import { Palette } from 'lucide-react';
import { characterService } from '../../../services/characterService';
import { ThumbnailStyle } from '../../../types/character';

const STYLE_TO_KEY: Record<string, ThumbnailStyle | 'default'> = {
  default: 'default',
  acuarela: 'acuarela',
  bordado: 'bordado',
  kawaii: 'kawaii',
  dibujado: 'mano',
  recortes: 'recortes',
};

const FALLBACK_IMAGES: Record<string, string> = {
  default: 'storage/fallback-images/miniatura.jpeg',
  acuarela: 'storage/fallback-images/miniatura_acuarela.png',
  bordado: 'storage/fallback-images/miniatura_bordado.png',
  kawaii: 'storage/fallback-images/miniatura_kawaii.png',
  dibujado: 'storage/fallback-images/miniatura_mano.png',
  recortes: 'storage/fallback-images/miniatura_recortes.png',
};

const DesignStep: React.FC = () => {
  const { designSettings, setDesignSettings, characters } = useWizard();
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (!characters.length) return;
      const character = characters[0];
      const map: Record<string, string> = { default: character.thumbnailUrl || '' };
      try {
        const thumbs = await characterService.getThumbnailsByCharacter(character.id);
        thumbs.forEach(t => {
          map[t.style_type] = t.url;
        });
      } catch (err) {
        console.error('Error loading thumbnails', err);
      }
      setImages(map);
    };

    load();
  }, [characters]);

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
            <div className="grid grid-cols-2 gap-4">
              {visualStyleOptions.map((option) => {
                const key = STYLE_TO_KEY[option.value];
                const src = images[key] || FALLBACK_IMAGES[option.value];
                return (
                  <div
                    key={option.value}
                    onClick={() => handleChange('visualStyle', option.value)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                      designSettings.visualStyle === option.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="w-full aspect-square mb-2 overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={src}
                        alt={option.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-gray-900 text-center">{option.label}</h3>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paleta de colores
            </label>
            <div className="grid grid-cols-2 gap-4">
              {colorPaletteOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleChange('colorPalette', option.value)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    designSettings.colorPalette === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <h3 className="font-medium text-gray-900 mb-2">{option.label}</h3>
                  <div className="flex gap-1">
                    {option.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">
              Vista previa del estilo
            </h3>
          </div>

          <div className="aspect-square rounded-lg overflow-hidden bg-white shadow-md flex items-center justify-center">
            {designSettings.visualStyle ? (
              <img
                src={images[STYLE_TO_KEY[designSettings.visualStyle]] || FALLBACK_IMAGES[designSettings.visualStyle]}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6 text-center">
                <p className="text-gray-500">
                  Selecciona un estilo visual para ver una vista previa
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