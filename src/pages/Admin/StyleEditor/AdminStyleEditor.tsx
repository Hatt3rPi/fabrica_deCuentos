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
import { StoryStyleConfig, StyleTemplate, DEFAULT_COVER_CONFIG, DEFAULT_PAGE_CONFIG, DEFAULT_DEDICATORIA_CONFIG, DEFAULT_CONTRAPORTADA_CONFIG, ComponentConfig, PageType } from '../../../types/styleConfig';
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
import DedicatoriaImagePanel from './components/DedicatoriaImagePanel';
import ComponentsPanel from './components/ComponentsPanel';
import { useStyleAdapter, SelectionTarget } from '../../../hooks/useStyleAdapter';

// Texto de muestra para preview
const SAMPLE_TEXTS = {
  cover: 'El Mágico Viaje de Luna',
  page: 'Luna caminaba por el sendero del bosque encantado, donde las luciérnagas bailaban entre los árboles iluminando su camino. El viento susurraba secretos antiguos mientras las hojas doradas crujían bajo sus pequeños pies.',
  dedicatoria: 'Para mi querida hija Luna, que siempre sueña con aventuras mágicas y llena nuestros días de alegría.',
  contraportada: 'Una historia mágica llena de aventuras, donde Luna descubre que los sueños pueden hacerse realidad cuando tienes el corazón valiente y la imaginación despierta.'
};

