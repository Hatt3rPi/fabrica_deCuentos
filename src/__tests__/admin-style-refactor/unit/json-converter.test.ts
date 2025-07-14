import { describe, test, expect, vi, beforeEach } from 'vitest';
import { 
  convertLegacyToUnified, 
  separateStyleCategories, 
  extractPositioning,
  isTypographyProperty,
  isContainerProperty,
  isPositioningProperty,
  determineGridRegion
} from '../../../utils/styleConfigMigrator';
import { mockLegacyConfig } from '../setup/mock-data';

// ESTOS TESTS DEBEN FALLAR INICIALMENTE - FASE RED DEL TDD

describe('Unified JSON Structure - TDD RED Phase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should convert legacy JSON to unified structure', () => {
    const componentWithMixedStyles = {
      "x": 115, "y": 40,
      "position": "top",
      "horizontalPosition": "center",
      "style": {
        "fontSize": "4rem",
        "fontFamily": "Ribeye", 
        "fontWeight": "700",
        "color": "#ffffff",
        "padding": "2rem 3rem",
        "backgroundColor": "rgba(0,0,0,0.1)",
        "backdropFilter": "blur(3px)",
        "borderRadius": "2rem"
      },
      "containerStyle": {
        "verticalAlignment": "center",
        "horizontalAlignment": "center",
        "maxWidth": "85%"
      }
    };

    // Esperamos que la conversión separe los tokens correctamente
    const result = separateStyleCategories(componentWithMixedStyles.style);
    
    expect(result.typography.fontFamily).toBe("Ribeye");
    expect(result.container.backgroundColor).toBe("rgba(0,0,0,0.1)");
    expect(result.typography.fontSize).toBe("4rem");
  });

  test('debe convertir configuración legacy completa a JSON unificado', () => {
    const result = convertLegacyToUnified(mockLegacyConfig);
    
    expect(result.version).toBe("2.0");
    expect(result.designTokens).toBeDefined();
    expect(result.pageTypes).toBeDefined();
  });
});

