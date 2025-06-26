import React from 'react';
import { useParams } from 'react-router-dom';
import { useWizard } from '../../../context/WizardContext';
import { BookOpen, Lock } from 'lucide-react';
import { storyService } from '../../../services/storyService';
import { useStory } from '../../../context/StoryContext';
import { OverlayLoader } from '../../UI/Loader';
import { useWizardLockStatus } from '../../../hooks/useWizardLockStatus';

const StoryStep: React.FC = () => {
  const {
    characters,
    storySettings,
    designSettings,
    generatedPages,
    setStorySettings,
    setGeneratedPages,
    setIsGenerating,
    updateStoryTitle,
  } = useWizard();
  const { generateCover, generateCoverVariants } = useStory();
  const { storyId } = useParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [generated, setGenerated] = React.useState<{ title: string; paragraphs: string[] } | null>(null);
  const [loaders, setLoaders] = React.useState<string[]>([]);
  
  const { 
    isStepLocked, 
    getLockReason, 
    isLoading: isLockLoading, 
    error: lockError, 
    retry 
  } = useWizardLockStatus();
  
  const isLocked = isStepLocked('story');
  const lockReason = getLockReason('story');

  const handleFallback = () => {
    setIsLoading(false);
    setIsGenerating(false);
  };


  React.useEffect(() => {
    if (!generated && generatedPages && generatedPages.length > 0) {
      // Obtener todos los párrafos ordenados por número de página
      const allParagraphs = generatedPages
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map(p => p.text)
        .filter(text => text && text.trim().length > 0);
      
      const cover = generatedPages.find(p => p.pageNumber === 0);
      setGenerated({ 
        title: cover ? cover.text : (allParagraphs[0] || ''), 
        paragraphs: allParagraphs 
      });
    }
  }, [generatedPages, generated]);

  const characterNames = characters.map(c => c.name).join(' y ');
  const suggestions = [
    `Una aventura donde ${characterNames} descubren un tesoro`,
    `El día que ${characterNames} salvaron su pueblo`,
    `Cómo ${characterNames} aprendieron el valor de la amistad`
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    setGenerated(null);
    setLoaders([]);
    try {
      const result = await storyService.generateStory({
        storyId: storyId!,
        theme: storySettings.theme,
        characters,
        settings: storySettings
      });
      if (result && result.title && Array.isArray(result.paragraphs)) {
        setGenerated(result);
        // Actualizar el título en el estado del wizard para que se persista correctamente
        updateStoryTitle(result.title);
        const draft = await storyService.getStoryDraft(storyId!);
        if (draft.pages) {
          const mapped = draft.pages.map(p => ({
            id: p.id,
            pageNumber: p.page_number,
            text: p.text,
            imageUrl: p.image_url,
            prompt: p.prompt,
          }));
          setGeneratedPages(mapped);
        }
        if (Array.isArray(draft.story.loader)) {
          setLoaders(draft.story.loader as string[]);
        }
        const coverUrl = await generateCover(
          storyId!,
          result.title,
          {
            style: designSettings.visualStyle,
            palette: designSettings.colorPalette,
            refIds: characters.map(c => c.thumbnailUrl || '').filter(Boolean)
          }
        );

        if (coverUrl) {
          generateCoverVariants(storyId!, coverUrl);
        }

      } else {
        alert('Respuesta inválida');
      }
    } catch (err) {
      console.error('Error generating story:', err);
      alert('No fue posible generar la historia');
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
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
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          {isLocked ? 'Configuración de Historia - Solo Lectura' : 'Configura tu Historia'}
        </h2>
        <p className="text-gray-600">
          {isLocked ? 'Vista de solo lectura de tu configuración' : 'Define los elementos clave que darán forma a tu cuento'}
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
            La configuración de historia ya no puede modificarse
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Temática del cuento
              </label>
              {isLocked && (
                <div className="flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                  <Lock className="w-3 h-3 mr-1" />
                  {lockReason}
                </div>
              )}
            </div>
            <textarea
              value={storySettings.theme}
              onChange={(e) => !isLocked && handleChange('theme', e.target.value)}
              placeholder={isLocked ? "Temática bloqueada" : "Describe la temática de tu cuento..."}
              disabled={isLocked || isLockLoading || lockError}
              className={`w-full h-24 px-4 py-2 border border-gray-300 rounded-lg resize-none ${
                isLocked || isLockLoading || lockError
                  ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                  : 'focus:ring-2 focus:ring-purple-500 focus:border-transparent'
              }`}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => !isLocked && handleChange('theme', s)}
                  disabled={isLocked || isLockLoading || lockError}
                  className={`text-xs px-2 py-1 rounded ${
                    isLocked || isLockLoading || lockError
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-100 hover:bg-purple-200'
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => !isLocked && handleSurprise()}
                disabled={isLocked || isLockLoading || lockError}
                className={`text-xs px-2 py-1 rounded ${
                  isLocked || isLockLoading || lockError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                Sorpréndeme
              </button>
            </div>
          </div>

          {/* La sección de estilos literarios ha sido removida y respaldada en /src/components/Wizard/steps/backup/LiteraryStyleSelector.tsx */}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">
              Tu cuento completo
            </h3>
          </div>
          {generated ? (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-purple-700">{generated.title}</h3>
              <div className="text-sm text-gray-600 mb-2">
                📖 Cuento completo ({generated.paragraphs.length} párrafos)
              </div>
              <textarea
                readOnly
                value={generated.paragraphs.join('\n\n')}
                className="w-full h-[450px] px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 resize-none leading-relaxed"
              />
            </div>
          ) : (
            <textarea
              value={storySettings.additionalDetails}
              readOnly
              placeholder="Aquí aparecerá tu cuento completo una vez generado. Contiene todos los 8 párrafos de la historia."
              className="w-full h-[450px] px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 resize-none"
            />
          )}
        </div>
      </div>

      <div className="text-center space-y-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || !storySettings.theme || isLocked || isLockLoading || lockError}
          className={`px-5 py-2 rounded-lg flex items-center justify-center gap-2 ${
            !storySettings.theme || isLoading || isLocked || isLockLoading || lockError
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isLocked 
            ? `Historia bloqueada: ${lockReason}` 
            : isLoading 
            ? 'Generando...' 
            : 'Generar la Historia'
          }
        </button>

        {generated && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || isLocked || isLockLoading || lockError}
              className={`mt-4 px-4 py-2 rounded ${
                isLoading || isLocked || isLockLoading || lockError
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {isLocked 
                ? 'Regeneración bloqueada' 
                : isLoading 
                ? 'Generando...' 
                : 'Generar nuevamente'
              }
            </button>
          </div>
        )}
      </div>
      {isLoading && (
        <OverlayLoader
          etapa="cuento_fase1"
          context={{ personaje: characters[0]?.name || 'tus personajes' }}
          messages={loaders}
          onFallback={handleFallback}
        />
      )}
    </div>
  );
};

export default StoryStep;