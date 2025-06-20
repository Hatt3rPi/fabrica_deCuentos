import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  Layout, 
  Grid3x3, 
  Ruler, 
  ZoomIn, 
  ZoomOut,
  Palette,
  Type,
  Move,
  Layers,
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  Image,
  X,
  Zap
} from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { styleConfigService } from '../../../services/styleConfigService';
import { StoryStyleConfig, StyleTemplate, DEFAULT_COVER_CONFIG, DEFAULT_PAGE_CONFIG } from '../../../types/styleConfig';
import StylePreview from './components/StylePreview';
import TypographyPanel from './components/TypographyPanel';
import PositionPanel from './components/PositionPanel';
import ColorPanel from './components/ColorPanel';
import EffectsPanel from './components/EffectsPanel';
import ContainerPanel from './components/ContainerPanel';
import TemplatesModal from './components/TemplatesModal';
import ImageUploader from './components/ImageUploader';
import TextEditor from './components/TextEditor';
import CreateTemplateModal from './components/CreateTemplateModal';

// Texto de muestra para preview
const SAMPLE_TEXTS = {
  cover: 'El Mágico Viaje de Luna',
  page: 'Luna caminaba por el sendero del bosque encantado, donde las luciérnagas bailaban entre los árboles iluminando su camino. El viento susurraba secretos antiguos mientras las hojas doradas crujían bajo sus pequeños pies.'
};

