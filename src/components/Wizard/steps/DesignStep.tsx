import React, { useEffect, useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { useStory } from '../../../context/StoryContext';
import { useParams } from 'react-router-dom';
import { visualStyleOptions } from '../../../types';
import { Palette, Check, Loader, Lock } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../lib/image';
import { characterService } from '../../../services/characterService';
import { storyService } from '../../../services/storyService';
import { ThumbnailStyle } from '../../../types/character';
import { useWizardLockStatus } from '../../../hooks/useWizardLockStatus';

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
  const { designSettings, setDesignSettings, characters, generatedPages } = useWizard();
  const { covers } = useStory();
  const { storyId } = useParams();
  const [images, setImages] = useState<Record<string, string>>({});
  const coverState = storyId ? covers[storyId] : undefined;
  
  const { 
    isStepLocked, 
    getLockReason, 
    isLoading: isLockLoading, 
    error: lockError, 
    retry 
  } = useWizardLockStatus();
  
  const isLocked = isStepLocked('design');
  const lockReason = getLockReason('design');

  const selectedStyle = designSettings.visualStyle;
  const rawPreviewUrl =
    (selectedStyle &&
      (coverState?.variants?.[selectedStyle] ||
        (selectedStyle === 'default' ? coverState?.url : undefined))) ||
    (selectedStyle ? images[STYLE_TO_KEY[selectedStyle]] : undefined) ||
    (selectedStyle ? FALLBACK_IMAGES[selectedStyle] : undefined);

  const previewUrl = rawPreviewUrl
    ? getOptimizedImageUrl(rawPreviewUrl, { width: 512, quality: 80, format: 'webp' })
    : undefined;

  // Get individual variant status for each style
  const getVariantStatus = (styleValue: string) => {
    if (styleValue === 'default') {
      return coverState?.status || 'idle';
    }
    return coverState?.variantStatus?.[styleValue] || 'idle';
  };

  // Check if selected style is currently generating
  const isSelectedStyleGenerating = selectedStyle && getVariantStatus(selectedStyle) === 'generating';

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

  const handleChange = async (field: string, value: string) => {
    setDesignSettings({
      ...designSettings,
      [field]: value,
    });

    if (field === 'visualStyle' && storyId) {
      try {
        await storyService.upsertStoryDesign(storyId, {
          visualStyle: value,
          colorPalette: designSettings.colorPalette
        });
      } catch (error) {
        console.error('Error persisting visual style:', error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          {isLocked ? 'Diseño Visual - Solo Lectura' : 'Diseño Visual'}
        </h2>
        <p className="text-gray-600">
          {isLocked ? 'Vista de solo lectura del diseño' : 'Personaliza el aspecto visual de tu cuento'}
        </p>
      </div>

      {lockError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-red-800 dark:text-red-200">
            <span className="font-medium">Error al verificar estado del cuento</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-2 text-center">
            {lockError}
          </p>
          <button
            onClick={retry}
            className="mt-3 mx-auto block px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {isLocked && !lockError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Lock className="w-5 h-5" />
            <span className="font-medium">{lockReason}</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 text-center">
            El diseño visual ya no puede modificarse
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Estilo visual
              </label>
              {isLocked && (
                <div className="flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                  <Lock className="w-3 h-3 mr-1" />
                  {lockReason}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {visualStyleOptions.map((option) => {
                const key = STYLE_TO_KEY[option.value];
                const src = getOptimizedImageUrl(
                  images[key] || FALLBACK_IMAGES[option.value],
                  { width: 256, quality: 80, format: 'webp' }
                );
                const hasCover =
                  option.value === 'default'
                    ? !!coverState?.url
                    : !!coverState?.variants?.[option.value];
                const variantStatus = getVariantStatus(option.value);
                const isGenerating = variantStatus === 'generating';
                const hasError = variantStatus === 'error';
                const isCurrentlySelected = designSettings.visualStyle === option.value;
                const isDisabled = (isLocked || isLockLoading || lockError) && !isCurrentlySelected;
                
                return (
                  <div
                    key={option.value}
                    onClick={() => !isDisabled && handleChange('visualStyle', option.value)}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center relative ${
                      isDisabled
                        ? 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50'
                        : isCurrentlySelected
                        ? 'cursor-pointer border-purple-500 bg-purple-50'
                        : 'cursor-pointer border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <div className="w-full aspect-square mb-2 overflow-hidden rounded-md bg-gray-100 relative">
                      <img
                        src={src}
                        alt={option.label}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Individual loading state for this style */}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader className="w-6 h-6 text-purple-600 animate-spin" />
                        </div>
                      )}
                      
                      {/* Success indicator */}
                      {hasCover && !isGenerating && (
                        <span className="absolute top-1 right-1 text-purple-600 bg-white/80 rounded-full p-0.5">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                      
                      {/* Error indicator */}
                      {hasError && (
                        <span className="absolute top-1 right-1 text-red-600 bg-white/80 rounded-full p-0.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      
                      {/* Lock indicator for disabled styles */}
                      {isDisabled && (
                        <span className="absolute top-1 left-1 text-gray-600 bg-white/80 rounded-full p-0.5">
                          <Lock className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 text-center">{option.label}</h3>
                  </div>
                );
              })}
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

          <div className="aspect-square rounded-lg overflow-hidden bg-white shadow-md flex items-center justify-center relative">
            {selectedStyle ? (
              <>
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                
                {/* Loading state for selected style in preview */}
                {isSelectedStyleGenerating && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                    <p className="text-sm text-purple-600 font-medium">
                      Generando portada...
                    </p>
                  </div>
                )}
              </>
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