const AdminStyleEditor: React.FC = () => {
  const { createNotification } = useNotifications();
  
  // Estados principales
  const [activeConfig, setActiveConfig] = useState<StoryStyleConfig | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<StyleTemplate | null>(null);
  
  const [originalConfig, setOriginalConfig] = useState<StoryStyleConfig | null>(null);
  // Imágenes por defecto para cada sección
  const [defaultCoverImage, setDefaultCoverImage] = useState<string>('');
  const [defaultPageImage, setDefaultPageImage] = useState<string>('');
  const [defaultDedicatoriaImage, setDefaultDedicatoriaImage] = useState<string>('');
  // Imágenes custom/subidas por admin
  const [customCoverImage, setCustomCoverImage] = useState<string>('');
  const [customPageImage, setCustomPageImage] = useState<string>('');
  const [customDedicatoriaImage, setCustomDedicatoriaImage] = useState<string>('');
  const [customContraportadaImage, setCustomContraportadaImage] = useState<string>('');
  const [customCoverText, setCustomCoverText] = useState<string>(SAMPLE_TEXTS.cover);
  const [customPageText, setCustomPageText] = useState<string>(SAMPLE_TEXTS.page);
  const [customDedicatoriaText, setCustomDedicatoriaText] = useState<string>(SAMPLE_TEXTS.dedicatoria);
  const [customContraportadaText, setCustomContraportadaText] = useState<string>(SAMPLE_TEXTS.contraportada);
  const [currentPageType, setCurrentPageType] = useState<PageType>('cover');
  const [activePanel, setActivePanel] = useState<string>('typography');
  
  // Sistema de selección PowerPoint-like
  const [selectedTarget, setSelectedTarget] = useState<SelectionTarget>({ type: 'page' });
  
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

  // Cargar template activo y imágenes de muestra
  useEffect(() => {
    loadActiveTemplate();
    loadSampleImages();
  }, []);

  // Resetear selección cuando cambie el tipo de página
  useEffect(() => {
    setSelectedTarget({ type: 'page' });
  }, [currentPageType]);

  // Detectar cambios
  useEffect(() => {
    if (originalConfig) {
      const hasConfigChanges = JSON.stringify(activeConfig) !== JSON.stringify(originalConfig);
      const hasImageChanges = 
        (originalConfig.coverBackgroundUrl || '') !== customCoverImage ||
        (originalConfig.pageBackgroundUrl || '') !== customPageImage ||
        (originalConfig.dedicatoriaBackgroundUrl || '') !== customDedicatoriaImage;
      const hasTextChanges = 
        (originalConfig.coverSampleText || SAMPLE_TEXTS.cover) !== customCoverText ||
        (originalConfig.pageSampleText || SAMPLE_TEXTS.page) !== customPageText ||
        (originalConfig.dedicatoriaSampleText || SAMPLE_TEXTS.dedicatoria) !== customDedicatoriaText;
      setIsDirty(hasConfigChanges || hasImageChanges || hasTextChanges);
    }
  }, [activeConfig, originalConfig, customCoverImage, customPageImage, customDedicatoriaImage, customCoverText, customPageText, customDedicatoriaText]);

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
          dedicatoriaConfig: template.configData.dedicatoria_config || DEFAULT_DEDICATORIA_CONFIG,
          // Las imágenes custom son solo para preview del editor
          coverBackgroundUrl: undefined,
          pageBackgroundUrl: undefined,
          dedicatoriaBackgroundUrl: undefined,
          coverSampleText: undefined,
          pageSampleText: undefined,
          dedicatoriaSampleText: undefined
        };
        
        setActiveConfig(config);
        setOriginalConfig(config);
        
        // Cargar imágenes y textos custom si existen
        if (template.customImages) {
          setCustomCoverImage(template.customImages.cover_url || '');
          setCustomPageImage(template.customImages.page_url || '');
          setCustomDedicatoriaImage(template.customImages.dedicatoria_url || '');
          console.log('🖼️ Imágenes custom cargadas desde BD:', template.customImages);
        } else {
          setCustomCoverImage('');
          setCustomPageImage('');
          setCustomDedicatoriaImage('');
        }
        
        // También cargar imagen de fondo de dedicatoria desde la configuración
        if (template.configData.dedicatoria_config?.backgroundImageUrl) {
          setCustomDedicatoriaImage(template.configData.dedicatoria_config.backgroundImageUrl);
          console.log('🖼️ Imagen de fondo de dedicatoria cargada desde config:', template.configData.dedicatoria_config.backgroundImageUrl);
        }
        
        if (template.customTexts) {
          setCustomCoverText(template.customTexts.cover_text || SAMPLE_TEXTS.cover);
          setCustomPageText(template.customTexts.page_text || SAMPLE_TEXTS.page);
          setCustomDedicatoriaText(template.customTexts.dedicatoria_text || SAMPLE_TEXTS.dedicatoria);
          console.log('📝 Textos custom cargados desde BD:', template.customTexts);
        } else {
          setCustomCoverText(SAMPLE_TEXTS.cover);
          setCustomPageText(SAMPLE_TEXTS.page);
          setCustomDedicatoriaText(SAMPLE_TEXTS.dedicatoria);
        }
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

  const loadSampleImages = async () => {
    try {
      const images = await styleConfigService.getAllSampleImages();
      setDefaultCoverImage(images.cover);
      setDefaultPageImage(images.page);
      setDefaultDedicatoriaImage(images.dedicatoria);
      console.log('🖼️ Imágenes por defecto cargadas:', images);
    } catch (error) {
      console.error('Error cargando imágenes por defecto:', error);
      // Usar fallbacks si hay error
      setDefaultCoverImage('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=800&fit=crop');
      setDefaultPageImage('https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop');
      setDefaultDedicatoriaImage('https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=1200&h=800&fit=crop');
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
      
      // Actualizar configuración de dedicatoria con imagen de fondo si existe
      const updatedDedicatoriaConfig = {
        ...activeConfig.dedicatoriaConfig,
        ...(customDedicatoriaImage && {
          backgroundImageUrl: customDedicatoriaImage,
          backgroundImagePosition: 'cover' as const
        })
      };
      
      // Actualizar template activo con las configuraciones editadas
      const templateUpdate: Partial<StyleTemplate> = {
        name: activeConfig.name,
        configData: {
          cover_config: activeConfig.coverConfig,
          page_config: activeConfig.pageConfig,
          dedicatoria_config: updatedDedicatoriaConfig
        },
        // Agregar imágenes custom si existen
        customImages: {
          cover_url: customCoverImage || undefined,
          page_url: customPageImage || undefined,
          dedicatoria_url: customDedicatoriaImage || undefined
        },
        // Agregar textos custom
        customTexts: {
          cover_text: customCoverText !== SAMPLE_TEXTS.cover ? customCoverText : undefined,
          page_text: customPageText !== SAMPLE_TEXTS.page ? customPageText : undefined,
          dedicatoria_text: customDedicatoriaText !== SAMPLE_TEXTS.dedicatoria ? customDedicatoriaText : undefined
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

  const updateDedicatoriaConfig = useCallback((updates: any) => {
    setActiveConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        dedicatoriaConfig: {
          ...prev.dedicatoriaConfig,
          text: {
            ...prev.dedicatoriaConfig?.text,
            ...updates
          },
          imageSize: prev.dedicatoriaConfig?.imageSize || 'mediana',
          allowedLayouts: prev.dedicatoriaConfig?.allowedLayouts || ['imagen-arriba', 'imagen-abajo', 'imagen-izquierda', 'imagen-derecha'],
          allowedAlignments: prev.dedicatoriaConfig?.allowedAlignments || ['centro', 'izquierda', 'derecha']
        }
      };
    });
  }, []);

  const updateContraportadaConfig = useCallback((updates: any) => {
    setActiveConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        contraportadaConfig: {
          ...prev.contraportadaConfig,
          text: {
            ...prev.contraportadaConfig?.text || DEFAULT_CONTRAPORTADA_CONFIG.text,
            ...updates
          }
        }
      };
    });
  }, []);

  // Función para manejar cambios en componentes
  const handleComponentChange = useCallback((componentId: string, updates: Partial<ComponentConfig>) => {
    setActiveConfig(prev => {
      if (!prev) return prev;
      
      const currentComponents = prev.components?.[currentPageType] || [];
      const updatedComponents = currentComponents.map(comp => 
        comp.id === componentId ? { ...comp, ...updates } : comp
      );
      
      return {
        ...prev,
        components: {
          ...prev.components,
          [currentPageType]: updatedComponents
        }
      };
    });
  }, [currentPageType]);

  // Función para manejar selección de componentes
  const handleComponentSelection = useCallback((componentId: string | null) => {
    if (componentId) {
      const components = activeConfig?.components?.[currentPageType] || [];
      const component = components.find(c => c.id === componentId);
      
      if (component) {
        setSelectedTarget({
          type: 'component',
          componentId: componentId,
          componentName: component.name,
          componentType: component.type
        });
      }
    } else {
      setSelectedTarget({ type: 'page' });
    }
  }, [activeConfig, currentPageType]);

  // Hook de adaptación de estilos
  const styleAdapter = useStyleAdapter(
    selectedTarget,
    activeConfig,
    currentPageType,
    activeConfig?.components?.[currentPageType] || [],
    (updates) => {
      // Actualizar configuración de página según el tipo
      if (currentPageType === 'cover') {
        updateCoverConfig(updates);
      } else if (currentPageType === 'dedicatoria') {
        updateDedicatoriaConfig(updates);
      } else if (currentPageType === 'contraportada') {
        updateContraportadaConfig(updates);
      } else {
        updatePageConfig(updates);
      }
    },
    handleComponentChange
  );

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
    } else if (currentPageType === 'dedicatoria') {
      setActiveConfig(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          dedicatoriaConfig: {
            ...prev.dedicatoriaConfig,
            text: {
              ...prev.dedicatoriaConfig?.text,
              containerStyle: {
                ...prev.dedicatoriaConfig?.text?.containerStyle,
                ...containerUpdates
              }
            },
            imageSize: prev.dedicatoriaConfig?.imageSize || 'mediana',
            allowedLayouts: prev.dedicatoriaConfig?.allowedLayouts || ['imagen-arriba', 'imagen-abajo', 'imagen-izquierda', 'imagen-derecha'],
            allowedAlignments: prev.dedicatoriaConfig?.allowedAlignments || ['centro', 'izquierda', 'derecha']
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
      if (currentPageType === 'cover') return DEFAULT_COVER_CONFIG.title;
      if (currentPageType === 'dedicatoria') return DEFAULT_DEDICATORIA_CONFIG.text;
      return DEFAULT_PAGE_CONFIG.text;
    }
    if (currentPageType === 'cover') return activeConfig.coverConfig.title;
    if (currentPageType === 'dedicatoria') return activeConfig.dedicatoriaConfig?.text || DEFAULT_DEDICATORIA_CONFIG.text;
    return activeConfig.pageConfig.text;
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
                Fondo
              </button>
              {currentPageType === 'dedicatoria' && (
                <button
                  onClick={() => setActivePanel('userImage')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activePanel === 'userImage'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Image className="w-4 h-4 inline mr-1" />
                  Usuario
                </button>
              )}
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

            <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActivePanel('components')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'components'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Componentes
              </button>
            </div>

            {/* Indicador de Selección */}
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Editando: {styleAdapter.selectionInfo.name}
                </span>
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                {styleAdapter.selectionInfo.type === 'component' 
                  ? `Componente ${styleAdapter.selectionInfo.typeName}` 
                  : 'Texto principal de la página'
                }
              </div>
              {selectedTarget.type === 'component' && (
                <button
                  onClick={() => setSelectedTarget({ type: 'page' })}
                  className="text-xs text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100 mt-1 underline"
                >
                  ← Volver a página principal
                </button>
              )}
            </div>

            {/* Active Panel Content */}
            {activePanel === 'typography' && activeConfig && styleAdapter.availableControls.typography && (
              <TypographyPanel
                config={styleAdapter.currentStyles}
                onChange={styleAdapter.updateStyles}
              />
            )}
            
            {activePanel === 'position' && activeConfig && styleAdapter.availableControls.position && (
              <PositionPanel
                config={styleAdapter.currentStyles}
                onChange={styleAdapter.updateStyles}
                pageType={currentPageType}
              />
            )}
            
            {activePanel === 'colors' && activeConfig && styleAdapter.availableControls.colors && (
              <ColorPanel
                config={styleAdapter.currentStyles}
                onChange={styleAdapter.updateStyles}
              />
            )}
            
            {activePanel === 'effects' && activeConfig && styleAdapter.availableControls.effects && (
              <EffectsPanel
                containerStyle={styleAdapter.currentStyles}
                onChange={styleAdapter.updateStyles}
              />
            )}
            
            {activePanel === 'container' && activeConfig && styleAdapter.availableControls.container && (
              <ContainerPanel
                containerStyle={styleAdapter.currentStyles}
                onChange={styleAdapter.updateStyles}
                pageType={currentPageType}
              />
            )}

            {/* Mensaje cuando no hay controles disponibles */}
            {activeConfig && (
              (activePanel === 'typography' && !styleAdapter.availableControls.typography) ||
              (activePanel === 'colors' && !styleAdapter.availableControls.colors) ||
              (activePanel === 'effects' && !styleAdapter.availableControls.effects) ||
              (activePanel === 'container' && !styleAdapter.availableControls.container)
            ) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  Este panel no está disponible para el elemento seleccionado.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 text-center mt-1">
                  Selecciona un componente de texto o la página principal.
                </p>
              </div>
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
                <ImageUploader
                  currentImage={customDedicatoriaImage}
                  onImageChange={setCustomDedicatoriaImage}
                  label="Imagen de fondo para Dedicatoria"
                  pageType="dedicatoria"
                />
              </div>
            )}
            
            {activePanel === 'userImage' && currentPageType === 'dedicatoria' && activeConfig?.dedicatoriaConfig && (
              <DedicatoriaImagePanel
                config={activeConfig.dedicatoriaConfig}
                onChange={updateDedicatoriaConfig}
              />
            )}
            
            {activePanel === 'text' && (
              <TextEditor
                coverText={customCoverText}
                pageText={customPageText}
                dedicatoriaText={customDedicatoriaText}
                contraportadaText={customContraportadaText}
                onCoverTextChange={setCustomCoverText}
                onPageTextChange={setCustomPageText}
                onDedicatoriaTextChange={setCustomDedicatoriaText}
                onContraportadaTextChange={setCustomContraportadaText}
                currentPageType={currentPageType}
              />
            )}

            {activePanel === 'components' && activeConfig && (
              <ComponentsPanel
                pageType={currentPageType}
                components={activeConfig.components?.[currentPageType] || []}
                onChange={(components) => {
                  setActiveConfig(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      components: {
                        ...prev.components,
                        [currentPageType]: components
                      }
                    };
                  });
                }}
              />
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 md:p-8 overflow-auto">
          <div className="w-full mx-auto">
            {/* Page Type Switcher */}
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 inline-flex w-full max-w-lg md:w-auto">
                <button
                  onClick={() => setCurrentPageType('cover')}
                  className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageType === 'cover'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Portada
                </button>
                <button
                  onClick={() => setCurrentPageType('page')}
                  className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageType === 'page'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Interior</span>
                  <span className="sm:hidden">Int.</span>
                </button>
                <button
                  onClick={() => setCurrentPageType('dedicatoria')}
                  className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageType === 'dedicatoria'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Dedicatoria</span>
                  <span className="sm:hidden">Ded.</span>
                </button>
                <button
                  onClick={() => setCurrentPageType('contraportada')}
                  className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageType === 'contraportada'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Contraportada</span>
                  <span className="sm:hidden">Cont.</span>
                </button>
              </div>
            </div>

            {/* Preview Component */}
            {activeConfig ? (
              <StylePreview
                config={activeConfig}
                pageType={currentPageType}
                sampleImage={
                  currentPageType === 'cover' ? (customCoverImage || defaultCoverImage) :
                  currentPageType === 'dedicatoria' ? (customDedicatoriaImage || defaultDedicatoriaImage) :
                  currentPageType === 'contraportada' ? (customContraportadaImage || defaultCoverImage) :
                  (customPageImage || defaultPageImage)
                }
                sampleText={
                  currentPageType === 'cover' ? customCoverText :
                  currentPageType === 'dedicatoria' ? customDedicatoriaText :
                  currentPageType === 'contraportada' ? customContraportadaText :
                  customPageText
                }
                showGrid={showGrid}
                showRulers={showRulers}
                zoomLevel={zoomLevel}
                selectedComponentId={selectedTarget.type === 'component' ? selectedTarget.componentId : undefined}
                onComponentSelect={handleComponentSelection}
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