const AdminStyleEditor: React.FC = () => {
  const { createNotification } = useNotifications();
  
  // Estados principales
  const [activeConfig, setActiveConfig] = useState<StoryStyleConfig | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<StyleTemplate | null>(null);
  
  const [originalConfig, setOriginalConfig] = useState<StoryStyleConfig | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [customCoverImage, setCustomCoverImage] = useState<string>('');
  const [customPageImage, setCustomPageImage] = useState<string>('');
  const [customCoverText, setCustomCoverText] = useState<string>(SAMPLE_TEXTS.cover);
  const [customPageText, setCustomPageText] = useState<string>(SAMPLE_TEXTS.page);
  const [currentPageType, setCurrentPageType] = useState<'cover' | 'page'>('cover');
  const [activePanel, setActivePanel] = useState<string>('typography');
  
  // Estados de UI
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Cargar template activo y imagen de muestra
  useEffect(() => {
    loadActiveTemplate();
    loadSampleImage();
  }, []);

  // Detectar cambios
  useEffect(() => {
    if (originalConfig) {
      const hasConfigChanges = JSON.stringify(activeConfig) !== JSON.stringify(originalConfig);
      const hasImageChanges = 
        (originalConfig.coverBackgroundUrl || '') !== customCoverImage ||
        (originalConfig.pageBackgroundUrl || '') !== customPageImage;
      const hasTextChanges = 
        (originalConfig.coverSampleText || SAMPLE_TEXTS.cover) !== customCoverText ||
        (originalConfig.pageSampleText || SAMPLE_TEXTS.page) !== customPageText;
      setIsDirty(hasConfigChanges || hasImageChanges || hasTextChanges);
    }
  }, [activeConfig, originalConfig, customCoverImage, customPageImage, customCoverText, customPageText]);

  const loadActiveTemplate = async () => {
    try {
      setIsLoading(true);
      const template = await styleConfigService.getActiveTemplate();
      if (template) {
        setActiveTemplate(template);
        
        // Convertir template a config para compatibilidad
        const config: StoryStyleConfig = {
          id: template.id,
          name: template.name,
          coverConfig: template.configData.cover_config,
          pageConfig: template.configData.page_config,
          // Las imágenes custom son solo para preview del editor
          coverBackgroundUrl: undefined,
          pageBackgroundUrl: undefined,
          coverSampleText: undefined,
          pageSampleText: undefined
        };
        
        setActiveConfig(config);
        setOriginalConfig(config);
        
        // Limpiar imágenes custom (solo para admin/styles)
        setCustomCoverImage('');
        setCustomPageImage('');
        setCustomCoverText(SAMPLE_TEXTS.cover);
        setCustomPageText(SAMPLE_TEXTS.page);
      }
    } catch (error) {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        'No se pudo cargar el template activo',
        NotificationPriority.HIGH
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleImage = async () => {
    const image = await styleConfigService.getRandomSampleImage();
    if (image) {
      setPreviewImage(image);
    }
  };

  const handleSave = async () => {
    if (!activeConfig || !activeTemplate) {
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        'No hay template activo para guardar',
        NotificationPriority.HIGH
      );
      return;
    }

    try {
      setIsSaving(true);
      
      // Actualizar template activo con las configuraciones editadas
      const templateUpdate: Partial<StyleTemplate> = {
        name: activeConfig.name,
        configData: {
          cover_config: activeConfig.coverConfig,
          page_config: activeConfig.pageConfig
        }
      };
      
      console.log('Updating active template:', templateUpdate);
      
      const result = await styleConfigService.updateActiveTemplate(templateUpdate);

      if (result) {
        setActiveTemplate(result);
        
        // Actualizar config local
        const updatedConfig = {
          ...activeConfig,
          id: result.id,
          name: result.name
        };
        setActiveConfig(updatedConfig);
        setOriginalConfig(updatedConfig);
        setIsDirty(false);
        
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Éxito',
          'Template activo actualizado correctamente',
          NotificationPriority.MEDIUM
        );
      } else {
        throw new Error('No se recibió respuesta del servidor');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        `No se pudo guardar el template: ${error.message}`,
        NotificationPriority.HIGH
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setActiveConfig(originalConfig);
      setCustomCoverImage(originalConfig.coverBackgroundUrl || '');
      setCustomPageImage(originalConfig.pageBackgroundUrl || '');
      setCustomCoverText(originalConfig.coverSampleText || SAMPLE_TEXTS.cover);
      setCustomPageText(originalConfig.pageSampleText || SAMPLE_TEXTS.page);
      setIsDirty(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const updateCoverConfig = useCallback((updates: any) => {
    setActiveConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        coverConfig: {
          ...prev.coverConfig,
          title: {
            ...prev.coverConfig.title,
            ...updates
          }
        }
      };
    });
  }, []);

  const updatePageConfig = useCallback((updates: any) => {
    setActiveConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pageConfig: {
          ...prev.pageConfig,
          text: {
            ...prev.pageConfig.text,
            ...updates
          }
        }
      };
    });
  }, []);

  const updateContainerStyle = useCallback((containerUpdates: any) => {
    if (currentPageType === 'cover') {
      setActiveConfig(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          coverConfig: {
            ...prev.coverConfig,
            title: {
              ...prev.coverConfig.title,
              containerStyle: {
                ...prev.coverConfig.title.containerStyle,
                ...containerUpdates
              }
            }
          }
        };
      });
    } else {
      setActiveConfig(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          pageConfig: {
            ...prev.pageConfig,
            text: {
              ...prev.pageConfig.text,
              containerStyle: {
                ...prev.pageConfig.text.containerStyle,
                ...containerUpdates
              }
            }
          }
        };
      });
    }
  }, [currentPageType]);

  const getCurrentConfig = () => {
    if (!activeConfig) {
      return currentPageType === 'cover' 
        ? DEFAULT_COVER_CONFIG.title 
        : DEFAULT_PAGE_CONFIG.text;
    }
    return currentPageType === 'cover' 
      ? activeConfig.coverConfig.title 
      : activeConfig.pageConfig.text;
  };

  const handleTemplateSelect = async (template: any) => {
    try {
      // Activar el template seleccionado
      const success = await styleConfigService.activateTemplate(template.id);
      
      if (success) {
        // Recargar el template activo
        await loadActiveTemplate();
        setShowTemplates(false);
        
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Éxito',
          `Template "${template.name}" activado correctamente`,
          NotificationPriority.MEDIUM
        );
      } else {
        throw new Error('No se pudo activar el template');
      }
    } catch (error) {
      console.error('Error activating template:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        `Error al activar template: ${error.message}`,
        NotificationPriority.HIGH
      );
    }
  };

  const handleCreateTemplate = async (templateData: any) => {
    try {
      console.log('Attempting to create template with data:', templateData);
      const result = await styleConfigService.createTemplate(templateData);
      console.log('Template creation result:', result);
      
      if (result) {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Éxito',
          'Template creado correctamente',
          NotificationPriority.MEDIUM
        );
        setShowCreateTemplate(false);
      } else {
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error',
          'No se pudo crear el template - resultado falso',
          NotificationPriority.HIGH
        );
      }
    } catch (error) {
      console.error('Error in handleCreateTemplate:', error);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        `Error al crear template: ${error.message}`,
        NotificationPriority.HIGH
      );
    }
  };

  // Ya no se necesita esta función porque siempre editamos el template activo
  // Mantener por compatibilidad pero redirigir a save
  const handleActivateStyle = async () => {
    createNotification(
      NotificationType.SYSTEM_UPDATE,
      'Info',
      'Ya estás editando el template activo. Los cambios se aplican al guardar.',
      NotificationPriority.MEDIUM
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando editor de estilos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setShowMobileSidebar(!showMobileSidebar)}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Editor de Estilos</h1>
            {activeTemplate && (
              <span className="text-sm text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-md">
                Editando: {activeTemplate.name}
              </span>
            )}
            {isDirty && (
              <span className="text-sm text-amber-600 dark:text-amber-400">• Sin guardar</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <Layout className="w-4 h-4" />
                Templates
              </button>
              <button
                onClick={() => setShowCreateTemplate(true)}
                className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Crear Template
              </button>
            </div>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block" />
            
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors hidden sm:block"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center hidden sm:block">
              {zoomLevel}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors hidden sm:block"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
            
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid 
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowRulers(!showRulers)}
              className={`p-2 rounded-lg transition-colors ${
                showRulers 
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Ruler className="w-4 h-4" />
            </button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
            
            <button
              onClick={handleReset}
              disabled={!isDirty}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Resetear
            </button>
            
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </button>
            
            <div className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Template Activo
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Control Panels */}
        <div className={`
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 fixed md:relative z-40 md:z-auto
          w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          overflow-y-auto transition-transform duration-300 h-full
        `}>
          <div className="p-4">
            {/* Close button for mobile */}
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="md:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Panel Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActivePanel('typography')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'typography'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Type className="w-4 h-4 inline mr-1" />
                Tipografía
              </button>
              <button
                onClick={() => setActivePanel('position')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'position'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Move className="w-4 h-4 inline mr-1" />
                Posición
              </button>
            </div>

            <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActivePanel('colors')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'colors'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Palette className="w-4 h-4 inline mr-1" />
                Colores
              </button>
              <button
                onClick={() => setActivePanel('effects')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'effects'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Efectos
              </button>
              <button
                onClick={() => setActivePanel('container')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'container'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Contenedor
              </button>
            </div>

            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActivePanel('images')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'images'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Image className="w-4 h-4 inline mr-1" />
                Imágenes
              </button>
              <button
                onClick={() => setActivePanel('text')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'text'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Type className="w-4 h-4 inline mr-1" />
                Texto
              </button>
            </div>

            {/* Active Panel Content */}
            {activePanel === 'typography' && activeConfig && (
              <TypographyPanel
                config={getCurrentConfig()}
                onChange={currentPageType === 'cover' ? updateCoverConfig : updatePageConfig}
              />
            )}
            
            {activePanel === 'position' && activeConfig && (
              <PositionPanel
                config={getCurrentConfig()}
                onChange={currentPageType === 'cover' ? updateCoverConfig : updatePageConfig}
                pageType={currentPageType}
              />
            )}
            
            {activePanel === 'colors' && activeConfig && (
              <ColorPanel
                config={getCurrentConfig()}
                onChange={currentPageType === 'cover' ? updateCoverConfig : updatePageConfig}
              />
            )}
            
            {activePanel === 'effects' && activeConfig && (
              <EffectsPanel
                containerStyle={getCurrentConfig().containerStyle}
                onChange={updateContainerStyle}
              />
            )}
            
            {activePanel === 'container' && activeConfig && (
              <ContainerPanel
                containerStyle={getCurrentConfig().containerStyle}
                onChange={updateContainerStyle}
                pageType={currentPageType}
              />
            )}
            
            {activePanel === 'images' && (
              <div className="space-y-6">
                <ImageUploader
                  currentImage={customCoverImage}
                  onImageChange={setCustomCoverImage}
                  label="Imagen de fondo para Portada"
                  pageType="cover"
                />
                <ImageUploader
                  currentImage={customPageImage}
                  onImageChange={setCustomPageImage}
                  label="Imagen de fondo para Páginas Interiores"
                  pageType="page"
                />
              </div>
            )}
            
            {activePanel === 'text' && (
              <TextEditor
                coverText={customCoverText}
                pageText={customPageText}
                onCoverTextChange={setCustomCoverText}
                onPageTextChange={setCustomPageText}
                currentPageType={currentPageType}
              />
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 md:p-8 overflow-auto">
          <div className="w-full mx-auto">
            {/* Page Type Switcher */}
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 inline-flex w-full max-w-xs md:w-auto">
                <button
                  onClick={() => setCurrentPageType('cover')}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageType === 'cover'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Portada
                </button>
                <button
                  onClick={() => setCurrentPageType('page')}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageType === 'page'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Página Interior</span>
                  <span className="sm:hidden">Interior</span>
                </button>
              </div>
            </div>

            {/* Preview Component */}
            {activeConfig ? (
              <StylePreview
                config={activeConfig}
                pageType={currentPageType}
                sampleImage={currentPageType === 'cover' 
                  ? (customCoverImage || previewImage)
                  : (customPageImage || previewImage)
                }
                sampleText={currentPageType === 'cover' ? customCoverText : customPageText}
                showGrid={showGrid}
                showRulers={showRulers}
                zoomLevel={zoomLevel}
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <p className="text-gray-500 dark:text-gray-400">Cargando template activo...</p>
              </div>
            )}

            {/* Info */}
            <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400 px-4">
              <p>Los cambios se aplican en tiempo real. Guarda para aplicar a todos los cuentos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <TemplatesModal
          onClose={() => setShowTemplates(false)}
          onSelect={handleTemplateSelect}
        />
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <CreateTemplateModal
          isOpen={showCreateTemplate}
          onClose={() => setShowCreateTemplate(false)}
          onSave={handleCreateTemplate}
          currentConfig={activeConfig || {
            name: 'Nueva Configuración',
            coverConfig: DEFAULT_COVER_CONFIG,
            pageConfig: DEFAULT_PAGE_CONFIG
          }}
        />
      )}
    </div>
  );
};

export default AdminStyleEditor;