describe('Test auxiliar - estructura esperada', () => {
  test('referencia para verificar estructura de datos', () => {
    // Estructura de referencia para verificación manual  
    const expected = {
      "designTokens": {
        "typography": { 
          "fontFamily": "Ribeye",
          "fontSize": "4rem", 
          "fontWeight": "700",
          "color": "#ffffff"
        },
        "containers": { 
          "backgroundColor": "rgba(0,0,0,0.1)",
          "backdropFilter": "blur(3px)",
          "borderRadius": "2rem",
          "padding": "2rem 3rem" 
        },
        "positioning": { 
          "region": "top-center", 
          "offset": { "x": 0, "y": 40 },
          "constraints": { "maxWidth": "85%" }
        }
      }
    };

    // Verificamos que la estructura esperada es válida
    expect(expected.designTokens).toBeDefined();
    expect(expected.designTokens.typography).toBeDefined();
    expect(expected.designTokens.containers).toBeDefined();
    expect(expected.designTokens.positioning).toBeDefined();
  });

  test('should eliminate positioning duplication between 4 systems', () => {
    const component = {
      "x": 115, "y": 40,                    // Sistema 1: coordenadas absolutas
      "position": "top",                     // Sistema 2: position enum
      "horizontalPosition": "center",        // Sistema 3: horizontal position
      "containerStyle": {                    // Sistema 4: container alignment
        "verticalAlignment": "center",
        "horizontalAlignment": "center",
        "maxWidth": "85%"
      }
    };

    const result = extractPositioning(component);
    
    // Debe consolidar en UN SOLO sistema unificado
    expect(result).toEqual({
      "region": "top-center",
      "offset": { "x": 0, "y": 40 },
      "constraints": { "maxWidth": "85%" }
    });
    
    // NO debe mantener propiedades duplicadas
    expect(result).not.toHaveProperty('x');
    expect(result).not.toHaveProperty('position');
    expect(result).not.toHaveProperty('horizontalPosition');
    expect(result).not.toHaveProperty('containerStyle');
  });

  test('should separate typography, container and positioning styles correctly', () => {
    const mixedStyles = {
      "fontSize": "4rem",           // typography
      "fontFamily": "Ribeye",       // typography
      "color": "#ffffff",           // typography
      "textAlign": "center",        // typography
      "padding": "2rem 3rem",       // container
      "backgroundColor": "rgba(0,0,0,0.1)", // container
      "backdropFilter": "blur(3px)", // container
      "borderRadius": "2rem",       // container
      "maxWidth": "85%",            // positioning
      "position": "absolute",       // positioning
      "top": "40px"                 // positioning
    };

    const result = separateStyleCategories(mixedStyles);
    
    expect(result.typography).toEqual({
      "fontSize": "4rem",
      "fontFamily": "Ribeye", 
      "color": "#ffffff",
      "textAlign": "center"
    });
    
    expect(result.container).toEqual({
      "padding": "2rem 3rem", 
      "backgroundColor": "rgba(0,0,0,0.1)",
      "backdropFilter": "blur(3px)",
      "borderRadius": "2rem"
    });
    
    expect(result.positioning).toEqual({
      "maxWidth": "85%",
      "position": "absolute",
      "top": "40px"
    });
  });

  test('should identify typography properties correctly', () => {
    // Typography properties
    expect(isTypographyProperty('fontSize')).toBe(true);
    expect(isTypographyProperty('fontFamily')).toBe(true);
    expect(isTypographyProperty('color')).toBe(true);
    expect(isTypographyProperty('textAlign')).toBe(true);
    expect(isTypographyProperty('fontWeight')).toBe(true);
    expect(isTypographyProperty('lineHeight')).toBe(true);
    expect(isTypographyProperty('textShadow')).toBe(true);
    
    // NOT typography
    expect(isTypographyProperty('padding')).toBe(false);
    expect(isTypographyProperty('backgroundColor')).toBe(false);
    expect(isTypographyProperty('maxWidth')).toBe(false);
  });

  test('should identify container properties correctly', () => {
    // Container properties
    expect(isContainerProperty('padding')).toBe(true);
    expect(isContainerProperty('backgroundColor')).toBe(true);
    expect(isContainerProperty('backdropFilter')).toBe(true);
    expect(isContainerProperty('borderRadius')).toBe(true);
    expect(isContainerProperty('boxShadow')).toBe(true);
    expect(isContainerProperty('border')).toBe(true);
    
    // NOT container
    expect(isContainerProperty('fontSize')).toBe(false);
    expect(isContainerProperty('maxWidth')).toBe(false);
    expect(isContainerProperty('position')).toBe(false);
  });

  test('should identify positioning properties correctly', () => {
    // Positioning properties
    expect(isPositioningProperty('maxWidth')).toBe(true);
    expect(isPositioningProperty('minHeight')).toBe(true);
    expect(isPositioningProperty('width')).toBe(true);
    expect(isPositioningProperty('height')).toBe(true);
    expect(isPositioningProperty('position')).toBe(true);
    expect(isPositioningProperty('top')).toBe(true);
    expect(isPositioningProperty('left')).toBe(true);
    
    // NOT positioning
    expect(isPositioningProperty('fontSize')).toBe(false);
    expect(isPositioningProperty('padding')).toBe(false);
    expect(isPositioningProperty('color')).toBe(false);
  });

  test('should determine grid region from legacy positioning systems', () => {
    // Test todas las combinaciones del grid 3x3
    expect(determineGridRegion('top', 'left')).toBe('top-left');
    expect(determineGridRegion('top', 'center')).toBe('top-center');
    expect(determineGridRegion('top', 'right')).toBe('top-right');
    
    expect(determineGridRegion('center', 'left')).toBe('center-left');
    expect(determineGridRegion('center', 'center')).toBe('center-center');
    expect(determineGridRegion('center', 'right')).toBe('center-right');
    
    expect(determineGridRegion('bottom', 'left')).toBe('bottom-left');
    expect(determineGridRegion('bottom', 'center')).toBe('bottom-center');
    expect(determineGridRegion('bottom', 'right')).toBe('bottom-right');
  });

  test('should handle containerStyle alignment in grid determination', () => {
    // containerStyle debe también influir en grid region
    expect(determineGridRegion(
      'top', 'center', 
      'center', 'center'  // containerStyle alignment
    )).toBe('top-center');
    
    expect(determineGridRegion(
      'center', 'left',
      'bottom', 'right'   // containerStyle debe override position
    )).toBe('bottom-right');
  });

  test('should convert complete legacy config to unified structure', () => {
    const result = convertLegacyToUnified(mockLegacyConfig);
    
    expect(result).toHaveProperty('version', '2.0');
    expect(result).toHaveProperty('designTokens');
    expect(result).toHaveProperty('pageTypes');
    
    // Verificar structure de designTokens
    expect(result.designTokens).toHaveProperty('typography');
    expect(result.designTokens).toHaveProperty('containers');
    expect(result.designTokens).toHaveProperty('positioning');
    
    // Verificar que pageTypes se mantienen pero components usan referencias
    expect(result.pageTypes.cover.components[0]).toHaveProperty('typography');
    expect(result.pageTypes.cover.components[0]).toHaveProperty('container');
    expect(result.pageTypes.cover.components[0]).toHaveProperty('positioning');
    
    // NO debe tener propiedades legacy
    expect(result.pageTypes.cover.components[0]).not.toHaveProperty('style');
    expect(result.pageTypes.cover.components[0]).not.toHaveProperty('x');
    expect(result.pageTypes.cover.components[0]).not.toHaveProperty('position');
  });

  test('should preserve content and type during conversion', () => {
    const legacyComponent = {
      id: 'test-component',
      type: 'text',
      content: '{storyTitle}',
      style: { fontSize: '2rem' }
    };

    const result = convertLegacyToUnified({ cover: { components: [legacyComponent] } });
    const convertedComponent = result.pageTypes.cover.components[0];
    
    expect(convertedComponent.id).toBe('test-component');
    expect(convertedComponent.type).toBe('text');
    expect(convertedComponent.content).toBe('{storyTitle}');
  });

  test('should handle missing or undefined style properties gracefully', () => {
    const incompleteComponent = {
      id: 'incomplete',
      type: 'text'
      // Sin style, position, etc.
    };

    const result = convertLegacyToUnified({ 
      cover: { components: [incompleteComponent] } 
    });
    
    // No debe fallar, debe usar defaults
    expect(result.pageTypes.cover.components[0]).toBeDefined();
    expect(result.designTokens.typography).toBeDefined();
    expect(result.designTokens.containers).toBeDefined();
    expect(result.designTokens.positioning).toBeDefined();
  });
});