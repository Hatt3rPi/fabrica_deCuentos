import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Zap,
  Edit
} from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../../types/notification';
import { styleConfigService } from '../../../services/styleConfigService';
import { StoryStyleConfig, StyleTemplate, DEFAULT_COVER_CONFIG, DEFAULT_PAGE_CONFIG, DEFAULT_DEDICATORIA_CONFIG, ComponentConfig, PageType, migrateConfigToComponents, TextComponentConfig, ensureBackgroundComponents, DEFAULT_COMPONENTS } from '../../../types/styleConfig';
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
import ContentEditorPanel from './components/ContentEditorPanel';
import { useStyleAdapter, SelectionTarget } from '../../../hooks/useStyleAdapter';
import { validateAndSanitize, ValidationResult, isEqual } from '../../../utils/validation';
import { useDualSystemSync } from '../../../hooks/useDualSystemSync';

// Texto de muestra para preview
const SAMPLE_TEXTS = {
  cover: 'El Mágico Viaje de Luna',
  page: 'Luna caminaba por el sendero del bosque encantado, donde las luciérnagas bailaban entre los árboles iluminando su camino. El viento susurraba secretos antiguos mientras las hojas doradas crujían bajo sus pequeños pies.',
  dedicatoria: 'Para mi querida hija Luna, que siempre sueña con aventuras mágicas y llena nuestros días de alegría.'
};

