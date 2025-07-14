import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminStyleEditor } from '../../../pages/Admin/StyleEditor/AdminStyleEditor';
import { StoryRenderer } from '../../../components/StoryRenderer/UnifiedStoryRenderer';
import { 
  migrateToUnifiedSystem,
  loadCurrentStyleConfig,
  validateMigrationCompatibility
} from '../../../utils/styleConfigMigrator';
import { mockLegacyConfig, mockUnifiedConfig } from '../setup/test-utils';

// ESTOS TESTS DEBEN FALLAR INICIALMENTE - FASE RED DEL TDD

describe('Migration Without Interruption - TDD RED Phase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should maintain existing functionality during migration', async () => {
    // Cargar configuración legacy actual
    const legacyConfig = await loadCurrentStyleConfig();
    
    // Convertir a nuevo sistema
    const unifiedConfig = migrateToUnifiedSystem(legacyConfig);
    
    // Renderizar con sistema legacy (componente actual)
    const { container: legacyContainer } = render(
      <div data-testid="legacy-preview">
        {/* Aquí iría el componente legacy actual */}
        <div data-testid="cover-title" style={{ fontSize: '4rem', color: '#ffffff' }}>
          {mockLegacyConfig.cover.components[0].content}
        </div>
      </div>
    );
    
    // Renderizar con nuevo sistema
    const { container: newContainer } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="admin-edit"
        storyData={{ title: "Test Story" }}
      />
    );
    
    // Los resultados visuales deben ser idénticos
    const legacyTitle = legacyContainer.querySelector('[data-testid="cover-title"]');
    const newTitle = newContainer.querySelector('[data-testid="cover-title"]');
    
    expect(legacyTitle).toHaveStyle({ fontSize: '4rem' });
    expect(newTitle).toHaveStyle({ fontSize: '4rem' });
    expect(legacyTitle?.textContent).toBe(newTitle?.textContent);
  });

  test('should preserve all current admin panel capabilities', async () => {
    const user = userEvent.setup();
    
    // Test completo de workflow existente
    render(<AdminStyleEditor />);
    
    // 1. Debe cargar la interfaz sin errores
    expect(screen.getByTestId('admin-style-editor')).toBeInTheDocument();
    expect(screen.getByTestId('style-preview')).toBeInTheDocument();
    
    // 2. Debe mostrar paneles de edición
    expect(screen.getByTestId('components-panel')).toBeInTheDocument();
    expect(screen.getByTestId('typography-panel')).toBeInTheDocument();
    expect(screen.getByTestId('container-panel')).toBeInTheDocument();
    expect(screen.getByTestId('position-panel')).toBeInTheDocument();
    
    // 3. Seleccionar componente debe funcionar
    const coverTitle = screen.getByTestId('cover-title');
    await user.click(coverTitle);
    expect(coverTitle).toHaveClass('selected');
    
    // 4. Cambiar tipografía debe funcionar
    const fontFamilySelect = screen.getByTestId('font-family-select');
    await user.selectOptions(fontFamilySelect, 'Georgia');
    expect(coverTitle).toHaveStyle({ fontFamily: 'Georgia' });
    
    // 5. Cambiar posición debe funcionar
    const positionBottomCenter = screen.getByTestId('position-bottom-center');
    await user.click(positionBottomCenter);
    expect(coverTitle).toHaveClass('position-bottom-center');
    
    // 6. Otros componentes NO deben verse afectados
    const pageText = screen.queryByTestId('page-text');
    if (pageText) {
      expect(pageText).not.toHaveClass('position-bottom-center');
      expect(pageText).not.toHaveStyle({ fontFamily: 'Georgia' });
    }
  });

  test('should validate migration compatibility before applying', async () => {
    const invalidLegacyConfig = {
      // Config con estructura rota
      cover: {
        components: [
          {
            // Falta id y type
            content: "Test",
            style: "invalid-style-format"
          }
        ]
      }
    };
    
    const validationResult = validateMigrationCompatibility(invalidLegacyConfig);
    
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toContain('Missing component id');
    expect(validationResult.errors).toContain('Invalid style format');
    expect(validationResult.warnings).toBeDefined();
  });

  test('should handle graceful fallback when migration fails', async () => {
    const corruptConfig = null; // Simular config corrupto
    
    // Sistema debe seguir funcionando con config por defecto
    expect(() => {
      const fallbackConfig = migrateToUnifiedSystem(corruptConfig);
      expect(fallbackConfig).toBeDefined();
      expect(fallbackConfig.version).toBe('2.0');
      expect(fallbackConfig.designTokens).toBeDefined();
    }).not.toThrow();
  });

  test('should maintain backwards compatibility with existing style configs', async () => {
    // Configs legacy con diferentes formatos históricos
    const legacyFormats = [
      // Formato v1.0
      {
        version: "1.0",
        cover: { components: [{ id: "title", type: "text", x: 100, y: 50, style: { fontSize: "2rem" } }] }
      },
      // Formato sin version
      {
        cover: { components: [{ id: "title", type: "text", position: "center", style: { fontSize: "3rem" } }] }
      },
      // Formato con containerStyle
      {
        cover: { 
          components: [{ 
            id: "title", 
            type: "text", 
            containerStyle: { verticalAlignment: "top", horizontalAlignment: "center" },
            style: { fontSize: "4rem" }
          }] 
        }
      }
    ];
    
    for (const legacyFormat of legacyFormats) {
      const unifiedConfig = migrateToUnifiedSystem(legacyFormat);
      
      // Todas deben convertirse exitosamente
      expect(unifiedConfig.version).toBe('2.0');
      expect(unifiedConfig.designTokens).toBeDefined();
      expect(unifiedConfig.pageTypes.cover.components).toHaveLength(1);
      
      // Deben renderizar sin errores
      expect(() => {
        render(
          <StoryRenderer 
            config={unifiedConfig} 
            pageType="cover" 
            context="admin-edit"
            storyData={{ title: "Test" }}
          />
        );
      }).not.toThrow();
    }
  });

  test('should support incremental migration strategy', async () => {
    const partiallyMigratedConfig = {
      version: "1.5", // Versión intermedia
      designTokens: {
        typography: {
          'title-style': { fontSize: '4rem', fontFamily: 'Ribeye' }
        }
      },
      cover: {
        components: [
          // Componente ya migrado
          {
            id: "new-title",
            type: "text",
            typography: "title-style"
          },
          // Componente legacy
          {
            id: "legacy-subtitle", 
            type: "text",
            style: { fontSize: "2rem" },
            x: 100, y: 200
          }
        ]
      }
    };
    
    const fullyMigratedConfig = migrateToUnifiedSystem(partiallyMigratedConfig);
    
    // Debe preservar componentes ya migrados
    const newTitle = fullyMigratedConfig.pageTypes.cover.components.find(c => c.id === "new-title");
    expect(newTitle?.typography).toBe("title-style");
    
    // Debe migrar componentes legacy
    const legacySubtitle = fullyMigratedConfig.pageTypes.cover.components.find(c => c.id === "legacy-subtitle");
    expect(legacySubtitle?.typography).toBeDefined();
    expect(legacySubtitle?.positioning).toBeDefined();
    expect(legacySubtitle).not.toHaveProperty('style');
    expect(legacySubtitle).not.toHaveProperty('x');
  });

  test('should preserve user customizations during migration', async () => {
    const customizedLegacyConfig = {
      cover: {
        components: [
          {
            id: "custom-title",
            type: "text",
            content: "Mi Título Personalizado",
            style: {
              fontSize: "5.5rem",           // Personalizado
              fontFamily: "Comic Sans MS",  // Personalizado
              color: "#ff6b9d",             // Personalizado
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)" // Personalizado
            },
            x: 75, y: 120,  // Posición personalizada
            customProperty: "valor-especial" // Propiedad custom
          }
        ]
      }
    };
    
    const migratedConfig = migrateToUnifiedSystem(customizedLegacyConfig);
    
    // Debe preservar todas las personalizaciones
    const component = migratedConfig.pageTypes.cover.components[0];
    expect(component.content).toBe("Mi Título Personalizado");
    expect(component.customProperty).toBe("valor-especial");
    
    // Debe generar tokens que preserven los estilos personalizados
    const typographyToken = migratedConfig.designTokens.typography[component.typography];
    expect(typographyToken.fontSize).toBe("5.5rem");
    expect(typographyToken.fontFamily).toBe("Comic Sans MS");
    expect(typographyToken.color).toBe("#ff6b9d");
    expect(typographyToken.textShadow).toBe("2px 2px 4px rgba(0,0,0,0.5)");
    
    const positioningToken = migratedConfig.designTokens.positioning[component.positioning];
    expect(positioningToken.offset).toEqual({ x: 75, y: 120 });
  });

  test('should support rollback to legacy system if needed', async () => {
    const unifiedConfig = mockUnifiedConfig;
    
    // Debe poder convertir de vuelta a formato legacy
    const rolledBackConfig = convertUnifiedToLegacy(unifiedConfig);
    
    expect(rolledBackConfig.cover.components[0]).toHaveProperty('style');
    expect(rolledBackConfig.cover.components[0]).toHaveProperty('x');
    expect(rolledBackConfig.cover.components[0]).toHaveProperty('y');
    expect(rolledBackConfig.cover.components[0]).toHaveProperty('position');
    
    // El rollback debe ser funcionalmente idéntico al original
    const originalLegacy = mockLegacyConfig;
    const reRolledBack = convertUnifiedToLegacy(migrateToUnifiedSystem(originalLegacy));
    
    // Debe preservar funcionalidad (aunque estructura pueda diferir)
    expect(reRolledBack.cover.components[0].style.fontSize)
      .toBe(originalLegacy.cover.components[0].style.fontSize);
    expect(reRolledBack.cover.components[0].content)
      .toBe(originalLegacy.cover.components[0].content);
  });
});