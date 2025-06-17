import React from 'react';
import { useParams } from 'react-router-dom';
import { useWizard } from '../../../context/WizardContext';
import { BookOpen } from 'lucide-react';
import { storyService } from '../../../services/storyService';
import { useStory } from '../../../context/StoryContext';
import { OverlayLoader } from '../../UI/Loader';

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