const AdminStyleEditor: React.FC = () => {
  const { createNotification } = useNotifications();
  
  // Estados principales
  const [activeConfig, setActiveConfig] = useState<StoryStyleConfig | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<StyleTemplate | null>(null);
  
  const [originalConfig, setOriginalConfig] = useState<StoryStyleConfig | null>(null);
  // Imágenes por defecto para cada sección (mantener para compatibilidad)
  const [defaultCoverImage, setDefaultCoverImage] = useState<string>('');
  const [defaultPageImage, setDefaultPageImage] = useState<string>('');
  const [defaultDedicatoriaImage, setDefaultDedicatoriaImage] = useState<string>('');
  const [customCoverText, setCustomCoverText] = useState<string>(SAMPLE_TEXTS.cover);
  const [customPageText, setCustomPageText] = useState<string>(SAMPLE_TEXTS.page);
  const [customDedicatoriaText, setCustomDedicatoriaText] = useState<string>(SAMPLE_TEXTS.dedicatoria);
  const [currentPageType, setCurrentPageType] = useState<'cover' | 'page' | 'dedicatoria'>('cover');
  const [activePanel, setActivePanel] = useState<string>('components');
  
  // Sistema de selección PowerPoint-like
  const [selectedTarget, setSelectedTarget] = useState<SelectionTarget>({ type: 'page' });
  const [allComponents, setAllComponents] = useState<ComponentConfig[]>([]);
  const [componentsLoaded, setComponentsLoaded] = useState<boolean>(false);
  
  // Obtener componentes de la página actual
  const components = useMemo(() => 
    allComponents.filter(c => c.pageType === currentPageType),
    [allComponents, currentPageType]
  );
  
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
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 1536, height: 1024 });

  // Cargar template activo y imágenes de muestra
  useEffect(() => {
    loadActiveTemplate();
    loadSampleImages();
  }, []);

  // Resetear selección cuando cambie el tipo de página
  useEffect(() => {
    setSelectedTarget({ type: 'page' });
  }, [currentPageType]);

  // Migrar elementos principales a componentes automáticamente (solo cuando cambie el activeConfig)
  useEffect(() => {
    if (!activeConfig) return;

    // Verificar si ya existen componentes por defecto para evitar duplicación
    const existingDefaultComponents = allComponents.filter(c => c.isDefault);
    
    if (existingDefaultComponents.length === 0) {
      // Crear componentes por defecto desde DEFAULT_COMPONENTS
      const newComponents: ComponentConfig[] = [];
      
      // Crear componentes para cada tipo de página
      const pageTypes: ('cover' | 'page' | 'dedicatoria')[] = ['cover', 'page', 'dedicatoria'];
      for (const pageType of pageTypes) {
        const defaultComponentsForPage = DEFAULT_COMPONENTS[pageType] || [];
        
        // Crear componentes con IDs únicos y contenido apropiado
        const pageComponents = defaultComponentsForPage.map(defaultComp => {
          const component = {
            ...defaultComp,
            id: `${defaultComp.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          
          // Asignar contenido de texto apropiado
          if (component.type === 'text') {
            const textComponent = component as TextComponentConfig;
            if (pageType === 'cover') {
              textComponent.content = customCoverText;
            } else if (pageType === 'page') {
              textComponent.content = customPageText;
            } else if (pageType === 'dedicatoria') {
              textComponent.content = customDedicatoriaText;
            }
          }
          
          return component;
        });
        
        newComponents.push(...pageComponents);
      }
      
      if (newComponents.length > 0) {
        setAllComponents(prev => [...prev, ...newComponents]);
        console.log('Created default components:', newComponents);
      }
    }
  }, [activeConfig]); // Solo dependencia de activeConfig para evitar re-creación innecesaria

  // Optimización de performance: usar useMemo para detectar cambios en lugar de JSON.stringify
  const hasConfigChanges = useMemo(() => {
    if (!originalConfig) return false;
    return !isEqual(activeConfig, originalConfig);
  }, [activeConfig, originalConfig]);

  const hasTextChanges = useMemo(() => {
    if (!originalConfig) return false;
    return (
      (originalConfig.coverSampleText || SAMPLE_TEXTS.cover) !== customCoverText ||
      (originalConfig.pageSampleText || SAMPLE_TEXTS.page) !== customPageText ||
      (originalConfig.dedicatoriaSampleText || SAMPLE_TEXTS.dedicatoria) !== customDedicatoriaText
    );
  }, [originalConfig, customCoverText, customPageText, customDedicatoriaText]);

  // Detectar cambios usando memoización optimizada
  useEffect(() => {
    const hasImageChanges = false; // Custom images now handled by background components
    setIsDirty(hasConfigChanges || hasImageChanges || hasTextChanges);
  }, [hasConfigChanges, hasTextChanges]);

  const loadActiveTemplate = async () => {
    try {
      setIsLoading(true);
      const template = await styleConfigService.getActiveTemplate();
      
      console.log('[fixing_style] Template cargado desde BD:', {
        hasTemplate: !!template,
        templateId: template?.id,
        templateName: template?.name,
        hasConfigData: !!template?.config_data,
        configDataType: typeof template?.config_data,
        configDataKeys: template?.config_data ? Object.keys(template.config_data) : [],
        hasComponents: !!(template?.config_data?.components),
        componentsCount: template?.config_data?.components?.length || 0
      });
      
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
          dedicatoriaSampleText: undefined,
          // CRÍTICO: Incluir componentes en el config para el TemplateRenderer
          ...(template.configData.components ? { components: template.configData.components } : {})
        };
        
        console.log('[fixing_style] Config final creado:', {
          configId: config.id,
          hasComponents: !!(config as any).components,
          componentsCount: (config as any).components?.length || 0,
          componentPreview: (config as any).components?.slice(0, 2).map((c: any) => ({
            id: c.id,
            name: c.name,
            pageType: c.pageType,
            type: c.type
          }))
        });
        
        setActiveConfig(config);
        setOriginalConfig(config);
        
        // CRÍTICO: Cargar componentes guardados en el template
        if (template.configData.components && template.configData.components.length > 0) {
          setAllComponents(template.configData.components);
          setComponentsLoaded(true); // Marcar como cargados desde BD
        } else {
          // Si no hay componentes guardados, se crearán automáticamente por el useEffect de migración
          setAllComponents([]);
          setComponentsLoaded(false); // Marcar como NO cargados
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
      setDefaultCoverImage('http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/portada.png');
      setDefaultPageImage('http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/pagina_interior.png');
      setDefaultDedicatoriaImage('http://127.0.0.1:54321/storage/v1/object/public/storage/style_design/dedicatoria.png');
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
      
      // La configuración de dedicatoria ya se maneja através de componentes
      const updatedDedicatoriaConfig = activeConfig.dedicatoriaConfig;
      
      // Crear template preliminar para validación
      const templateUpdate: Partial<StyleTemplate> = {
        name: activeConfig.name,
        configData: {
          cover_config: activeConfig.coverConfig,
          page_config: activeConfig.pageConfig,
          dedicatoria_config: updatedDedicatoriaConfig,
          // CRÍTICO: Incluir componentes en el guardado
          components: allComponents
        },
        // Imágenes custom ahora se manejan através de componentes de fondo
        customImages: {
          // Se mantiene la estructura para compatibilidad
        },
        // Agregar textos custom
        customTexts: {
          cover_text: customCoverText !== SAMPLE_TEXTS.cover ? customCoverText : undefined,
          page_text: customPageText !== SAMPLE_TEXTS.page ? customPageText : undefined,
          dedicatoria_text: customDedicatoriaText !== SAMPLE_TEXTS.dedicatoria ? customDedicatoriaText : undefined
        }
      };

      // Validar template antes de guardar
      const validation = validateAndSanitize(templateUpdate, 'template');
      
      if (!validation.isValid) {
        console.error('❌ Template validation failed:', validation.errors);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Error de Validación',
          `No se puede guardar el template: ${validation.errors.join(', ')}`,
          NotificationPriority.HIGH
        );
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Template validation warnings:', validation.warnings);
        createNotification(
          NotificationType.SYSTEM_UPDATE,
          'Advertencias de Validación',
          `Template guardado con advertencias: ${validation.warnings.join(', ')}`,
          NotificationPriority.MEDIUM
        );
      }

      // Usar template sanitizado
      const sanitizedTemplate = validation.sanitizedData || templateUpdate;
      
      console.log('🔧 Saving template with components:', {
        componentsCount: allComponents.length,
        components: allComponents,
        templateUpdate: sanitizedTemplate
      });
      
      const result = await styleConfigService.updateActiveTemplate(sanitizedTemplate);
      
      console.log('✅ Save result:', result);

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

  // Función para actualizar configuración general
  const handleConfigChange = useCallback((updates: Partial<StoryStyleConfig>) => {
    console.log('[DualSystemSync] handleConfigChange llamado:', {
      updatesKeys: Object.keys(updates),
      currentConfigId: activeConfig?.id,
      timestamp: new Date().toISOString()
    });
    setActiveConfig(prev => prev ? { ...prev, ...updates } : prev);
  }, [activeConfig?.id]);

  // Función para manejar cambios en componentes con validación
  const handleComponentChange = useCallback((componentId: string, updates: Partial<ComponentConfig>) => {
    console.log('[DualSystemSync] handleComponentChange llamado:', {
      componentId,
      updatesKeys: Object.keys(updates),
      isSimpleUpdate: Object.keys(updates).every(key => ['x', 'y'].includes(key)),
      timestamp: new Date().toISOString()
    });
    
    // Para actualizaciones simples como coordenadas (x, y) y posición, no validar como componente completo
    const isSimplePositionUpdate = Object.keys(updates).every(key => ['x', 'y', 'position', 'horizontalPosition'].includes(key));
    
    if (isSimplePositionUpdate) {
      console.log('[DualSystemSync] Actualizando posición simple:', {
        componentId,
        updates,
        updateKeys: Object.keys(updates),
        values: {
          x: updates.x,
          y: updates.y,
          position: (updates as any).position,
          horizontalPosition: (updates as any).horizontalPosition
        },
        isSimplePositionUpdate
      });
      
      // Validar solo que sean números válidos
      if (typeof updates.x === 'number' && updates.x < 0) updates.x = 0;
      if (typeof updates.y === 'number' && updates.y < 0) updates.y = 0;
      
      // Aplicar directamente sin validación compleja
      setAllComponents(prev => {
        const updatedComponents = prev.map(comp => 
          comp.id === componentId ? { ...comp, ...updates } : comp
        );
        
        console.log('[DualSystemSync] Componentes después de actualizar:', {
          componentId,
          updatedComponent: updatedComponents.find(c => c.id === componentId),
          totalComponents: updatedComponents.length
        });
        
        // 🚀 FIX: También sincronizar activeConfig.components para actualizaciones simples
        setActiveConfig(currentConfig => {
          if (currentConfig) {
            const updatedConfig = {
              ...currentConfig,
              components: updatedComponents
            };
            console.log('🐛[DEBUG] Simple position update synced to activeConfig:', {
              componentId,
              updates,
              finalPosition: {
                x: updates.x,
                y: updates.y,
                position: updates.position
              }
            });
            return updatedConfig;
          }
          return currentConfig;
        });
        
        return updatedComponents;
      });
      setIsDirty(true);
      
      // EXPERIMENTAL: Forzar sincronización A→B inmediatamente para cambios de posición
      if (forceAtoB && activeConfig) {
        console.log('[🔍SYNC_DEBUG] Forzando sincronización A→B para cambios de posición');
        forceAtoB();
      }
      return;
    }
    
    // Para actualizaciones complejas, obtener el componente completo y validar
    console.log('[DualSystemSync] Actualizando componente completo:', {
      componentId,
      updatesKeys: Object.keys(updates),
      hasPositionUpdates: !!(updates.position || updates.x || updates.y),
      updates
    });
    
    const existingComponent = allComponents.find(comp => comp.id === componentId);
    if (!existingComponent) {
      console.error('❌ Component not found:', componentId);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error',
        'Componente no encontrado',
        NotificationPriority.HIGH
      );
      return;
    }
    
    // Crear el componente actualizado completo para validación
    const updatedComponent = { ...existingComponent, ...updates };
    const validation = validateAndSanitize(updatedComponent, 'component');
    
    if (!validation.isValid) {
      console.error('❌ Component validation failed:', validation.errors);
      createNotification(
        NotificationType.SYSTEM_UPDATE,
        'Error de Validación',
        `Error al actualizar componente: ${validation.errors.join(', ')}`,
        NotificationPriority.HIGH
      );
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ Component validation warnings:', validation.warnings);
    }

    // Usar datos sanitizados
    const sanitizedComponent = validation.sanitizedData || updatedComponent;
    
    setAllComponents(prev => {
      const updatedComponents = prev.map(comp => 
        comp.id === componentId ? sanitizedComponent : comp
      );
      
      // 🚀 SOLUCIÓN: Sincronizar activeConfig.components con allComponents en tiempo real
      setActiveConfig(currentConfig => {
        if (currentConfig) {
          const updatedConfig = {
            ...currentConfig,
            components: updatedComponents
          };
          console.log('🐛[DEBUG] Admin component updated:', {
            componentId,
            componentName: sanitizedComponent.name,
            updatesApplied: updates,
            finalPosition: {
              position: sanitizedComponent.position,
              x: sanitizedComponent.x,
              y: sanitizedComponent.y
            },
            totalComponents: updatedComponents.length,
            templateRendererWillReceiveNewData: true
          });
          return updatedConfig;
        }
        return currentConfig;
      });
      
      return updatedComponents;
    });
    setIsDirty(true);
  }, [allComponents, createNotification]);

  // Función para manejar selección de componentes
  const handleComponentSelection = useCallback((componentId: string | null) => {
    if (componentId) {
      const component = allComponents.find(c => c.id === componentId);
      if (component) {
        setSelectedTarget({
          type: 'component',
          componentId: component.id,
          componentName: component.name,
          componentType: component.type
        });
        // Cambiar automáticamente al tab de contenido para componentes por defecto
        if (component.isDefault && activePanel === 'components') {
          setActivePanel('content');
        }
        // Si se selecciona un componente de fondo y el panel actual es posición, cambiar a otro panel
        if ((component as any).isBackground && activePanel === 'position') {
          setActivePanel('content');
        }
      }
    } else {
      setSelectedTarget({ type: 'page' });
      // Volver al tab de elementos cuando se deselecciona
      if (activePanel === 'content') {
        setActivePanel('components');
      }
    }
  }, [allComponents, activePanel]);

  // Función para agregar componente
  const handleAddComponent = useCallback((component: ComponentConfig) => {
    // Asegurar que el componente tenga la página actual
    const componentWithPage = { ...component, pageType: currentPageType as PageType };
    setAllComponents(prev => [...prev, componentWithPage]);
    // Seleccionar automáticamente el componente recién agregado
    setSelectedTarget({
      type: 'component',
      componentId: component.id,
      componentName: component.name,
      componentType: component.type
    });
  }, [currentPageType]);

  // Función para eliminar componente
  const handleDeleteComponent = useCallback((componentId: string) => {
    setAllComponents(prev => prev.filter(c => c.id !== componentId));
    // Si se elimina el componente seleccionado, volver a página
    if (selectedTarget.componentId === componentId) {
      setSelectedTarget({ type: 'page' });
    }
  }, [selectedTarget.componentId]);

  // Hook del adaptador de estilos
  const styleAdapter = useStyleAdapter(
    selectedTarget,
    activeConfig,
    currentPageType as PageType,
    components,
    handleConfigChange,
    handleComponentChange,
    {
      enableGranularUpdates: false,
      enableLogging: false
    }
  );

  // Función wrapper para setAllComponents con logging
  const handleSetAllComponents = useCallback((newComponents: ComponentConfig[] | ((prev: ComponentConfig[]) => ComponentConfig[])) => {
    console.log('[DualSystemSync] setAllComponents llamado:', {
      isFunction: typeof newComponents === 'function',
      newComponentsCount: typeof newComponents === 'function' ? 'función' : newComponents.length,
      currentCount: allComponents.length,
      timestamp: new Date().toISOString()
    });
    setAllComponents(newComponents);
  }, [allComponents.length]);

  // Hook para sincronización bidireccional entre sistemas A (legacy) y B (componentes)
  const { forceAtoB } = useDualSystemSync(
    activeConfig,
    allComponents,
    handleConfigChange,
    handleSetAllComponents,
    {
      enableSync: true,
      enableLogging: true,
      debounceMs: 150,
      experimentalPositionSync: true // Flag experimental para fix de posición
    }
  );

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

            {/* Indicador de selección */}
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {selectedTarget.type === 'page' ? 'Editando página' : 'Editando componente'}
                  </p>
                  {selectedTarget.type === 'component' && (
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      {selectedTarget.componentName} ({selectedTarget.componentType})
                    </p>
                  )}
                </div>
                {selectedTarget.type === 'component' && (
                  <button
                    onClick={() => setSelectedTarget({ type: 'page' })}
                    className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                  >
                    Volver a página
                  </button>
                )}
              </div>
            </div>



            {/* Active Panel Content */}
            {activePanel === 'components' && (
              <ComponentsPanel
                components={components}
                selectedComponentId={selectedTarget.componentId}
                onAddComponent={handleAddComponent}
                onUpdateComponent={handleComponentChange}
                onDeleteComponent={handleDeleteComponent}
                onSelectComponent={handleComponentSelection}
                pageType={currentPageType}
              />
            )}

            {activePanel === 'content' && (
              <>
                {selectedTarget.type === 'component' && selectedTarget.componentId ? (
                  <ContentEditorPanel
                    component={allComponents.find(c => c.id === selectedTarget.componentId)!}
                    onUpdate={(updates) => handleComponentChange(selectedTarget.componentId!, updates)}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Textos de Muestra:</strong> Estos textos se muestran en el preview para visualizar los estilos. 
                        Para editar contenido real, crea componentes de texto usando el panel "Componentes".
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Texto de muestra para {currentPageType === 'cover' ? 'Portada' : currentPageType === 'page' ? 'Interior' : 'Dedicatoria'}
                      </label>
                      <textarea
                        value={
                          currentPageType === 'cover' ? customCoverText :
                          currentPageType === 'page' ? customPageText :
                          customDedicatoriaText
                        }
                        onChange={(e) => {
                          if (currentPageType === 'cover') {
                            setCustomCoverText(e.target.value);
                          } else if (currentPageType === 'page') {
                            setCustomPageText(e.target.value);
                          } else {
                            setCustomDedicatoriaText(e.target.value);
                          }
                        }}
                        placeholder="Texto de muestra para visualizar estilos..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                      />
                    </div>
                    
                    <button
                      onClick={() => {
                        const defaultText = 
                          currentPageType === 'cover' ? SAMPLE_TEXTS.cover :
                          currentPageType === 'page' ? SAMPLE_TEXTS.page :
                          SAMPLE_TEXTS.dedicatoria;
                        
                        if (currentPageType === 'cover') {
                          setCustomCoverText(defaultText);
                        } else if (currentPageType === 'page') {
                          setCustomPageText(defaultText);
                        } else {
                          setCustomDedicatoriaText(defaultText);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Type className="w-4 h-4" />
                      Restaurar texto por defecto
                    </button>
                  </div>
                )}
              </>
            )}

            {activePanel === 'typography' && activeConfig && styleAdapter.selectionInfo.canEdit.typography && (
              <TypographyPanel
                config={selectedTarget.type === 'component' ? styleAdapter.currentStyles : getCurrentConfig()}
                onChange={selectedTarget.type === 'component' ? 
                  (updates: any) => styleAdapter.updateStyles(updates) :
                  (currentPageType === 'cover' ? updateCoverConfig :
                   currentPageType === 'dedicatoria' ? updateDedicatoriaConfig :
                   updatePageConfig)
                }
              />
            )}
            
            {activePanel === 'position' && activeConfig && styleAdapter.selectionInfo.canEdit.position && 
             // Mostrar panel de posición solo para componentes que NO sean de fondo
             (selectedTarget.type === 'component' && 
              styleAdapter.selectedComponent && 
              !(styleAdapter.selectedComponent as any).isBackground) && (
              <PositionPanel
                config={selectedTarget.type === 'component' ? styleAdapter.currentStyles : getCurrentConfig()}
                onChange={selectedTarget.type === 'component' ? 
                  (updates: any) => styleAdapter.updateStyles(updates) :
                  (currentPageType === 'cover' ? updateCoverConfig :
                   currentPageType === 'dedicatoria' ? updateDedicatoriaConfig :
                   updatePageConfig)
                }
                pageType={currentPageType}
                isImageComponent={selectedTarget.type === 'component' && selectedTarget.componentType === 'image'}
                containerDimensions={containerDimensions}
              />
            )}
            
            {activePanel === 'colors' && activeConfig && styleAdapter.selectionInfo.canEdit.colors && (
              <ColorPanel
                config={selectedTarget.type === 'component' ? styleAdapter.currentStyles : getCurrentConfig()}
                onChange={selectedTarget.type === 'component' ? 
                  (updates: any) => styleAdapter.updateStyles(updates) :
                  (currentPageType === 'cover' ? updateCoverConfig :
                   currentPageType === 'dedicatoria' ? updateDedicatoriaConfig :
                   updatePageConfig)
                }
              />
            )}
            
            {activePanel === 'effects' && activeConfig && styleAdapter.selectionInfo.canEdit.effects && (
              <EffectsPanel
                containerStyle={selectedTarget.type === 'component' ? 
                  {
                    background: styleAdapter.currentStyles.backgroundColor,
                    boxShadow: styleAdapter.currentStyles.boxShadow,
                    backdropFilter: styleAdapter.currentStyles.backdropFilter,
                    border: styleAdapter.currentStyles.border
                  } :
                  getCurrentConfig().containerStyle
                }
                onChange={selectedTarget.type === 'component' ? 
                  (updates: any) => {
                    const styleUpdates: any = {};
                    if (updates.background !== undefined) styleUpdates.backgroundColor = updates.background;
                    if (updates.boxShadow !== undefined) styleUpdates.boxShadow = updates.boxShadow;
                    if (updates.backdropFilter !== undefined) styleUpdates.backdropFilter = updates.backdropFilter;
                    if (updates.border !== undefined) styleUpdates.border = updates.border;
                    styleAdapter.updateStyles(styleUpdates);
                  } :
                  updateContainerStyle
                }
              />
            )}
            
            {activePanel === 'container' && activeConfig && styleAdapter.selectionInfo.canEdit.container && (
              <ContainerPanel
                containerStyle={selectedTarget.type === 'component' ? 
                  { 
                    background: styleAdapter.currentStyles.backgroundColor,
                    borderRadius: styleAdapter.currentStyles.borderRadius,
                    padding: styleAdapter.currentStyles.padding,
                    border: styleAdapter.currentStyles.border,
                    // Incluir propiedades de alineación y escalado
                    horizontalAlignment: styleAdapter.currentStyles.horizontalAlignment,
                    verticalAlignment: styleAdapter.currentStyles.verticalAlignment,
                    scaleWidth: styleAdapter.currentStyles.scaleWidth,
                    scaleHeight: styleAdapter.currentStyles.scaleHeight,
                    scaleWidthUnit: styleAdapter.currentStyles.scaleWidthUnit,
                    scaleHeightUnit: styleAdapter.currentStyles.scaleHeightUnit,
                    maintainAspectRatio: styleAdapter.currentStyles.maintainAspectRatio
                  } :
                  getCurrentConfig().containerStyle
                }
                onChange={selectedTarget.type === 'component' ? 
                  (updates: any) => styleAdapter.updateStyles(updates) :
                  updateContainerStyle
                }
                pageType={currentPageType}
              />
            )}
            
            
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 md:p-8 overflow-auto">
          <div className="w-full mx-auto">
            {/* Panel Tabs - Una sola fila horizontal */}
            <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm overflow-x-auto">
              <button
                onClick={() => setActivePanel('components')}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'components'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Elementos
              </button>
              {selectedTarget.type === 'component' && (
                <button
                  onClick={() => setActivePanel('content')}
                  className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activePanel === 'content'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Contenido
                </button>
              )}
              <button
                onClick={() => setActivePanel('typography')}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'typography'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Type className="w-4 h-4 inline mr-1" />
                Tipografía
              </button>
              {/* Botón Posición para componentes no-fondo */}
              {(selectedTarget.type === 'component' && 
                styleAdapter.selectedComponent && 
                !(styleAdapter.selectedComponent as any).isBackground) && (
                <button
                  onClick={() => setActivePanel('position')}
                  className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activePanel === 'position'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Move className="w-4 h-4 inline mr-1" />
                  Posición
                </button>
              )}
              <button
                onClick={() => setActivePanel('colors')}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'colors'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Palette className="w-4 h-4 inline mr-1" />
                Colores
              </button>
              <button
                onClick={() => setActivePanel('effects')}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'effects'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-1" />
                Efectos
              </button>
              <button
                onClick={() => setActivePanel('container')}
                className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePanel === 'container'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Contenedor
              </button>
            </div>
            
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
              </div>
            </div>

            {/* Preview Component */}
            {activeConfig ? (
              <StylePreview
                config={activeConfig}
                pageType={currentPageType}
                sampleImage={
                  currentPageType === 'cover' ? defaultCoverImage :
                  currentPageType === 'dedicatoria' ? defaultDedicatoriaImage :
                  defaultPageImage
                }
                sampleText={
                  currentPageType === 'cover' ? customCoverText :
                  currentPageType === 'dedicatoria' ? customDedicatoriaText :
                  customPageText
                }
                showGrid={showGrid}
                showRulers={showRulers}
                zoomLevel={zoomLevel}
                selectedComponentId={selectedTarget.componentId}
                onComponentSelect={handleComponentSelection}
                onComponentUpdate={handleComponentChange}
                components={components}
                onDimensionsChange={setContainerDimensions}
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