import React, { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { Download, Copy, Check, Loader } from 'lucide-react';
import Button from '../../UI/Button';

const ExportStep: React.FC = () => {
  const { generatedPages } = useWizard();
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/story/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pages: generatedPages,
          saveToLibrary
        })
      });

      if (!response.ok) throw new Error('Error al exportar');
      
      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
    } catch (error) {
      console.error('Error:', error);
      alert('No pudimos crear tu PDF, inténtalo de nuevo');
    } finally {
      setIsExporting(false);
    }
  };

  const copyLink = async () => {
    if (downloadUrl) {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Exportar Cuento
        </h2>
        <p className="text-gray-600">
          Tu cuento está listo para ser descargado
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="saveToLibrary"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="saveToLibrary" className="text-gray-700">
            Guardar en mi biblioteca
          </label>
        </div>

        {!downloadUrl ? (
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Exportar PDF</span>
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <a
              href={downloadUrl}
              download
              className="block w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center"
            >
              <Download className="w-5 h-5 inline-block mr-2" />
              Descargar PDF
            </a>
            
            <button
              onClick={copyLink}
              className="w-full py-3 px-4 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copiar enlace</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportStep;