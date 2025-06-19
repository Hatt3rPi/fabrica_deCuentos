import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { styleConfigService } from '../../../../services/styleConfigService';
import { StyleTemplate } from '../../../../types/styleConfig';

interface TemplatesModalProps {
  onClose: () => void;
  onSelect: (template: StyleTemplate) => void;
}

const CATEGORY_LABELS = {
  classic: 'Clásico',
  modern: 'Moderno',
  playful: 'Infantil',
  elegant: 'Elegante'
};

const CATEGORY_COLORS = {
  classic: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  modern: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  playful: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  elegant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
};

const TemplatesModal: React.FC<TemplatesModalProps> = ({ onClose, onSelect }) => {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await styleConfigService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  const renderTemplatePreview = (template: StyleTemplate) => {
    const coverStyle = template.configData.cover_config.title;
    const pageStyle = template.configData.page_config.text;

    return (
      <div className="space-y-2">
        {/* Mini preview de portada */}
        <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded relative overflow-hidden">
          <div 
            className="absolute inset-0 flex items-center justify-center p-2"
            style={{
              background: coverStyle.containerStyle.background,
              borderRadius: coverStyle.containerStyle.borderRadius
            }}
          >
            <div 
              className="text-center text-xs font-bold truncate"
              style={{
                color: coverStyle.color,
                textShadow: coverStyle.textShadow,
                fontFamily: coverStyle.fontFamily
              }}
            >
              Título de Ejemplo
            </div>
          </div>
        </div>

        {/* Mini preview de página */}
        <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded relative overflow-hidden">
          <div 
            className="absolute bottom-0 left-0 right-0 p-2"
            style={{
              background: pageStyle.containerStyle.background || pageStyle.containerStyle.gradientOverlay,
              minHeight: '40%'
            }}
          >
            <div 
              className="text-xs truncate"
              style={{
                color: pageStyle.color,
                textShadow: pageStyle.textShadow,
                fontFamily: pageStyle.fontFamily,
                textAlign: pageStyle.textAlign
              }}
            >
              Texto de ejemplo...
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Seleccionar Template
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                    selectedTemplate?.id === template.id
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Premium badge */}
                  {template.isPremium && (
                    <div className="absolute top-2 right-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}

                  {/* Selection indicator */}
                  {selectedTemplate?.id === template.id && (
                    <div className="absolute top-2 left-2">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Template info */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {template.name}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      CATEGORY_COLORS[template.category]
                    }`}>
                      {CATEGORY_LABELS[template.category]}
                    </span>
                  </div>

                  {/* Preview */}
                  {renderTemplatePreview(template)}
                </button>
              ))}
            </div>
          )}

          {/* No templates message */}
          {!loading && templates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No hay templates disponibles
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Aplicar Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;