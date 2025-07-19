import { useState, useEffect, useCallback, useRef } from 'react';
import * as fabric from 'fabric';
import { PageType } from '../../../../../types/styleConfig';
import { styleConfigService } from '../../../../../services/styleConfigService';
import { fabricStorageService } from '../../../../../services/fabricStorageService';
import { ConfigDataMigrator } from '../../../../../utils/configDataMigrator';

interface FabricCanvasHook {
  canvas: fabric.Canvas | null;
  isInitialized: boolean;
  selectedObject: fabric.Object | null;
  currentPageType: PageType;
  pageStates: Record<PageType, string>; // 🚨 NUEVO: Exponer para debug
  isLoadingTemplate: boolean; // 🚨 NUEVO: Estado de carga desde BD
  templateFromDB: any; // 🆕 Template completo desde BD para debug
  debugLogs: string[]; // 🆕 Logs capturados para debug
  addText: (text: string) => void;
  addImage: (url: string) => void;
  addImageFromFile: (file: File) => Promise<void>; // 🚨 NUEVO: Agregar imagen desde archivo usando Storage
  addImageFromBase64: (base64Data: string) => Promise<void>; // 🚨 NUEVO: Agregar imagen desde base64 usando Storage
  removeObject: (obj: fabric.Object) => void;
  clearCanvas: () => void;
  resetAllPages: () => void; // 🚨 NUEVO: Reset completo
  switchPageType: (pageType: PageType) => void;
  loadFromDatabase: () => Promise<void>; // 🚨 NUEVO: Cargar desde BD
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

/**
 * Hook principal para gestión del canvas Fabric.js con soporte multi-página
 * 
 * Características:
 * - Canvas 1536x1024 fijo (ratio 3:2)
 * - Gestión de objetos (texto, imagen)
 * - Sistema undo/redo con stack de 20 operaciones
 * - Estados separados por tipo de página (cover, page, dedicatoria)
 * - Auto-cleanup al desmontar
 */
/**
 * Helper que fuerza la serialización correcta de propiedades 'data' en objetos Fabric.js
 * Intercepta y modifica toObject() para garantizar que incluya las propiedades data
 */
const forceDataSerialization = (canvas: fabric.Canvas) => {
  canvas.getObjects().forEach(obj => {
    if (obj.data) {
      // Forzar que toObject incluya data
      const originalToObject = obj.toObject;
      obj.toObject = function(properties = []) {
        const result = originalToObject.call(this, properties);
        if (this.data) {
          result.data = this.data;
        }
        return result;
      };
    }
  });
};

export const useFabricCanvas = (canvasId: string, initialPageType: PageType = 'cover'): FabricCanvasHook => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [currentPageType, setCurrentPageType] = useState<PageType>(initialPageType);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  // 🆕 Debug data para el panel
  const [templateFromDB, setTemplateFromDB] = useState<any>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // 🆕 Función para capturar logs
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev.slice(-50), logEntry]); // Mantener últimos 50 logs
    console.log('🐛 DEBUG LOG:', logEntry);
  }, []);
  
  // Estados separados por tipo de página
  const [pageStates, setPageStates] = useState<Record<PageType, string>>({
    cover: '',
    page: '',
    dedicatoria: ''
  });
  
  // Undo/Redo state por página
  const [undoStacks, setUndoStacks] = useState<Record<PageType, string[]>>({
    cover: [],
    page: [],
    dedicatoria: []
  });
  const [redoStacks, setRedoStacks] = useState<Record<PageType, string[]>>({
    cover: [],
    page: [],
    dedicatoria: []
  });
  const [isUndoRedoing, setIsUndoRedoing] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false); // 🚨 Flag para marcar estado de carga
  
  const undoStacksRef = useRef(undoStacks);
  const redoStacksRef = useRef(redoStacks);
  const pageStatesRef = useRef(pageStates);
  const isLoadingStateRef = useRef(false); // 🚨 CRÍTICO: Ref para acceso inmediato al estado de carga
  const currentPageTypeRef = useRef(currentPageType); // 🚨 CRÍTICO: Ref para acceso inmediato al tipo de página actual
  
  // Actualizar refs cuando cambien los states
  useEffect(() => {
    undoStacksRef.current = undoStacks;
  }, [undoStacks]);
  
  useEffect(() => {
    redoStacksRef.current = redoStacks;
  }, [redoStacks]);
  
  useEffect(() => {
    pageStatesRef.current = pageStates;
  }, [pageStates]);
  
  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);
  
  useEffect(() => {
    currentPageTypeRef.current = currentPageType;
  }, [currentPageType]);

  // 🚨 FIX DEFINITIVO: Helper para asegurar que objetos incluyan propiedades data en serialización
  const ensureDataProperty = useCallback((fabricObject: fabric.Object, data: any) => {
    fabricObject.data = data;
    
    console.log('🔧 ENSURING DATA PROPERTY:', {
      objectType: fabricObject.type,
      dataAttached: !!fabricObject.data,
      dataContent: fabricObject.data
    });

    // 🚨 SOBRESCRIBIR toObject para garantizar inclusión de data
    const originalToObject = fabricObject.toObject;
    fabricObject.toObject = function(propertiesToInclude?: string[]) {
      const obj = originalToObject.call(this, propertiesToInclude);
      // Forzar inclusión de data
      if (this.data) {
        obj.data = this.data;
        console.log('✅ toObject OVERRIDE: data incluida en serialización:', this.data);
      }
      return obj;
    };
    
    return fabricObject;
  }, []);

  // Inicializar canvas
  useEffect(() => {
    if (!canvasId || isInitialized || canvas) return;

    const initCanvas = () => {
      try {
        console.log('🟢 Iniciando canvas con id:', canvasId);
        
        // 🚨 DEBUG: Verificar qué elementos existen en el DOM
        const canvasElement = document.getElementById(canvasId);
        const wrapper = canvasElement?.parentElement;
        const allCanvasElements = document.querySelectorAll('canvas');
        const wrapperById = document.getElementById('fabric-canvas-wrapper');
        
        console.log('🔍 DEBUG DOM:', {
          canvasElement,
          wrapper, 
          allCanvasElements: allCanvasElements.length,
          wrapperById,
          canvasId,
          documentReady: document.readyState
        });
        
        if (!canvasElement) {
          console.error('❌ No se encontró el elemento canvas con id:', canvasId);
          console.error('❌ El componente FabricStyleEditor probablemente no se está renderizando');
          return;
        }

        // 🚨 PROTECCIÓN: Verificar si ya está inicializado por fabric.js
        if (canvasElement.hasAttribute('data-fabric')) {
          console.log('⚠️ Canvas ya inicializado por fabric.js, saltando...');
          return;
        }
        
        if (!wrapper) {
          console.error('❌ No se encontró el wrapper del canvas');
          // Usar dimensiones por defecto si no hay wrapper
          console.log('🔄 Usando dimensiones por defecto');
        }

        // 🚨 CORRECCIÓN CRÍTICA: Canvas SIEMPRE debe ser 1536×1024
        // El viewport se escala, pero las coordenadas internas son fijas
        const canvasWidth = 1536;  // FIJO - No dependiente del contenedor
        const canvasHeight = 1024; // FIJO - Ratio 3:2 perfecto
        
        // 🚨 CALCULAR ESCALA RESPONSIVA: El wrapper ya mantiene ratio 3:2
        let displayScale = 1.0;
        if (wrapper) {
          const wrapperRect = wrapper.getBoundingClientRect();
          const wrapperWidth = wrapperRect.width || 800;
          const wrapperHeight = wrapperRect.height || 533;
          
          // Como el wrapper ya tiene ratio 3:2, solo necesitamos escalar para que quepa
          displayScale = Math.min(wrapperWidth / canvasWidth, wrapperHeight / canvasHeight, 1.0);
          
          // Verificar que el wrapper mantiene ratio 3:2
          const wrapperRatio = wrapperWidth / wrapperHeight;
          const expectedRatio = canvasWidth / canvasHeight; // 1.5 (3:2)
          const ratioError = Math.abs(wrapperRatio - expectedRatio);
          
          console.log('🔍 Escalado responsivo:', {
            canvasLogico: { width: canvasWidth, height: canvasHeight, ratio: expectedRatio.toFixed(3) },
            wrapper: { width: wrapperWidth, height: wrapperHeight, ratio: wrapperRatio.toFixed(3) },
            ratioError: ratioError.toFixed(3),
            ratioCorrect: ratioError < 0.01,
            displayScale: displayScale.toFixed(3),
            finalDisplaySize: { 
              width: Math.floor(wrapperWidth), 
              height: Math.floor(wrapperHeight) 
            }
          });
          
          if (ratioError > 0.05) {
            console.warn('⚠️ RATIO WARNING: Wrapper no mantiene ratio 3:2 correctamente');
          }
        }

        const fabricCanvas = new fabric.Canvas(canvasId, {
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: '#ffffff',
          preserveObjectStacking: true,
          selection: true,
          selectionBorderColor: '#8b5cf6',
          selectionLineWidth: 2,
          selectionColor: 'rgba(139, 92, 246, 0.1)',
        });

        console.log('🟢 Canvas creado:', fabricCanvas);
        
        // 🚨 OBJETOS DE PRUEBA COMPLETAMENTE DESHABILITADOS
        // Los objetos de prueba causaban interferencia con el sistema multi-página
        // Solo se mantendrá un canvas limpio para empezar
        console.log('ℹ️ Inicializando canvas limpio sin objetos de prueba automáticos');

        // 🚨 FIX CRÍTICO: Forzar re-render inmediato y múltiple
        fabricCanvas.renderAll();
        console.log('🟢 Primer renderAll ejecutado');
        
        // 🚨 DEBUG: Verificar estado del canvas después de agregar objetos
        console.log('🔍 Estado del canvas después de agregar objetos:', {
          objects: fabricCanvas.getObjects().length,
          objectsDetail: fabricCanvas.getObjects().map(obj => `${obj.type} at ${obj.left},${obj.top}`),
          viewport: fabricCanvas.viewportTransform,
          zoom: fabricCanvas.getZoom(),
          dimensions: { width: fabricCanvas.width, height: fabricCanvas.height },
          actualCanvasSize: {
            width: fabricCanvas.lowerCanvasEl?.width,
            height: fabricCanvas.lowerCanvasEl?.height,
            clientWidth: fabricCanvas.lowerCanvasEl?.clientWidth,
            clientHeight: fabricCanvas.lowerCanvasEl?.clientHeight
          },
          canvasStyles: fabricCanvas.lowerCanvasEl?.style.cssText
        });
        
        // 🚨 FORZAR RENDERIZADO MÚLTIPLE CON DIFERENTES MÉTODOS
        fabricCanvas.requestRenderAll();
        fabricCanvas.renderAll();
        
        // Forzar re-render en el siguiente frame
        requestAnimationFrame(() => {
          fabricCanvas.renderAll();
          console.log('🟢 RenderAll en requestAnimationFrame');
        });
        
        // 🚨 FIX CRÍTICO: Configurar propiedades globales para Fabric.js
        console.log('🟢 Configurando canvas sin escalado complejo');

        // 🚨 FIX DEFINITIVO: Registrar propiedades custom para serialización en Fabric.js v6
        if (!fabric.Object.prototype.customProperties) {
          fabric.Object.prototype.customProperties = ['data'];
          console.log('✅ Propiedades custom registradas globalmente:', fabric.Object.prototype.customProperties);
        }
        
        // Forzar multiple renders con delays
        setTimeout(() => {
          fabricCanvas.renderAll();
          fabricCanvas.requestRenderAll();
          console.log('🟢 Segundo renderAll ejecutado');
        }, 50);
        
        setTimeout(() => {
          fabricCanvas.renderAll();
          fabricCanvas.requestRenderAll();
          console.log('🟢 Tercer renderAll ejecutado');
        }, 200);
        
        // 🚨 RENDERIZADO FINAL AGRESIVO
        setTimeout(() => {
          console.log('🔄 RENDERIZADO FINAL - Estado canvas:', {
            objects: fabricCanvas.getObjects().length,
            firstObjectVisible: fabricCanvas.getObjects()[0]?.visible,
            canvasVisible: fabricCanvas.getElement().style.display
          });
          fabricCanvas.renderAll();
          fabricCanvas.requestRenderAll();
          console.log('🟢 Renderizado final agresivo ejecutado');
        }, 500);

        // Event listeners para selección
        fabricCanvas.on('selection:created', (e) => {
          setSelectedObject(e.selected?.[0] || null);
        });

        fabricCanvas.on('selection:updated', (e) => {
          setSelectedObject(e.selected?.[0] || null);
        });

        fabricCanvas.on('selection:cleared', () => {
          setSelectedObject(null);
        });

        // Event listeners para undo/redo por página
        const saveState = () => {
          if (isUndoRedoing || isLoadingStateRef.current) {
            console.log('⏸️ Guardado pausado durante operación:', { isUndoRedoing, isLoadingStateFromRef: isLoadingStateRef.current, currentPageType });
            return;
          }
          
          // 🚨 DIAGNÓSTICO CRÍTICO: Verificar estado de objetos antes de serialización
          const canvasObjects = fabricCanvas.getObjects();
          console.log('🔍 DIAGNÓSTICO COMPLETO - Estado objetos antes de serialización:', {
            totalObjects: canvasObjects.length,
            objectDetails: canvasObjects.map((obj, index) => ({
              index,
              type: obj.type,
              hasData: 'data' in obj,
              dataValue: obj.data,
              customProperties: obj.customProperties,
              hasToObject: typeof obj.toObject === 'function',
              toObjectIncludesData: obj.data ? obj.toObject(['data']).data : 'NO_DATA_TO_TEST'
            }))
          });

          // 🚨 FIX CRÍTICO: Verificar y corregir objetos sin data personalizada
          canvasObjects.forEach((obj, index) => {
            if (!obj.data) {
              console.log(`🔧 CORRECCIÓN: Agregando data faltante a objeto ${obj.type} en índice ${index}`);
              obj.data = {
                id: `${obj.type}_${Date.now()}_${index}`,
                name: `${obj.type === 'image' ? 'Imagen' : 'Texto'} ${index + 1}`,
                type: obj.type || 'unknown',
                createdAt: Date.now(),
                pageType: currentPageTypeRef.current,
                elementType: 'dynamic',
                migrated: true // Flag para indicar que fue migrado automáticamente
              };
            } else {
              // Verificar que tenga todas las propiedades necesarias
              if (!obj.data.pageType) {
                obj.data.pageType = currentPageTypeRef.current;
                console.log(`🔧 CORRECCIÓN: Agregando pageType faltante a ${obj.data.id}`);
              }
              if (!obj.data.elementType) {
                obj.data.elementType = 'dynamic';
                console.log(`🔧 CORRECCIÓN: Agregando elementType faltante a ${obj.data.id}`);
              }
              if (!obj.data.name) {
                obj.data.name = `${obj.type === 'image' ? 'Imagen' : 'Texto'} ${index + 1}`;
                console.log(`🔧 CORRECCIÓN: Agregando name faltante a ${obj.data.id}`);
              }
            }
          });

          // Forzar serialización correcta de propiedades 'data' antes de toJSON
          forceDataSerialization(fabricCanvas);
          const state = JSON.stringify(fabricCanvas.toJSON(['data']));
          
          // 🔍 VERIFICACIÓN INMEDIATA: Log después de serialización forzada
          const parsedStateVerification = JSON.parse(state);
          console.log('✅ VERIFICACIÓN POST-FORZADO:', {
            objectsWithData: parsedStateVerification.objects?.filter((obj: any) => obj.data).length || 0,
            totalObjects: parsedStateVerification.objects?.length || 0,
            firstObjectData: parsedStateVerification.objects?.[0]?.data
          });
          
          const currentPageFromRef = currentPageTypeRef.current;
          console.log(`💾 Guardado estado en página ${currentPageFromRef}:`, {
            objectCount: fabricCanvas.getObjects().length,
            stateLength: state.length,
            timestamp: Date.now(),
            isLoadingStateRef: isLoadingStateRef.current, // 🚨 DEBUG: Verificar estado del flag usando ref
            stackTrace: new Error().stack?.split('\n').slice(2, 4).map(line => line.trim()), // Ver de dónde viene la llamada
            objectDetails: fabricCanvas.getObjects().map(obj => ({ // 🚨 DEBUG: Ver qué objetos se están guardando
              type: obj.type,
              pageType: obj.data?.pageType,
              id: obj.data?.id
            })),
            currentPageTypeState: currentPageType, // 🚨 DEBUG: Verificar qué currentPageType state se está usando
            currentPageTypeRef: currentPageFromRef, // 🚨 DEBUG: Verificar qué currentPageType ref se está usando
            aboutToSaveToPage: currentPageFromRef // 🚨 DEBUG: Confirmar a qué página se va a guardar
          });
          
          // 🚨 PROTECCIÓN ADICIONAL: Verificar usando ref (más confiable)
          if (isLoadingStateRef.current) {
            console.log('🚨 PROTECCIÓN: Evitando guardado durante carga de estado (usando ref)');
            return;
          }
          
          // 🚨 VERIFICACIÓN CRÍTICA: Detectar si currentPageType está desactualizado
          const allCanvasObjects = fabricCanvas.getObjects();
          const objectPageTypes = allCanvasObjects.map(obj => obj.data?.pageType).filter(Boolean);
          const uniquePageTypes = [...new Set(objectPageTypes)];
          
          if (uniquePageTypes.length > 1) {
            console.error(`❌ PROBLEMA DETECTADO: Canvas tiene objetos de múltiples páginas:`, {
              currentPageType,
              objectPageTypes: uniquePageTypes,
              shouldNotHappen: true
            });
          }
          
          // 🚨 USAR PÁGINA ACTUAL VERIFICADA: Si todos los objetos tienen el mismo pageType, usar ese
          const effectivePageType = uniquePageTypes.length === 1 ? uniquePageTypes[0] : currentPageFromRef;
          
          if (effectivePageType !== currentPageFromRef) {
            console.warn(`⚠️ CORRECCIÓN: currentPageTypeRef (${currentPageFromRef}) no coincide con objetos (${effectivePageType})`);
          }
          
          console.log(`🔍 VERIFICACIÓN GUARDADO - Página efectiva: ${effectivePageType}`, {
            originalCurrentPageTypeState: currentPageType,
            originalCurrentPageTypeRef: currentPageFromRef,
            effectivePageType,
            wasCorrected: effectivePageType !== currentPageFromRef,
            objectsInCanvas: allCanvasObjects.length,
            objectPageTypes: uniquePageTypes
          });
          
          // 🚨 CRÍTICO: Actualizar tanto el ref como el state simultáneamente con página correcta
          const currentPageStates = pageStatesRef.current;
          const updatedPageStates = {
            ...currentPageStates,
            [effectivePageType]: state
          };
          pageStatesRef.current = updatedPageStates;
          
          // 🚨 FIX MULTI-PÁGINA: Solo actualizar estado si es diferente para evitar ciclos
          const currentStateInMemory = currentPageStates[effectivePageType];
          if (currentStateInMemory !== state) {
            setPageStates(updatedPageStates);
            console.log(`🔄 Estado actualizado para ${effectivePageType}:`, {
              previousLength: currentStateInMemory?.length || 0,
              newLength: state.length,
              allPageStatesAfter: Object.keys(updatedPageStates).map(p => ({
                page: p,
                hasContent: updatedPageStates[p]?.length > 50,
                objectCount: updatedPageStates[p] ? JSON.parse(updatedPageStates[p]).objects?.length || 0 : 0
              }))
            });
          } else {
            console.log(`⏭️ Estado sin cambios para ${effectivePageType}, saltando actualización`);
          }
          
          // Actualizar undo stack de la página correcta
          setUndoStacks(prev => ({
            ...prev,
            [effectivePageType]: [...prev[effectivePageType], state].slice(-20)
          }));
          
          // Limpiar redo stack de la página correcta
          setRedoStacks(prev => ({
            ...prev,
            [effectivePageType]: []
          }));
        };

        fabricCanvas.on('object:added', saveState);
        fabricCanvas.on('object:removed', saveState);
        fabricCanvas.on('object:modified', saveState);

        // 🚨 NO GUARDAR ESTADO INICIAL AUTOMÁTICAMENTE
        // El estado se guardará automáticamente cuando se agreguen objetos
        // a través de los event listeners de object:added, object:removed, etc.
        console.log(`ℹ️ Canvas inicializado limpio. Estado se guardará al agregar objetos.`);

        // 🚨 FIX CRÍTICO: Asegurar visibilidad del canvas fabric.js
        const lowerCanvas = fabricCanvas.lowerCanvasEl;
        const upperCanvas = fabricCanvas.upperCanvasEl;
        const container = fabricCanvas.wrapperEl;
        
        // 🚨 APLICAR ESCALA RESPONSIVA: El contenedor fabric debe llenar el wrapper
        if (container) {
          container.style.cssText = '';
          container.style.setProperty('display', 'block', 'important');
          container.style.setProperty('visibility', 'visible', 'important');
          container.style.setProperty('opacity', '1', 'important');
          container.style.setProperty('position', 'static', 'important');
          container.style.setProperty('width', '100%', 'important');  // Llenar wrapper
          container.style.setProperty('height', '100%', 'important'); // Llenar wrapper
          container.style.setProperty('margin', '0', 'important');
          container.style.setProperty('padding', '0', 'important');
          container.style.setProperty('transform-origin', 'top left', 'important');
          container.style.setProperty('transform', `scale(${displayScale})`, 'important');
          
          console.log('🎨 Aplicando escala responsiva:', {
            canvasInterno: `${canvasWidth}×${canvasHeight}`,
            wrapperSize: `${wrapper?.getBoundingClientRect().width}×${wrapper?.getBoundingClientRect().height}`,
            displayScale: displayScale.toFixed(3),
            containerSize: '100% (fill wrapper)'
          });
        }
        
        if (lowerCanvas) {
          lowerCanvas.style.cssText = '';
          lowerCanvas.style.setProperty('display', 'block', 'important');
          lowerCanvas.style.setProperty('visibility', 'visible', 'important');
          lowerCanvas.style.setProperty('opacity', '1', 'important');
          lowerCanvas.style.setProperty('position', 'static', 'important');
          lowerCanvas.style.setProperty('z-index', 'auto', 'important');
          lowerCanvas.style.setProperty('transform', 'none', 'important');
          lowerCanvas.style.setProperty('pointer-events', 'auto', 'important');
        }
        
        if (upperCanvas) {
          upperCanvas.style.cssText = '';
          upperCanvas.style.setProperty('display', 'block', 'important');
          upperCanvas.style.setProperty('visibility', 'visible', 'important');
          upperCanvas.style.setProperty('opacity', '1', 'important');
          upperCanvas.style.setProperty('position', 'static', 'important');
          upperCanvas.style.setProperty('z-index', 'auto', 'important');
          upperCanvas.style.setProperty('transform', 'none', 'important');
          upperCanvas.style.setProperty('pointer-events', 'auto', 'important');
        }

        setCanvas(fabricCanvas);
        setIsInitialized(true);

        // 🚨 DEBUG PROFUNDO: Investigar por qué no es visible
        console.log('🔍 DEBUG PROFUNDO - Estado completo del canvas:', {
          fabricCanvasDimensions: `${fabricCanvas.width}x${fabricCanvas.height}`,
          lowerCanvas: {
            exists: !!lowerCanvas,
            display: lowerCanvas?.style.display,
            visibility: lowerCanvas?.style.visibility,
            opacity: lowerCanvas?.style.opacity,
            zIndex: lowerCanvas?.style.zIndex,
            position: lowerCanvas?.style.position,
            width: lowerCanvas?.width,
            height: lowerCanvas?.height,
            clientWidth: lowerCanvas?.clientWidth,
            clientHeight: lowerCanvas?.clientHeight,
            offsetParent: lowerCanvas?.offsetParent?.tagName,
            getBoundingClientRect: lowerCanvas?.getBoundingClientRect()
          },
          upperCanvas: {
            exists: !!upperCanvas,
            display: upperCanvas?.style.display,
            visibility: upperCanvas?.style.visibility,
            opacity: upperCanvas?.style.opacity,
            zIndex: upperCanvas?.style.zIndex
          },
          container: {
            exists: !!container,
            display: container?.style.display,
            visibility: container?.style.visibility,
            opacity: container?.style.opacity,
            className: container?.className,
            getBoundingClientRect: container?.getBoundingClientRect()
          }
        });

        console.log('✅ Canvas Fabric.js inicializado correctamente', {
          dimensions: `${fabricCanvas.width}x${fabricCanvas.height}`,
          backgroundColor: fabricCanvas.backgroundColor,
          lowerCanvasVisible: lowerCanvas?.style.display,
          upperCanvasVisible: upperCanvas?.style.display
        });

      } catch (error) {
        console.error('❌ Error inicializando canvas Fabric.js:', error);
      }
    };

    // Delay para asegurar que el DOM element existe y tiene dimensiones
    setTimeout(initCanvas, 300);

    return () => {
      if (canvas) {
        if (canvas.resizeCanvas) {
          window.removeEventListener('resize', canvas.resizeCanvas);
        }
        canvas.dispose();
        setCanvas(null);
        setIsInitialized(false);
        setSelectedObject(null);
        setUndoStacks({
          cover: [],
          page: [],
          dedicatoria: []
        });
        setRedoStacks({
          cover: [],
          page: [],
          dedicatoria: []
        });
      }
    };
  }, [canvasId, isInitialized]);

  // 🚨 DESHABILITADO TEMPORALMENTE: Este efecto causaba conflictos de estado
  // Guardado manual disponible a través del hook useFabricPersistence
  // useEffect(() => {
  //   if (!canvas) return;

  //   const updateCurrentPageState = () => {
  //     const currentState = JSON.stringify(canvas.toJSON(['data']));
      
  //     // Actualizar tanto el ref como el state
  //     pageStatesRef.current = {
  //       ...pageStatesRef.current,
  //       [currentPageType]: currentState
  //     };
      
  //     setPageStates(prev => ({
  //       ...prev,
  //       [currentPageType]: currentState
  //     }));
  //   };

  //   // Escuchar múltiples eventos para capturar todos los cambios
  //   const handleChange = () => {
  //     updateCurrentPageState();
  //   };

  //   canvas.on('object:added', handleChange);
  //   canvas.on('object:removed', handleChange);
  //   canvas.on('object:modified', handleChange);
  //   canvas.on('object:moving', handleChange);
  //   canvas.on('object:scaling', handleChange);
  //   canvas.on('object:rotating', handleChange);

  //   return () => {
  //     canvas.off('object:added', handleChange);
  //     canvas.off('object:removed', handleChange);
  //     canvas.off('object:modified', handleChange);
  //     canvas.off('object:moving', handleChange);
  //     canvas.off('object:scaling', handleChange);
  //     canvas.off('object:rotating', handleChange);
  //   };
  // }, [canvas, currentPageType]);

  // Agregar texto
  const addText = useCallback((text: string) => {
    if (!canvas) {
      console.error('❌ Canvas no disponible para agregar texto');
      return;
    }

    // 🚨 INTERCEPTOR: Detectar llamadas automáticas no deseadas
    const stack = new Error().stack;
    console.log('🔍 INTERCEPTOR addText llamado:', {
      text,
      currentPageType,
      fromWhere: stack?.split('\n').slice(1, 4).map(line => line.trim()),
      objectCountBefore: canvas.getObjects().length,
      timestamp: Date.now()
    });

    const textObject = new fabric.Text(text, {
      left: 200,   // Coordenadas para canvas 1536×1024
      top: 200,    // Coordenadas para canvas 1536×1024
      fontSize: 72, // Más grande para canvas 1536×1024
      fontFamily: '"Indie Flower", cursive', // Fuente por defecto del sistema legacy
      fontWeight: '400',
      fill: '#000000', // Negro por defecto (más apropiado para texto)
      selectable: true,
      hasControls: true,
      hasBorders: true,
      opacity: 1, // Opacidad máxima
      visible: true // Forzar visibilidad
    });

    // 🚨 FIX DEFINITIVO: Usar helper para asegurar propiedades data en serialización
    const textData = {
      id: `text_${Date.now()}`,
      name: text.length > 20 ? text.substring(0, 20) + '...' : text,
      type: 'text',
      createdAt: Date.now(),
      originalText: text, // Guardar texto original para transformaciones
      pageType: currentPageType, // 🚨 NUEVO: Marcar a qué página pertenece
      elementType: 'dynamic' // 🚨 NUEVO: Por defecto los elementos son dinámicos
    };
    
    ensureDataProperty(textObject, textData);

    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    
    // 🚨 MÚLTIPLES INTENTOS DE RENDER
    canvas.renderAll();
    
    // Debug completo
    console.log('🔍 DEBUG TEXTO AGREGADO:', {
      text,
      id: textObject.data.id,
      pageType: currentPageType,
      position: { left: textObject.left, top: textObject.top },
      dimensions: { width: textObject.width, height: textObject.height },
      canvasDimensions: { width: canvas.width, height: canvas.height },
      canvasZoom: canvas.getZoom(),
      canvasViewport: canvas.viewportTransform,
      totalObjects: canvas.getObjects().length,
      isObjectVisible: textObject.visible,
      objectOpacity: textObject.opacity,
      canvasElement: canvas.lowerCanvasEl,
      canvasHTML: canvas.lowerCanvasEl?.outerHTML?.substring(0, 200)
    });

    // 🚨 FIX CRÍTICO: Verificar que fabric.js renderice correctamente
    console.log('🔍 DEBUG FABRIC RENDERING:', {
      objectsInCanvas: canvas.getObjects().length,
      objectDetails: canvas.getObjects().map(obj => ({
        type: obj.type,
        visible: obj.visible,
        left: obj.left,
        top: obj.top,
        fill: obj.fill || obj.stroke,
        pageType: obj.data?.pageType
      })),
      canvasBackgroundColor: canvas.backgroundColor,
      canvasContext: !!canvas.getContext()
    });

    // 🚨 FORZAR FABRIC.JS A RENDERIZAR CORRECTAMENTE
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    // Forzar re-render después de un momento
    setTimeout(() => {
      canvas.renderAll();
      console.log('🔄 Re-render forzado');
    }, 100);
  }, [canvas, currentPageType, ensureDataProperty]);

  // Agregar imagen
  const addImage = useCallback((url: string) => {
    console.log('🖼️ addImage llamado con URL:', url);
    console.log('🖼️ Canvas disponible:', !!canvas);
    
    if (!canvas) {
      console.error('🖼️ ERROR: Canvas no disponible en addImage');
      return;
    }

    console.log('🖼️ Método alternativo: Crear img element...');
    // Método alternativo: crear img element y luego fabric.Image.fromElement
    const imgElement = document.createElement('img');
    imgElement.crossOrigin = 'anonymous';
    
    imgElement.onload = () => {
      console.log('🖼️ Imagen cargada en elemento img');
      
      try {
        const fabricImg = new fabric.Image(imgElement, {
          left: 200,
          top: 200,
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: true,
          hasControls: true,
          hasBorders: true
        });

        // 🚨 FIX DEFINITIVO: Usar helper para asegurar propiedades data en serialización
        const imageData = {
          id: `image_${Date.now()}`,
          name: `Imagen ${Date.now()}`,
          type: 'image',
          createdAt: Date.now(),
          originalUrl: url,
          pageType: currentPageType,
          elementType: 'dynamic'
        };
        
        ensureDataProperty(fabricImg, imageData);

        console.log('🖼️ Objeto fabric.Image creado:', fabricImg);
        console.log('🖼️ Agregando al canvas...');
        
        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();

        console.log('🖼️ ✅ Imagen agregada exitosamente:', { 
          id: fabricImg.data.id, 
          width: fabricImg.width, 
          height: fabricImg.height 
        });
      } catch (error) {
        console.error('🖼️ ❌ Error creando fabric.Image:', error);
      }
    };
    
    imgElement.onerror = (error) => {
      console.error('🖼️ ❌ Error cargando elemento img:', error);
    };
    
    console.log('🖼️ Asignando src a elemento img...');
    imgElement.src = url;
  }, [canvas, currentPageType, ensureDataProperty]);

  // 🚨 NUEVO: Agregar imagen desde archivo usando Storage
  const addImageFromFile = useCallback(async (file: File): Promise<void> => {
    if (!canvas) {
      console.error('🖼️ ERROR: Canvas no disponible en addImageFromFile');
      return;
    }

    console.log('📤 Iniciando upload de imagen desde archivo:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      // Asegurar que el bucket existe
      await fabricStorageService.ensureBucketExists();

      // Convertir File a base64 para upload
      const base64Data = await fileToBase64(file);
      
      // Subir imagen a Storage
      const result = await fabricStorageService.uploadImageFromBase64(base64Data, file.name.split('.')[0], {
        compress: true,
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.9
      });

      if (result.success && result.url) {
        console.log('✅ Imagen subida a Storage:', result.url);
        
        // Usar la función addImage existente con la URL de Storage
        addImage(result.url);
      } else {
        console.error('❌ Error subiendo imagen:', result.error);
        
        // Fallback: usar base64 directo si falla Storage
        console.log('🔄 Fallback: usando base64 directo');
        await addImageFromBase64(base64Data);
      }

    } catch (error) {
      console.error('❌ Error en addImageFromFile:', error);
      
      // Fallback: convertir a base64 y usar método anterior
      try {
        const base64Data = await fileToBase64(file);
        await addImageFromBase64(base64Data);
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
      }
    }
  }, [canvas, currentPageType, addImage]);

  // 🚨 NUEVO: Agregar imagen desde base64 usando Storage
  const addImageFromBase64 = useCallback(async (base64Data: string): Promise<void> => {
    if (!canvas) {
      console.error('🖼️ ERROR: Canvas no disponible en addImageFromBase64');
      return;
    }

    console.log('📤 Iniciando upload de imagen desde base64...');

    try {
      // Asegurar que el bucket existe
      await fabricStorageService.ensureBucketExists();

      // Subir imagen a Storage
      const result = await fabricStorageService.uploadImageFromBase64(base64Data, undefined, {
        compress: true,
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.9
      });

      if (result.success && result.url) {
        console.log('✅ Imagen subida a Storage desde base64:', result.url);
        
        // Usar la función addImage existente con la URL de Storage
        addImage(result.url);
      } else {
        console.error('❌ Error subiendo imagen desde base64:', result.error);
        
        // Fallback: usar base64 directo
        console.log('🔄 Fallback: usando base64 directo en fabric.js');
        addImage(base64Data);
      }

    } catch (error) {
      console.error('❌ Error en addImageFromBase64:', error);
      
      // Fallback: usar base64 directo
      addImage(base64Data);
    }
  }, [canvas, currentPageType, addImage]);

  // 🚨 HELPER: Convertir File a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Error reading file as base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Remover objeto
  const removeObject = useCallback((obj: fabric.Object) => {
    if (!canvas) return;

    canvas.remove(obj);
    canvas.renderAll();

    console.log('🗑️ Objeto removido:', { id: obj.data?.id, type: obj.type });
  }, [canvas]);

  // Limpiar canvas
  const clearCanvas = useCallback(() => {
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();

    console.log('🧹 Canvas limpiado');
  }, [canvas]);

  // 🚨 NUEVA FUNCIÓN: Resetear todo el estado de páginas
  const resetAllPages = useCallback(() => {
    if (!canvas) return;

    // Limpiar canvas actual
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();

    // Resetear todos los estados
    const emptyStates = {
      cover: '',
      page: '',
      dedicatoria: ''
    };
    
    setPageStates(emptyStates);
    pageStatesRef.current = emptyStates;
    
    setUndoStacks({
      cover: [],
      page: [],
      dedicatoria: []
    });
    
    setRedoStacks({
      cover: [],
      page: [],
      dedicatoria: []
    });

    console.log('🔄 RESET COMPLETO: Todos los estados limpiados');
  }, [canvas]);

  // 🚨 FUNCIÓN LIMPIEZA: Eliminar objetos duplicados reconstructed_*
  const cleanDuplicatedObjects = useCallback((targetCanvas: fabric.Canvas) => {
    const allObjects = targetCanvas.getObjects();
    const duplicatedObjects = allObjects.filter(obj => 
      obj.data?.id?.includes('reconstructed_') || 
      (obj.data?.reconstructed === true)
    );
    
    if (duplicatedObjects.length > 0) {
      console.log('🧹 LIMPIANDO objetos duplicados:', {
        totalObjects: allObjects.length,
        duplicatedObjects: duplicatedObjects.length,
        duplicatedIds: duplicatedObjects.map(obj => obj.data?.id)
      });
      
      duplicatedObjects.forEach(obj => {
        targetCanvas.remove(obj);
      });
      
      targetCanvas.renderAll();
      
      console.log('✅ LIMPIEZA COMPLETADA:', {
        objectsRemoved: duplicatedObjects.length,
        remainingObjects: targetCanvas.getObjects().length
      });
    }
  }, []);

  // 🚨 FIX CRÍTICO: Función helper para reconstrucción manual de objetos
  const manualObjectReconstruction = useCallback((targetCanvas: fabric.Canvas, expectedObjects: any[], targetPageType: PageType) => {
    console.log('🔧 INICIANDO RECONSTRUCCIÓN MANUAL:', {
      objectsToReconstruct: expectedObjects.length,
      targetPage: targetPageType
    });
    
    expectedObjects.forEach((objData, index) => {
      try {
        let fabricObject: fabric.Object | null = null;
        
        if (objData.type === 'Image') {
          // Reconstruir imagen
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const fabricImg = new fabric.Image(img, {
              left: objData.left || 0,
              top: objData.top || 0,
              scaleX: objData.scaleX || 1,
              scaleY: objData.scaleY || 1,
              angle: objData.angle || 0,
              opacity: objData.opacity || 1,
              visible: objData.visible !== false,
              data: {
                id: objData.data?.id || `reconstructed_image_${Date.now()}_${index}`,
                name: objData.data?.name || `Imagen ${index + 1}`,
                type: 'image',
                pageType: targetPageType,
                elementType: objData.data?.elementType || 'dynamic',
                originalUrl: objData.src,
                reconstructed: true
              }
            });
            
            targetCanvas.add(fabricImg);
            targetCanvas.renderAll();
            console.log('✅ Imagen reconstruida:', fabricImg.data?.name);
          };
          img.src = objData.src;
          
        } else if (objData.type === 'Text') {
          // Reconstruir texto
          fabricObject = new fabric.Text(objData.text || '', {
            left: objData.left || 0,
            top: objData.top || 0,
            fontSize: objData.fontSize || 72,
            fontFamily: objData.fontFamily || '"Indie Flower", cursive',
            fontWeight: objData.fontWeight || '400',
            fill: objData.fill || '#000000',
            angle: objData.angle || 0,
            opacity: objData.opacity || 1,
            visible: objData.visible !== false,
            textAlign: objData.textAlign || 'left',
            lineHeight: objData.lineHeight || 1.16,
            data: {
              id: objData.data?.id || `reconstructed_text_${Date.now()}_${index}`,
              name: objData.data?.name || `Texto ${index + 1}`,
              type: 'text',
              pageType: targetPageType,
              elementType: objData.data?.elementType || 'dynamic',
              originalText: objData.text,
              reconstructed: true
            }
          });
          
          if (fabricObject) {
            targetCanvas.add(fabricObject);
            console.log('✅ Texto reconstruido:', fabricObject.data?.name);
          }
        }
      } catch (error) {
        console.error('❌ Error reconstruyendo objeto:', index, error);
      }
    });
    
    targetCanvas.renderAll();
    console.log('✅ RECONSTRUCCIÓN MANUAL COMPLETADA');
  }, []);

  // Cambiar tipo de página
  const switchPageType = useCallback((pageType: PageType) => {
    if (!canvas || pageType === currentPageType) return;

    console.log(`🔄 Iniciando cambio de página: ${currentPageType} → ${pageType}`);

    // 🚨 LOGGING AVANZADO: Estado inicial completo
    const initialObjects = canvas.getObjects();
    console.log(`🔍 ESTADO INICIAL - Página ${currentPageType}:`, {
      canvasObjectCount: initialObjects.length,
      objectDetails: initialObjects.map(obj => ({
        type: obj.type,
        id: obj.data?.id,
        name: obj.data?.name,
        position: { left: obj.left, top: obj.top },
        visible: obj.visible
      })),
      currentPageStatesRef: Object.keys(pageStatesRef.current).map(key => ({
        page: key,
        hasState: !!pageStatesRef.current[key],
        stateLength: pageStatesRef.current[key]?.length || 0,
        objectCount: pageStatesRef.current[key] ? JSON.parse(pageStatesRef.current[key]).objects?.length || 0 : 0
      }))
    });

    // Guardar estado actual de la página antes de cambiar
    // Forzar serialización correcta de propiedades 'data' antes de toJSON
    forceDataSerialization(canvas);
    const currentState = JSON.stringify(canvas.toJSON(['data']));
    
    // 🔍 VERIFICACIÓN INMEDIATA: Log después de serialización forzada (switchPageType)
    const parsedStateVerification = JSON.parse(currentState);
    console.log('✅ VERIFICACIÓN POST-FORZADO (SWITCH):', {
      objectsWithData: parsedStateVerification.objects?.filter((obj: any) => obj.data).length || 0,
      totalObjects: parsedStateVerification.objects?.length || 0,
      firstObjectData: parsedStateVerification.objects?.[0]?.data
    });
    console.log(`💾 Guardando estado de página ${currentPageType}:`, {
      objectCount: canvas.getObjects().length,
      hasData: currentState.length > 50,
      statePreview: currentState.substring(0, 100),
      fullStateLength: currentState.length
    });
    
    // 🚨 DEBUG CRÍTICO: Verificar que el JSON serializado incluye propiedades data
    const parsedState = JSON.parse(currentState);
    console.log('🔍 ANÁLISIS CRÍTICO - JSON SERIALIZADO:', {
      totalObjects: parsedState.objects?.length || 0,
      objectsWithData: parsedState.objects?.filter((obj: any) => obj.data).length || 0,
      firstObjectData: parsedState.objects?.[0]?.data,
      allObjectsData: parsedState.objects?.map((obj: any, idx: number) => ({
        index: idx,
        type: obj.type,
        hasData: !!obj.data,
        dataValue: obj.data
      }))
    });

    // 🚨 VERIFICACIÓN: Asegurar que el estado se guarda correctamente
    try {
      const parsedCurrentState = JSON.parse(currentState);
      console.log(`🔍 VERIFICACIÓN ESTADO GUARDADO:`, {
        objectsInState: parsedCurrentState.objects?.length || 0,
        objectDetails: parsedCurrentState.objects?.map((obj: any) => ({
          type: obj.type,
          id: obj.data?.id,
          hasData: !!obj.data
        })) || [],
        hasBackground: !!parsedCurrentState.background,
        version: parsedCurrentState.version
      });
    } catch (e) {
      console.error(`❌ Error parsing estado guardado:`, e);
    }

    // CRÍTICO: Actualizar directamente el ref para evitar problemas de timing
    const currentPageStates = pageStatesRef.current;
    const updatedPageStates = {
      ...currentPageStates,
      [currentPageType]: currentState
    };
    pageStatesRef.current = updatedPageStates;

    // También actualizar el estado (para UI) - PRESERVANDO TODAS LAS PÁGINAS
    setPageStates(updatedPageStates);
    
    console.log(`💾 switchPageType - Estados preservados:`, Object.keys(updatedPageStates).map(key => ({
      page: key,
      hasContent: updatedPageStates[key]?.length > 50,
      objectCount: updatedPageStates[key] ? JSON.parse(updatedPageStates[key]).objects?.length || 0 : 0,
      isSource: key === currentPageType,
      isTarget: key === pageType,
      stateLength: updatedPageStates[key]?.length || 0
    })));

    console.log(`📋 Estados actualizados directamente:`, Object.keys(updatedPageStates).map(key => ({
      page: key, 
      hasContent: updatedPageStates[key]?.length > 50,
      objectCount: updatedPageStates[key] ? JSON.parse(updatedPageStates[key]).objects?.length || 0 : 0,
      isCurrent: key === currentPageType,
      isTarget: key === pageType
    })));

    // 🚨 VERIFICACIÓN: Confirmar que el ref se actualizó
    console.log(`🔍 VERIFICACIÓN REF ACTUALIZADO:`, {
      refMatchesUpdated: JSON.stringify(pageStatesRef.current) === JSON.stringify(updatedPageStates),
      targetPageInRef: !!pageStatesRef.current[pageType],
      sourcePageInRef: !!pageStatesRef.current[currentPageType],
      refKeys: Object.keys(pageStatesRef.current),
      updatedKeys: Object.keys(updatedPageStates)
    });

    // Cambiar a la nueva página
    setCurrentPageType(pageType);
    currentPageTypeRef.current = pageType; // 🚨 CRÍTICO: Actualizar ref inmediatamente
    
    // 🚨 DEBUG: Verificar que currentPageType se actualice
    console.log(`🔄 currentPageType actualizado: ${currentPageType} → ${pageType} (ref: ${currentPageTypeRef.current})`);

    // 🚨 DELAY PARA ASEGURAR QUE EL ESTADO SE ACTUALICE
    setTimeout(() => {
      // Cargar estado de la nueva página (usar el ref actualizado)
      const newPageState = pageStatesRef.current[pageType];
      
      console.log(`📖 Cargando página ${pageType} (después de delay):`, {
        hasState: !!newPageState,
        stateLength: newPageState?.length || 0,
        objectCount: newPageState ? JSON.parse(newPageState).objects?.length || 0 : 0,
        statePreview: newPageState?.substring(0, 100),
        sourceFromRef: true
      });

      if (newPageState && newPageState.length > 50) {
        try {
          // 🚨 MARCADOR DE ESTADO DE CARGA (sin auto-guardado)
          setIsLoadingState(true);
          isLoadingStateRef.current = true;
          console.log(`🔄 Iniciando loadFromJSON para página ${pageType}`);
          const stateToParse = JSON.parse(newPageState);
          console.log(`🔍 Estado a cargar:`, {
            objectsToLoad: stateToParse.objects?.length || 0,
            objectTypes: stateToParse.objects?.map((obj: any) => obj.type) || [],
            hasBackground: !!stateToParse.background
          });

          // 🚨 FIX CRÍTICO: Limpiar canvas ANTES de cargar nuevo estado para evitar acumulación
          console.log(`🧹 LIMPIANDO canvas antes de cargar página ${pageType}:`, {
            objectsBeforeClear: canvas.getObjects().length,
            clearingForPage: pageType
          });
          
          canvas.clear();
          
          console.log(`✅ Canvas limpiado, cargando estado de página ${pageType}`);
          
          // 🚨 FIX CRÍTICO REAL: En Fabric.js v6, loadFromJSON requiere reviver function
          // para preservar propiedades personalizadas como 'data'
          const parsedState = JSON.parse(newPageState);
          
          console.log('🔧 DEBUG JSON ANTES DE CARGAR:', {
            objectsToLoad: parsedState.objects?.length || 0,
            firstObjectData: parsedState.objects?.[0]?.data,
            hasDataFields: parsedState.objects?.some(obj => obj.data)
          });
          
          // 🚨 FIX DEFINITIVO: En Fabric.js v6, usar reviver function para preservar 'data'
          const reviver = (o: any, object: any) => {
            console.log('🔧 REVIVER EJECUTÁNDOSE:', {
              hasObject: !!object,
              hasO: !!o,
              oType: typeof o,
              oHasData: !!(o && o.data),
              oDataType: o && o.data ? typeof o.data : 'none',
              oDataValue: o && o.data,
              objectType: object && object.type
            });
            
            // El parámetro 'o' contiene los datos serializados del objeto
            // El parámetro 'object' es el objeto Fabric recién creado
            
            if (!object || !o) {
              console.log('⚠️ REVIVER: objeto o data faltante, retornando object sin cambios');
              return object;
            }
            
            // 🚨 PRESERVAR PROPIEDADES DATA: Deep clone para evitar referencias
            if (o.data && typeof o.data === 'object') {
              object.data = JSON.parse(JSON.stringify(o.data));
              console.log('✅ REVIVER: Propiedades data OBJETO restauradas:', {
                objectType: object.type,
                dataRestored: object.data,
                nameRestored: object.data.name,
                idRestored: object.data.id
              });
            } else if (o.data) {
              object.data = o.data;
              console.log('✅ REVIVER: Propiedades data SIMPLES restauradas:', {
                objectType: object.type,
                dataRestored: object.data
              });
            } else {
              console.log('⚠️ REVIVER: Sin propiedades data para restaurar en objeto:', object.type);
            }
            
            // 🚨 VERIFICACIÓN INMEDIATA POST-REVIVER
            console.log('🔍 REVIVER POST-VERIFICACIÓN:', {
              objectType: object.type,
              hasDataProperty: 'data' in object,
              dataValue: object.data,
              objectKeys: Object.keys(object).length
            });
            
            return object;
          };

          canvas.loadFromJSON(parsedState, reviver).then(() => {
            // 🧹 LIMPIEZA INMEDIATA: Eliminar cualquier objeto duplicado que pueda haber cargado
            cleanDuplicatedObjects(canvas);
            
            // 🚨 FIX CRÍTICO: Aplicar ensureDataProperty a TODOS los objetos cargados
            const loadedObjects = canvas.getObjects();
            console.log('🔍 POST-LOADFROMJSON ANÁLISIS COMPLETO:', {
              totalLoadedObjects: loadedObjects.length,
              objectsAnalysis: loadedObjects.map((obj, index) => ({
                index,
                type: obj.type,
                hasDataProperty: 'data' in obj,
                dataValue: obj.data,
                dataType: typeof obj.data,
                dataKeys: obj.data ? Object.keys(obj.data) : [],
                allObjectKeys: Object.keys(obj).slice(0, 10) // Primeras 10 propiedades
              }))
            });
            
            loadedObjects.forEach((obj, index) => {
              console.log(`🔧 PROCESANDO OBJETO ${index}:`, {
                type: obj.type,
                hasData: !!obj.data,
                dataValue: obj.data
              });
              
              if (obj.data) {
                ensureDataProperty(obj, obj.data);
                console.log('✅ toObject override aplicado post-load:', obj.data.name || obj.data.id);
              } else {
                console.log('⚠️ OBJETO SIN PROPIEDAD DATA, no se puede aplicar override:', obj.type);
              }
            });
            
            // 🚨 FIX CRÍTICO: Verificar que las propiedades data se preservaron
            const expectedObjects = parsedState.objects || [];
            
            console.log('🔧 DEBUG COMPLETO POST-LOAD:', {
              expectedObjects: expectedObjects.length,
              loadedObjects: loadedObjects.length,
              pageType: pageType,
              expectedHasData: expectedObjects.map(obj => ({
                type: obj.type,
                hasData: !!obj.data,
                dataId: obj.data?.id,
                dataName: obj.data?.name,
                fullData: obj.data
              })),
              loadedHasData: loadedObjects.map(obj => ({
                type: obj.type,
                hasData: !!obj.data,
                dataId: obj.data?.id,
                dataName: obj.data?.name,
                fullData: obj.data,
                fabricObject: obj.toObject ? obj.toObject(['data']) : 'NO_TOOBJECT'
              }))
            });
            
            // 🚨 DETECCIÓN INTELIGENTE: Verificar si hay objetos sin metadatos
            const objectsWithoutMetadata = loadedObjects.filter(obj => !obj.data || !obj.data.id || !obj.data.name || !obj.data.pageType);
            const hasMetadataIssues = objectsWithoutMetadata.length > 0;
            const hasCountMismatch = expectedObjects.length !== loadedObjects.length;
            
            console.log('🔍 VERIFICACIÓN POST-LOAD:', {
              expectedCount: expectedObjects.length,
              loadedCount: loadedObjects.length,
              hasCountMismatch,
              objectsWithoutMetadata: objectsWithoutMetadata.length,
              hasMetadataIssues,
              needsFallback: hasCountMismatch && loadedObjects.length === 0
            });
            
            // 🚨 FALLBACK COMPLETAMENTE DESHABILITADO PARA DEBUG
            const shouldUseFallback = false; // FORZAR A FALSE para evitar duplicación
            
            console.log('🔍 EVALUACIÓN FALLBACK (DESHABILITADO):', {
              expectedCount: expectedObjects.length,
              loadedCount: loadedObjects.length,
              shouldUseFallback: false,
              hasCountMismatch,
              hasMetadataIssues,
              fallbackDisabled: true
            });
            
            if (false) { // NUNCA EJECUTAR FALLBACK
              console.error('🚨 FALLBACK ACTIVADO - loadFromJSON falló completamente:', {
                expectedCount: expectedObjects.length,
                loadedCount: loadedObjects.length,
                pageType,
                jsonStatePreview: newPageState.substring(0, 500)
              });
              
              console.log('🔄 EJECUTANDO reconstrucción manual como último recurso...');
              manualObjectReconstruction(canvas, expectedObjects, pageType);
              
              // ✅ FINALIZAR CARGA CON OBJETOS RECONSTRUIDOS
              setIsLoadingState(false);
              isLoadingStateRef.current = false;
              
              // Renderizado final agresivo
              canvas.renderAll();
              requestAnimationFrame(() => {
                canvas.renderAll();
                console.log('🔄 Segundo render en requestAnimationFrame');
              });
              
              setTimeout(() => {
                canvas.renderAll();
                console.log('🔄 Tercer render con delay');
                console.log('✅ Carga completa sin auto-guardado');
              }, 500);
              
              return; // Salir temprano porque ya manejamos la reconstrucción
            }
            
            // 🚨 SI HAY OBJETOS PERO CON METADATOS FALTANTES, SOLO RESTAURAR METADATOS
            if (hasMetadataIssues && loadedObjects.length > 0) {
              console.log('📝 OBJETOS CARGADOS PERO FALTANTES METADATOS - Restaurando solamente metadatos...');
            }
            
            let correctionsMade = 0;
            
            // ESTRATEGIA: Mapear objetos cargados con datos originales por orden
            loadedObjects.forEach((loadedObj, index) => {
              const expectedData = expectedObjects[index]?.data;
              
              if (expectedData) {
                // ✅ PRESERVAR datos originales del JSON
                loadedObj.data = {
                  ...expectedData,
                  pageType: pageType, // Asegurar pageType correcto
                  restoredFromJSON: true // Flag para debugging
                };
                
                console.log(`✅ PRESERVADO: ${loadedObj.type} → ${loadedObj.data.name} (id: ${loadedObj.data.id})`);
                correctionsMade++;
              } else if (!loadedObj.data) {
                // Fallback si no hay data esperada
                console.log(`🔧 POST-CARGA: Agregando data faltante a objeto cargado ${loadedObj.type} en índice ${index}`);
                loadedObj.data = {
                  id: `${loadedObj.type}_loaded_${Date.now()}_${index}`,
                  name: `${loadedObj.type === 'image' ? 'Imagen' : 'Texto'} ${index + 1}`,
                  type: loadedObj.type || 'unknown',
                  createdAt: Date.now(),
                  pageType: pageType,
                  elementType: 'dynamic',
                  migratedPostLoad: true
                };
                correctionsMade++;
              } else {
                // Solo verificar propiedades faltantes sin sobrescribir
                let objectFixed = false;
                if (!loadedObj.data.pageType) {
                  loadedObj.data.pageType = pageType;
                  objectFixed = true;
                }
                if (!loadedObj.data.elementType) {
                  loadedObj.data.elementType = 'dynamic';
                  objectFixed = true;
                }
                if (!loadedObj.data.name) {
                  loadedObj.data.name = `${loadedObj.type === 'image' ? 'Imagen' : 'Texto'} ${index + 1}`;
                  objectFixed = true;
                }
                if (objectFixed) {
                  console.log(`🔧 POST-CARGA: Propiedades corregidas en ${loadedObj.data.id}`);
                  correctionsMade++;
                }
              }
            });
            
            if (correctionsMade > 0) {
              console.log(`✅ POST-CARGA: ${correctionsMade} objetos corregidos con data faltante`);
            }
            
            // 🚨 RECUPERACIÓN: Si faltan objetos, intentar cargar manualmente
            if (expectedObjects.length > loadedObjects.length) {
              console.warn('🔄 RECUPERACIÓN: Intentando cargar objetos faltantes manualmente...');
              const missingCount = expectedObjects.length - loadedObjects.length;
              
              try {
                // Intentar agregar objetos faltantes uno por uno
                for (let i = loadedObjects.length; i < expectedObjects.length; i++) {
                  const missingObj = expectedObjects[i];
                  console.log(`🔄 Agregando objeto faltante ${i}:`, missingObj.type, missingObj.data?.id);
                  
                  if (missingObj.type === 'text') {
                    const textObj = new fabric.Text(missingObj.text || 'Texto', {
                      left: missingObj.left || 0,
                      top: missingObj.top || 0,
                      fontSize: missingObj.fontSize || 20,
                      fontFamily: missingObj.fontFamily || 'Arial',
                      fill: missingObj.fill || '#000000',
                      data: missingObj.data || {
                        id: `recovered_text_${Date.now()}_${i}`,
                        name: `Texto recuperado ${i + 1}`,
                        type: 'text',
                        pageType: pageType,
                        elementType: 'dynamic'
                      }
                    });
                    canvas.add(textObj);
                  } else if (missingObj.type === 'image') {
                    // Para imágenes, necesitamos cargar desde src
                    if (missingObj.src) {
                      fabric.Image.fromURL(missingObj.src, (img) => {
                        img.set({
                          left: missingObj.left || 0,
                          top: missingObj.top || 0,
                          scaleX: missingObj.scaleX || 1,
                          scaleY: missingObj.scaleY || 1,
                          data: missingObj.data || {
                            id: `recovered_image_${Date.now()}_${i}`,
                            name: `Imagen recuperada ${i + 1}`,
                            type: 'image',
                            pageType: pageType,
                            elementType: 'dynamic'
                          }
                        });
                        canvas.add(img);
                        canvas.renderAll();
                        console.log(`✅ Imagen faltante ${i} recuperada`);
                      });
                    }
                  }
                }
                
                canvas.renderAll();
                console.log(`✅ RECUPERACIÓN COMPLETADA: ${missingCount} objetos recuperados`);
              } catch (recoveryError) {
                console.error('❌ Error en recuperación de objetos:', recoveryError);
              }
            }
            
            // 🚨 CRÍTICO: Forzar re-renderizado múltiple después de cargar
            canvas.renderAll();
            canvas.requestRenderAll();
            
            // 🚨 SEGUNDO RENDER EN SIGUIENTE FRAME
            requestAnimationFrame(() => {
              canvas.renderAll();
              console.log('🔄 Segundo render en requestAnimationFrame');
            });
            
            // 🚨 TERCER RENDER CON DELAY
            setTimeout(() => {
              canvas.renderAll();
              canvas.requestRenderAll();
              console.log('🔄 Tercer render con delay');
              
              // 🔍 VERIFICACIÓN FINAL: Test de serialización post-carga
              console.log('🔍 TEST SERIALIZACIÓN POST-CARGA (SWITCH):');
              // Forzar serialización correcta de propiedades 'data' antes de toJSON
              forceDataSerialization(canvas);
              const testSerializedState = canvas.toJSON(['data']);
              
              // 🔍 VERIFICACIÓN INMEDIATA: Log después de serialización forzada (post-carga)
              console.log('✅ VERIFICACIÓN POST-FORZADO (POST-CARGA):', {
                objectsWithData: testSerializedState.objects?.filter((obj: any) => obj.data).length || 0,
                totalObjects: testSerializedState.objects?.length || 0,
                firstObjectData: testSerializedState.objects?.[0]?.data
              });
              console.log('📊 SERIALIZACIÓN TEST RESULT:', {
                objectsInCanvas: canvas.getObjects().length,
                objectsInSerialized: testSerializedState.objects?.length || 0,
                firstObjectHasData: testSerializedState.objects?.[0]?.data ? 'YES' : 'NO',
                firstObjectData: testSerializedState.objects?.[0]?.data,
                serializedObjectsDetails: testSerializedState.objects?.map((obj: any, idx: number) => ({
                  index: idx,
                  type: obj.type,
                  hasData: !!obj.data,
                  dataValue: obj.data
                }))
              });
              
              // 🚨 FINALIZAR CARGA (sin auto-guardado)
              setIsLoadingState(false);
              isLoadingStateRef.current = false;
              console.log('✅ Carga completa');
            }, 50);
            
            setSelectedObject(null);
            
            // 🚨 VERIFICACIÓN POST-CARGA
            const finalLoadedObjects = canvas.getObjects();
            console.log(`✅ Página ${pageType} cargada - VERIFICACIÓN:`, {
              expectedObjects: stateToParse.objects?.length || 0,
              actualObjects: finalLoadedObjects.length,
              objectsMatch: (stateToParse.objects?.length || 0) === finalLoadedObjects.length,
              loadedObjectDetails: finalLoadedObjects.map(obj => ({
                type: obj.type,
                id: obj.data?.id,
                pageType: obj.data?.pageType,
                position: { left: obj.left, top: obj.top },
                visible: obj.visible,
                opacity: obj.opacity,
                fill: obj.fill
              })),
              expectedObjectDetails: stateToParse.objects?.map((obj: any) => ({
                type: obj.type,
                id: obj.data?.id,
                pageType: obj.data?.pageType
              })) || []
            });

            if ((stateToParse.objects?.length || 0) !== finalLoadedObjects.length) {
              console.error(`❌ MISMATCH: Esperaba ${stateToParse.objects?.length || 0} objetos, pero canvas tiene ${finalLoadedObjects.length}`);
              console.error('📊 DETALLE DEL MISMATCH:', {
                expectedState: stateToParse,
                actualObjects: finalLoadedObjects.map(obj => obj.toObject(['data']))
              });
            }
            
            // 🚨 VERIFICAR VISIBILIDAD DEL CANVAS
            const lowerCanvas = canvas.lowerCanvasEl;
            const upperCanvas = canvas.upperCanvasEl;
            console.log('🔍 VERIFICACIÓN VISIBILIDAD POST-CARGA:', {
              lowerCanvasVisible: lowerCanvas?.style.display,
              upperCanvasVisible: upperCanvas?.style.display,
              lowerCanvasOpacity: lowerCanvas?.style.opacity,
              canvasHTML: lowerCanvas?.outerHTML?.substring(0, 200)
            });
          }, reviver);
        } catch (error) {
          console.error(`❌ Error cargando página ${pageType}:`, error);
          // Fallback: limpiar canvas si hay error
          setIsLoadingState(true);
          isLoadingStateRef.current = true;
          canvas.clear();
          canvas.backgroundColor = '#ffffff';
          canvas.renderAll();
          setSelectedObject(null);
          setIsLoadingState(false);
          isLoadingStateRef.current = false;
        }
      } else {
        // Página nueva o vacía, limpiar canvas
        setIsLoadingState(true);
        isLoadingStateRef.current = true;
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
        setSelectedObject(null);
        setIsLoadingState(false);
        isLoadingStateRef.current = false;
        console.log(`🆕 Nueva página vacía: ${pageType}`);
      }
    }, 50); // 50ms delay para asegurar que el estado se actualice
  }, [canvas, currentPageType, manualObjectReconstruction, cleanDuplicatedObjects]);

  // Undo
  const undo = useCallback(() => {
    const currentUndoStack = undoStacksRef.current[currentPageType];
    if (!canvas || currentUndoStack.length === 0) return;

    setIsUndoRedoing(true);

    // Guardar estado actual en redo stack de la página actual
    // Forzar serialización correcta de propiedades 'data' antes de toJSON
    forceDataSerialization(canvas);
    const currentState = JSON.stringify(canvas.toJSON(['data']));
    
    // 🔍 VERIFICACIÓN INMEDIATA: Log después de serialización forzada (undo)
    const parsedStateVerification = JSON.parse(currentState);
    console.log('✅ VERIFICACIÓN POST-FORZADO (UNDO):', {
      objectsWithData: parsedStateVerification.objects?.filter((obj: any) => obj.data).length || 0,
      totalObjects: parsedStateVerification.objects?.length || 0,
      firstObjectData: parsedStateVerification.objects?.[0]?.data
    });
    setRedoStacks(prev => ({
      ...prev,
      [currentPageType]: [...prev[currentPageType], currentState]
    }));

    // Restaurar estado anterior de la página actual
    const previousState = currentUndoStack[currentUndoStack.length - 1];
    setUndoStacks(prev => ({
      ...prev,
      [currentPageType]: prev[currentPageType].slice(0, -1)
    }));

    // 🚨 FIX CRÍTICO: Limpiar canvas antes de UNDO para evitar acumulación
    console.log(`🧹 UNDO - LIMPIANDO canvas:`, {
      objectsBeforeClear: canvas.getObjects().length,
      undoingForPage: currentPageType
    });
    
    canvas.clear();
    
    // 🚨 FIX DEFINITIVO UNDO: En Fabric.js v6, usar reviver function para preservar 'data'
    const undoReviver = (o: any, object: any) => {
      if (!object || !o) return object;
      
      if (o.data && typeof o.data === 'object') {
        object.data = JSON.parse(JSON.stringify(o.data));
        console.log('✅ UNDO REVIVER: Propiedades data restauradas para objeto:', o.data.name || o.data.id, o.data);
      } else if (o.data) {
        object.data = o.data;
        console.log('✅ UNDO REVIVER: Propiedades data simples restauradas:', o.data);
      }
      
      return object;
    };

    canvas.loadFromJSON(previousState, undoReviver).then(() => {
      // 🧹 LIMPIEZA POST-UNDO: Eliminar duplicados
      cleanDuplicatedObjects(canvas);
      
      // 🚨 FIX CRÍTICO: Aplicar ensureDataProperty a TODOS los objetos post-undo
      const loadedObjects = canvas.getObjects();
      loadedObjects.forEach((obj, index) => {
        if (obj.data) {
          ensureDataProperty(obj, obj.data);
          console.log('🔧 toObject override aplicado post-undo:', obj.data.name || obj.data.id);
        }
      });
      
      // 🚨 FIX CRÍTICO UNDO: Verificar que las propiedades data se preservaron
      const parsedState = JSON.parse(previousState);
      const expectedObjects = parsedState.objects || [];
      
      // 🚨 VERIFICAR FALLO EN UNDO
      if (expectedObjects.length !== loadedObjects.length) {
        console.log('🔄 UNDO FALLBACK: Usando reconstrucción manual...');
        manualObjectReconstruction(canvas, expectedObjects, currentPageType);
        setIsLoadingState(false);
        isLoadingStateRef.current = false;
        return;
      }
      
      loadedObjects.forEach((loadedObj, index) => {
        const expectedData = expectedObjects[index]?.data;
        if (expectedData) {
          loadedObj.data = {
            ...expectedData,
            pageType: currentPageType,
            restoredFromUndo: true
          };
        }
      });
      
      canvas.renderAll();
      setIsUndoRedoing(false);
      
      // Limpiar selección después del undo
      setSelectedObject(null);
      
      console.log(`↶ Undo ejecutado en página: ${currentPageType}`);
    }, undoReviver);
  }, [canvas, currentPageType, manualObjectReconstruction, cleanDuplicatedObjects]);

  // Redo
  const redo = useCallback(() => {
    const currentRedoStack = redoStacksRef.current[currentPageType];
    if (!canvas || currentRedoStack.length === 0) return;

    setIsUndoRedoing(true);

    // Guardar estado actual en undo stack de la página actual
    // Forzar serialización correcta de propiedades 'data' antes de toJSON
    forceDataSerialization(canvas);
    const currentState = JSON.stringify(canvas.toJSON(['data']));
    
    // 🔍 VERIFICACIÓN INMEDIATA: Log después de serialización forzada (redo)
    const parsedStateVerification = JSON.parse(currentState);
    console.log('✅ VERIFICACIÓN POST-FORZADO (REDO):', {
      objectsWithData: parsedStateVerification.objects?.filter((obj: any) => obj.data).length || 0,
      totalObjects: parsedStateVerification.objects?.length || 0,
      firstObjectData: parsedStateVerification.objects?.[0]?.data
    });
    setUndoStacks(prev => ({
      ...prev,
      [currentPageType]: [...prev[currentPageType], currentState]
    }));

    // Restaurar siguiente estado de la página actual
    const nextState = currentRedoStack[currentRedoStack.length - 1];
    setRedoStacks(prev => ({
      ...prev,
      [currentPageType]: prev[currentPageType].slice(0, -1)
    }));

    // 🚨 FIX CRÍTICO: Limpiar canvas antes de REDO para evitar acumulación
    console.log(`🧹 REDO - LIMPIANDO canvas:`, {
      objectsBeforeClear: canvas.getObjects().length,
      redoingForPage: currentPageType
    });
    
    canvas.clear();
    
    // 🚨 FIX DEFINITIVO REDO: En Fabric.js v6, usar reviver function para preservar 'data'
    const redoReviver = (o: any, object: any) => {
      if (!object || !o) return object;
      
      if (o.data && typeof o.data === 'object') {
        object.data = JSON.parse(JSON.stringify(o.data));
        console.log('✅ REDO REVIVER: Propiedades data restauradas para objeto:', o.data.name || o.data.id, o.data);
      } else if (o.data) {
        object.data = o.data;
        console.log('✅ REDO REVIVER: Propiedades data simples restauradas:', o.data);
      }
      
      return object;
    };

    canvas.loadFromJSON(nextState, redoReviver).then(() => {
      // 🧹 LIMPIEZA POST-REDO: Eliminar duplicados
      cleanDuplicatedObjects(canvas);
      
      // 🚨 FIX CRÍTICO: Aplicar ensureDataProperty a TODOS los objetos post-redo
      const loadedObjects = canvas.getObjects();
      loadedObjects.forEach((obj, index) => {
        if (obj.data) {
          ensureDataProperty(obj, obj.data);
          console.log('🔧 toObject override aplicado post-redo:', obj.data.name || obj.data.id);
        }
      });
      
      // 🚨 FIX CRÍTICO REDO: Verificar que las propiedades data se preservaron
      const parsedState = JSON.parse(nextState);
      const expectedObjects = parsedState.objects || [];
      
      // 🚨 VERIFICAR FALLO EN REDO
      if (expectedObjects.length !== loadedObjects.length) {
        console.log('🔄 REDO FALLBACK: Usando reconstrucción manual...');
        manualObjectReconstruction(canvas, expectedObjects, currentPageType);
        setIsLoadingState(false);
        isLoadingStateRef.current = false;
        return;
      }
      
      loadedObjects.forEach((loadedObj, index) => {
        const expectedData = expectedObjects[index]?.data;
        if (expectedData) {
          loadedObj.data = {
            ...expectedData,
            pageType: currentPageType,
            restoredFromRedo: true
          };
        }
      });
      
      canvas.renderAll();
      setIsUndoRedoing(false);
      
      // Limpiar selección después del redo
      setSelectedObject(null);
      
      console.log(`↷ Redo ejecutado en página: ${currentPageType}`);
    }, redoReviver);
  }, [canvas, currentPageType, manualObjectReconstruction, cleanDuplicatedObjects]);

  // 🚨 FUNCIÓN REFACTORIZADA: Cargar template desde BD con migración automática a v3.0
  const loadFromDatabase = useCallback(async () => {
    if (!canvas) {
      console.warn('⚠️ Canvas no disponible para cargar desde BD');
      return;
    }

    setIsLoadingTemplate(true);
    
    try {
      console.log('🔄 Cargando template activo desde BD...');
      addDebugLog('Iniciando carga de template desde BD');
      const template = await styleConfigService.getActiveTemplate();
      
      if (!template) {
        console.log('ℹ️ No hay template activo en BD');
        addDebugLog('No hay template activo en BD');
        setIsLoadingTemplate(false);
        return;
      }

      // 🆕 Capturar template completo para debug
      setTemplateFromDB(template);
      addDebugLog(`Template cargado: ${template.name} (${template.id})`);

      console.log('📋 Template cargado desde BD:', {
        id: template.id,
        name: template.name,
        version: template.configData?.version,
        editorType: template.configData?.editorType,
        hasPageStates: !!template.configData?.pageStates,
        hasCanvasState: !!template.configData?.canvasState
      });

      // Verificar si es un template de Fabric.js
      if (template.configData?.editorType === 'fabric') {
        console.log('✅ Template de Fabric.js detectado');
        addDebugLog('Template de Fabric.js detectado');
        
        try {
          // 🚨 DETECCIÓN INTELIGENTE: Manejar v3.0 nativo o migrar v2.1
          let v3Config;
          if (template.configData.version === '3.0') {
            console.log('✅ Template v3.0 nativo detectado - usando directamente');
            v3Config = template.configData;
            addDebugLog('Template v3.0 nativo - sin migración necesaria');
          } else {
            console.log('🔄 Template v2.1 detectado - migrando a v3.0');
            v3Config = ConfigDataMigrator.migrateToV3(template.configData);
            addDebugLog('Template v2.1 migrado a v3.0');
          }
          
          console.log('✅ Configuración v3.0 lista:', {
            fromVersion: template.configData.version,
            toVersion: v3Config.version,
            pagesCount: Object.keys(v3Config.pages).length,
            pagesWithContent: Object.entries(v3Config.pages).filter(([_, page]) => page.elements.length > 0).length,
            nativev3: template.configData.version === '3.0'
          });
          
          // Extraer pageStates desde v3.0 para compatibilidad con sistema actual
          const migratedPageStates: Record<PageType, string> = {
            cover: v3Config.pages.cover?.canvasState || '',
            page: v3Config.pages.page?.canvasState || '',
            dedicatoria: v3Config.pages.dedicatoria?.canvasState || ''
          };

          const pageStatesInfo = Object.keys(migratedPageStates).map(page => ({
            page,
            hasState: !!migratedPageStates[page as PageType],
            objectCount: migratedPageStates[page as PageType] ? 
              JSON.parse(migratedPageStates[page as PageType]).objects?.length || 0 : 0,
            elementsFromV3: v3Config.pages[page as PageType]?.elements.length || 0
          }));
          
          console.log('📄 Estados de páginas migrados:', pageStatesInfo);
          addDebugLog(`Estados migrados: ${pageStatesInfo.map(p => `${p.page}(${p.objectCount}obj/${p.elementsFromV3}elem)`).join(', ')}`);
          
          setPageStates(migratedPageStates);
          pageStatesRef.current = migratedPageStates;
          
          // Cargar la página actual
          const currentPageState = migratedPageStates[currentPageType];
          if (currentPageState && currentPageState.length > 50) {
            console.log(`🔄 Cargando página ${currentPageType} desde BD migrada...`);
            addDebugLog(`Cargando página ${currentPageType} (${currentPageState.length} chars)`);
            
            setIsLoadingState(true);
            isLoadingStateRef.current = true;
            
            // 🚨 FIX CRÍTICO: Limpiar canvas antes de cargar desde BD para evitar acumulación
            console.log(`🧹 BD - LIMPIANDO canvas antes de cargar:`, {
              objectsBeforeClear: canvas.getObjects().length,
              loadingPage: currentPageType
            });
            
            canvas.clear();
            
            // 🚨 FIX DEFINITIVO BD: En Fabric.js v6, usar reviver function para preservar 'data'
            const bdReviver = (o: any, object: any) => {
              if (!object || !o) return object;
              
              if (o.data && typeof o.data === 'object') {
                object.data = JSON.parse(JSON.stringify(o.data));
                console.log('✅ BD REVIVER: Propiedades data restauradas para objeto:', o.data.name || o.data.id, o.data);
              } else if (o.data) {
                object.data = o.data;
                console.log('✅ BD REVIVER: Propiedades data simples restauradas:', o.data);
              }
              
              return object;
            };

            canvas.loadFromJSON(currentPageState, bdReviver).then(() => {
              // 🧹 LIMPIEZA POST-BD: Eliminar duplicados
              cleanDuplicatedObjects(canvas);
              
              // 🚨 FIX CRÍTICO: Aplicar ensureDataProperty a TODOS los objetos post-BD
              const loadedObjects = canvas.getObjects();
              loadedObjects.forEach((obj, index) => {
                if (obj.data) {
                  ensureDataProperty(obj, obj.data);
                  console.log('🔧 toObject override aplicado post-BD:', obj.data.name || obj.data.id);
                }
              });
              
              // 🚨 FIX CRÍTICO BD: Verificar que las propiedades data se preservaron
              const parsedState = JSON.parse(currentPageState);
              const expectedObjects = parsedState.objects || [];
              
              // 🚨 VERIFICAR FALLO EN BD
              if (expectedObjects.length !== loadedObjects.length) {
                console.log('🔄 BD FALLBACK: Usando reconstrucción manual...');
                manualObjectReconstruction(canvas, expectedObjects, currentPageType);
                setIsLoadingState(false);
                isLoadingStateRef.current = false;
                return;
              }
              
              console.log('🔧 BD - INICIANDO PRESERVACIÓN DE METADATOS:', {
                expectedObjects: expectedObjects.length,
                loadedObjects: loadedObjects.length,
                pageType: currentPageType
              });
              
              let correctionsMade = 0;
              
              // ESTRATEGIA: Mapear objetos cargados con datos originales por orden
              loadedObjects.forEach((loadedObj, index) => {
                const expectedData = expectedObjects[index]?.data;
                
                if (expectedData) {
                  // ✅ PRESERVAR datos originales del JSON
                  loadedObj.data = {
                    ...expectedData,
                    pageType: currentPageType, // Asegurar pageType correcto
                    restoredFromBD: true // Flag para debugging
                  };
                  
                  console.log(`✅ BD PRESERVADO: ${loadedObj.type} → ${loadedObj.data.name} (id: ${loadedObj.data.id})`);
                  correctionsMade++;
                } else if (!loadedObj.data) {
                  // Fallback si no hay data esperada
                  console.log(`🔧 BD POST-CARGA: Agregando data faltante a objeto ${loadedObj.type} índice ${index}`);
                  loadedObj.data = {
                    id: `${loadedObj.type}_bd_${Date.now()}_${index}`,
                    name: `${loadedObj.type === 'image' ? 'Imagen' : 'Texto'} ${index + 1}`,
                    type: loadedObj.type || 'unknown',
                    createdAt: Date.now(),
                    pageType: currentPageType,
                    elementType: 'dynamic',
                    migratedFromBD: true
                  };
                  correctionsMade++;
                } else {
                  // Solo verificar propiedades faltantes sin sobrescribir
                  let objectFixed = false;
                  if (!loadedObj.data.pageType) {
                    loadedObj.data.pageType = currentPageType;
                    objectFixed = true;
                  }
                  if (!loadedObj.data.elementType) {
                    loadedObj.data.elementType = 'dynamic';
                    objectFixed = true;
                  }
                  if (!loadedObj.data.name) {
                    loadedObj.data.name = `${loadedObj.type === 'image' ? 'Imagen' : 'Texto'} ${index + 1}`;
                    objectFixed = true;
                  }
                  if (objectFixed) {
                    console.log(`🔧 BD POST-CARGA: Propiedades corregidas en ${loadedObj.data.id}`);
                    correctionsMade++;
                  }
                }
              });
              
              if (correctionsMade > 0) {
                console.log(`✅ BD POST-CARGA: ${correctionsMade} objetos corregidos`);
              }
              
              canvas.renderAll();
              canvas.requestRenderAll();
              
              // Renders adicionales para asegurar visibilidad
              requestAnimationFrame(() => {
                canvas.renderAll();
                console.log('🟢 Página cargada desde BD - render final');
              });
              
              setIsLoadingState(false);
              isLoadingStateRef.current = false;
              
              console.log('✅ Página cargada desde BD v3.0:', {
                pageType: currentPageType,
                objectCount: canvas.getObjects().length,
                objects: canvas.getObjects().map(obj => ({
                  type: obj.type,
                  id: obj.data?.id,
                  pageType: obj.data?.pageType
                })),
                migratedFrom: template.configData.version
              });
            }, bdReviver);
          } else {
            console.log(`ℹ️ Página ${currentPageType} vacía en BD migrada`);
          }
          
        } catch (migrationError) {
          console.error('❌ Error migrando configuración:', migrationError);
          addDebugLog(`Error migración: ${migrationError.message}`);
          
          // Fallback al método anterior si la migración falla
          if (template.configData.pageStates) {
            console.log('🔄 Fallback: usando pageStates originales...');
            const originalPageStates = template.configData.pageStates;
            setPageStates(originalPageStates);
            pageStatesRef.current = originalPageStates;
            
            const currentPageState = originalPageStates[currentPageType];
            if (currentPageState && currentPageState.length > 50) {
              setIsLoadingState(true);
              isLoadingStateRef.current = true;
              
              // 🚨 FIX CRÍTICO: Limpiar canvas antes de FALLBACK para evitar acumulación
              console.log(`🧹 FALLBACK - LIMPIANDO canvas:`, {
                objectsBeforeClear: canvas.getObjects().length,
                fallbackPage: currentPageType
              });
              
              canvas.clear();
              
              // 🚨 FIX DEFINITIVO FALLBACK: En Fabric.js v6, usar reviver function para preservar 'data'
              const fallbackReviver = (o: any, object: any) => {
                if (!object || !o) return object;
                
                if (o.data && typeof o.data === 'object') {
                  object.data = JSON.parse(JSON.stringify(o.data));
                  console.log('✅ FALLBACK REVIVER: Propiedades data restauradas para objeto:', o.data.name || o.data.id, o.data);
                } else if (o.data) {
                  object.data = o.data;
                  console.log('✅ FALLBACK REVIVER: Propiedades data simples restauradas:', o.data);
                }
                
                return object;
              };

              canvas.loadFromJSON(currentPageState, fallbackReviver).then(() => {
                // 🧹 LIMPIEZA POST-FALLBACK: Eliminar duplicados
                cleanDuplicatedObjects(canvas);
                
                // 🚨 FIX CRÍTICO: Aplicar ensureDataProperty a TODOS los objetos post-fallback
                const loadedObjects = canvas.getObjects();
                loadedObjects.forEach((obj, index) => {
                  if (obj.data) {
                    ensureDataProperty(obj, obj.data);
                    console.log('🔧 toObject override aplicado post-fallback:', obj.data.name || obj.data.id);
                  }
                });
                
                // 🚨 FIX CRÍTICO FALLBACK: Verificar que las propiedades data se preservaron
                const parsedState = JSON.parse(currentPageState);
                const expectedObjects = parsedState.objects || [];
                
                // 🚨 VERIFICAR FALLO EN FALLBACK
                if (expectedObjects.length !== loadedObjects.length) {
                  console.log('🔄 FALLBACK RECURSIVO: Usando reconstrucción manual...');
                  manualObjectReconstruction(canvas, expectedObjects, currentPageType);
                  setIsLoadingState(false);
                  isLoadingStateRef.current = false;
                  return;
                }
                
                loadedObjects.forEach((loadedObj, index) => {
                  const expectedData = expectedObjects[index]?.data;
                  if (expectedData) {
                    loadedObj.data = {
                      ...expectedData,
                      pageType: currentPageType,
                      restoredFromFallback: true
                    };
                  }
                });
                
                canvas.renderAll();
                canvas.requestRenderAll();
                setIsLoadingState(false);
                isLoadingStateRef.current = false;
                console.log('✅ Fallback: página cargada desde pageStates originales');
              }, fallbackReviver);
            }
          }
        }
      } else {
        console.log('ℹ️ Template no es de Fabric.js, iniciando canvas vacío');
      }
      
    } catch (error) {
      console.error('❌ Error cargando template desde BD:', error);
      addDebugLog(`Error carga BD: ${error.message}`);
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [canvas, currentPageType, addDebugLog, manualObjectReconstruction, cleanDuplicatedObjects]);

  // 🚨 CARGA AUTOMÁTICA: Cargar desde BD SOLO UNA VEZ cuando el canvas esté listo
  const hasLoadedInitialData = useRef(false);
  useEffect(() => {
    if (isInitialized && canvas && !hasLoadedInitialData.current) {
      console.log('🔄 Canvas inicializado, cargando automáticamente desde BD (primera vez)...');
      hasLoadedInitialData.current = true;
      loadFromDatabase();
    }
  }, [isInitialized, canvas, loadFromDatabase]);

  return {
    canvas,
    isInitialized,
    selectedObject,
    currentPageType,
    pageStates, // 🚨 NUEVO: Exponer para debug
    isLoadingTemplate, // 🚨 NUEVO: Estado de carga desde BD
    templateFromDB, // 🆕 Template completo desde BD para debug
    debugLogs, // 🆕 Logs capturados para debug
    addText,
    addImage,
    addImageFromFile, // 🚨 NUEVO: Agregar imagen desde archivo usando Storage
    addImageFromBase64, // 🚨 NUEVO: Agregar imagen desde base64 usando Storage
    removeObject,
    clearCanvas,
    resetAllPages, // 🚨 NUEVO: Reset completo
    switchPageType,
    loadFromDatabase, // 🚨 NUEVO: Cargar desde BD
    canUndo: undoStacks[currentPageType]?.length > 0,
    canRedo: redoStacks[currentPageType]?.length > 0,
    undo,
    redo
  };
};