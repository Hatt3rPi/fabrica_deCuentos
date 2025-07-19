import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Test 1: Agregar imports sospechosos uno por uno
import { useStyleAdapter, SelectionTarget } from '../../../hooks/useStyleAdapter';
// Test 2: useGranularUpdate (podría ser el problema)
import { useGranularUpdate } from '../../../hooks/useGranularUpdate';
// Test 3: TemplateComponent (muy sospechoso)
import TemplateComponent from '../../../components/unified/TemplateComponent';
// Test 4: scaleUtils.ts (archivo que creé)
import { scaleStyleObject } from '../../../utils/scaleUtils';
// Test 5: Agregar los imports críticos del AdminStyleEditor original
import { StoryStyleConfig, StyleTemplate, ComponentConfig, PageType } from '../../../types/styleConfig';
// Test 8: Importar más dependencias del AdminStyleEditor real
import { useNotifications } from '../../../hooks/useNotifications';
import { styleConfigService } from '../../../services/styleConfigService';
import { useDualSystemSync } from '../../../hooks/useDualSystemSync';
// Test 9: Importar componentes UI que podrían estar causando el problema
// import StylePreview from './components/StylePreview'; // ESTE ES EL PROBLEMA
import ComponentsPanel from './components/ComponentsPanel';
// Test 10: Probar si TemplateRenderer es la causa subyacente
import TemplateRenderer from '../../../components/unified/TemplateRenderer';
// Test 11: Probar imports individuales de StylePreview
import { StoryRenderer } from '../../../components/StoryRenderer';
import ComponentRenderer from './components/ComponentRenderer';
// Test 12: Probar UnifiedRenderOptions 
import { UnifiedRenderOptions } from '../../../types/unifiedTemplate';
// Test 13: Probar StylePreview simplificado
import StylePreviewSimple from './components/StylePreviewSimple';

const AdminStyleEditorTest: React.FC = () => {
  // Test 6: Agregar useState básico
  const [activeConfig, setActiveConfig] = useState<StoryStyleConfig | null>(null);
  const [currentPageType, setCurrentPageType] = useState<'cover' | 'page' | 'dedicatoria'>('cover');
  const [selectedTarget, setSelectedTarget] = useState<SelectionTarget>({ type: 'page' });
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [allComponents, setAllComponents] = useState<ComponentConfig[]>([]);

  // Test 7: Usar useStyleAdapter real
  const handleConfigChange = useCallback(() => {}, []);
  const handleComponentChange = useCallback(() => {}, []);
  
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

  // Test 8: Agregar useNotifications y useEffect del AdminStyleEditor original
  const { createNotification } = useNotifications();

  // Test 9: Agregar loadActiveTemplate y loadSampleImages del original
  const loadActiveTemplate = useCallback(async () => {
    try {
      console.log('Test: loadActiveTemplate ejecutándose');
    } catch (error) {
      console.error('Error en loadActiveTemplate:', error);
    }
  }, []);

  const loadSampleImages = useCallback(async () => {
    try {
      console.log('Test: loadSampleImages ejecutándose');
    } catch (error) {
      console.error('Error en loadSampleImages:', error);
    }
  }, []);

  // useEffect del AdminStyleEditor original
  useEffect(() => {
    loadActiveTemplate();
    loadSampleImages();
  }, [loadActiveTemplate, loadSampleImages]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Style Editor - Test Version</h1>
      <p>🎯 PROBLEMA IDENTIFICADO: StylePreview causa el error</p>
      <p>Test 9: StylePreview comentado - debería funcionar ahora ✓</p>
      <p>Current page type: {currentPageType}</p>
      
      <div style={{ marginTop: '20px', border: '1px solid #red', padding: '10px', backgroundColor: '#ffe6e6' }}>
        <h3>🔍 Diagnóstico:</h3>
        <p><strong>CAUSA DEL PROBLEMA:</strong> StylePreview component</p>
        <p><strong>ARCHIVO PROBLEMÁTICO:</strong> ./components/StylePreview.tsx</p>
        <p><strong>Test 10:</strong> TemplateRenderer importado ✓</p>
        <p><strong>Test 11:</strong> StoryRenderer y ComponentRenderer importados ✓</p>
        <p><strong>Test 12:</strong> UnifiedRenderOptions importado ✓</p>
        <p><strong>CONCLUSIÓN:</strong> El problema NO está en los imports de StylePreview</p>
      </div>
      
      {/* Test 13: Renderizar StylePreview simplificado */}
      <div style={{ marginTop: '20px', border: '1px solid blue' }}>
        <StylePreviewSimple
          config={activeConfig}
          pageType={currentPageType as any}
          sampleImage=""
          sampleText="Texto de prueba"
          showGrid={false}
          showRulers={false}
          zoomLevel={100}
        />
      </div>
    </div>
  );
};

export default AdminStyleEditorTest;