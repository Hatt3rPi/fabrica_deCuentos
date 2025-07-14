import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryRenderer } from '../../../components/StoryRenderer/UnifiedStoryRenderer';
import { createMockUnifiedConfig, mockStoryData } from '../setup/test-utils';

// ESTOS TESTS DEBEN FALLAR INICIALMENTE - FASE RED DEL TDD

describe('Universal Story Renderer - TDD RED Phase', () => {
  const unifiedConfig = createMockUnifiedConfig();
  const mockOnComponentSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render identically across all contexts', async () => {
    // Renderizar en contexto admin
    const { container: adminContainer } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="admin-edit"
        storyData={mockStoryData}
      />
    );
    
    // Renderizar en contexto wizard  
    const { container: wizardContainer } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="wizard-preview"
        storyData={mockStoryData}
      />
    );
    
    // Renderizar en contexto PDF
    const { container: pdfContainer } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="pdf-generation"
        storyData={mockStoryData}
      />
    );

    // Verificar que el contenido renderizado es idéntico
    const adminTitle = adminContainer.querySelector('[data-testid="cover-title"]');
    const wizardTitle = wizardContainer.querySelector('[data-testid="cover-title"]');
    const pdfTitle = pdfContainer.querySelector('[data-testid="cover-title"]');
    
    expect(adminTitle).toHaveStyle({ fontSize: '4rem' });
    expect(wizardTitle).toHaveStyle({ fontSize: '4rem' });
    expect(pdfTitle).toHaveStyle({ fontSize: '4rem' });
    
    expect(adminTitle?.textContent).toBe(wizardTitle?.textContent);
    expect(wizardTitle?.textContent).toBe(pdfTitle?.textContent);
    
    // Verificar que la estructura DOM es idéntica
    expect(adminContainer.innerHTML).toBe(wizardContainer.innerHTML.replace(/data-context="wizard-preview"/g, 'data-context="admin-edit"'));
  });

  test('should apply design tokens consistently across contexts', () => {
    const { container } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="admin-edit"
        storyData={mockStoryData}
      />
    );
    
    const title = container.querySelector('[data-testid="cover-title"]');
    const titleContainer = title?.parentElement;
    
    // Verificar que se aplican tokens de typography
    expect(title).toHaveStyle({
      fontFamily: 'Ribeye',
      fontSize: '4rem',
      fontWeight: '700',
      color: '#ffffff'
    });
    
    // Verificar que se aplican tokens de container (solo propiedades soportadas por JSDOM)
    expect(titleContainer).toHaveStyle({
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '2rem',
      padding: '2rem 3rem'
    });
    
    // Note: backdrop-filter no se puede verificar en JSDOM ya que no es soportado
    // pero el componente lo aplica correctamente en navegadores reales
    
    // Verificar que se aplican tokens de positioning
    expect(titleContainer).toHaveClass('position-top-center');
    expect(titleContainer).toHaveStyle({
      transform: 'translate(0px, 40px)'
    });
  });

  test('should handle component selection in admin context only', async () => {
    const user = userEvent.setup();
    
    // En admin: debe permitir selección
    const { container: adminContainer } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="admin-edit"
        selectedComponentId="cover-title"
        onComponentSelect={mockOnComponentSelect}
        storyData={mockStoryData}
      />
    );
    
    const adminTitle = adminContainer.querySelector('[data-testid="cover-title"]');
    expect(adminTitle).toHaveClass('component-selectable');
    expect(adminTitle).toHaveClass('component-selected');
    
    await user.click(adminTitle!);
    expect(mockOnComponentSelect).toHaveBeenCalledWith('cover-title');
    
    // Clear mock for wizard test
    vi.clearAllMocks();
    
    // En otros contextos: NO debe permitir selección
    const { container: wizardContainer } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="wizard-preview"
        storyData={mockStoryData}
      />
    );
    
    const wizardTitle = wizardContainer.querySelector('[data-testid="cover-title"]');
    expect(wizardTitle).not.toHaveClass('component-selectable');
    expect(wizardTitle).not.toHaveAttribute('onClick');
    
    await user.click(wizardTitle!);
    expect(mockOnComponentSelect).not.toHaveBeenCalled();
  });

  test('should resolve component styles from design tokens correctly', () => {
    const customConfig = {
      ...unifiedConfig,
      designTokens: {
        typography: {
          'custom-title': {
            fontFamily: 'CustomFont',
            fontSize: '6rem',
            color: '#ff0000'
          }
        },
        containers: {
          'custom-container': {
            backgroundColor: '#00ff00',
            padding: '3rem',
            borderRadius: '1rem'
          }
        },
        positioning: {
          'custom-position': {
            region: 'bottom-right' as const,
            offset: { x: 20, y: -30 }
          }
        }
      },
      pageTypes: {
        cover: {
          components: [
            {
              id: 'custom-title',
              type: 'text',
              content: 'Custom Title',
              typography: 'custom-title',
              container: 'custom-container',
              positioning: 'custom-position'
            }
          ]
        }
      }
    };
    
    const { container } = render(
      <StoryRenderer 
        config={customConfig} 
        pageType="cover" 
        context="admin-edit"
        storyData={mockStoryData}
      />
    );
    
    const title = container.querySelector('[data-testid="custom-title"]');
    const titleContainer = title?.parentElement;
    
    // Verificar resolución correcta de tokens
    expect(title).toHaveStyle({
      fontFamily: 'CustomFont',
      fontSize: '6rem',
      color: '#ff0000'
    });
    
    expect(titleContainer).toHaveStyle({
      backgroundColor: '#00ff00',
      padding: '3rem',
      borderRadius: '1rem'
    });
    
    expect(titleContainer).toHaveClass('position-bottom-right');
    expect(titleContainer).toHaveStyle({
      transform: 'translate(20px, -30px)'
    });
  });

  test('should handle missing design tokens gracefully', () => {
    const incompleteConfig = {
      version: "2.0",
      designTokens: {
        typography: {},
        containers: {},
        positioning: {}
      },
      pageTypes: {
        cover: {
          components: [
            {
              id: 'incomplete-component',
              type: 'text',
              content: 'Test',
              typography: 'non-existent-token',
              container: 'non-existent-container',
              positioning: 'non-existent-position'
            }
          ]
        }
      }
    };
    
    // No debe fallar, debe usar fallbacks
    const { container } = render(
      <StoryRenderer 
        config={incompleteConfig} 
        pageType="cover" 
        context="admin-edit"
        storyData={mockStoryData}
      />
    );
    
    const component = container.querySelector('[data-testid="incomplete-component"]');
    expect(component).toBeInTheDocument();
    
    // Debe aplicar estilos por defecto
    expect(component).toHaveStyle({
      fontSize: '1rem',    // default typography
      fontFamily: 'Arial', // default typography
      color: '#000000'     // default typography
    });
  });

  test('should support dynamic content replacement', () => {
    const dynamicStoryData = {
      title: "Mi Historia Dinámica",
      pages: [
        { text: "Contenido dinámico de página", imageUrl: "" }
      ]
    };
    
    const { container } = render(
      <StoryRenderer 
        config={unifiedConfig} 
        pageType="cover" 
        context="wizard-preview"
        storyData={dynamicStoryData}
      />
    );
    
    // El contenido debe reemplazar las variables
    const title = container.querySelector('[data-testid="cover-title"]');
    expect(title?.textContent).toBe('Mi Historia Dinámica');
  });

  test('should maintain performance with large configs', () => {
    // Config con muchos tokens y componentes
    const largeConfig = {
      version: "2.0",
      designTokens: {
        typography: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`token-${i}`, { fontSize: `${i + 1}rem` }])
        ),
        containers: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`container-${i}`, { padding: `${i + 1}rem` }])
        ),
        positioning: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`position-${i}`, { 
            region: 'center-center' as const, 
            offset: { x: i, y: i } 
          }])
        )
      },
      pageTypes: {
        cover: {
          components: Array.from({ length: 50 }, (_, i) => ({
            id: `component-${i}`,
            type: 'text',
            content: `Component ${i}`,
            typography: `token-${i % 100}`,
            container: `container-${i % 100}`,
            positioning: `position-${i % 100}`
          }))
        }
      }
    };
    
    const start = performance.now();
    
    const { container } = render(
      <StoryRenderer 
        config={largeConfig} 
        pageType="cover" 
        context="admin-edit"
        storyData={mockStoryData}
      />
    );
    
    const end = performance.now();
    const renderTime = end - start;
    
    // Debe renderizar en menos de 200ms incluso con config grande
    expect(renderTime).toBeLessThan(200);
    
    // Todos los componentes deben estar presentes
    const components = container.querySelectorAll('[data-testid^="component-"]');
    expect(components).toHaveLength(50);
  });

  test('should support all page types consistently', () => {
    const multiPageConfig = {
      ...unifiedConfig,
      pageTypes: {
        cover: unifiedConfig.pageTypes.cover,
        page: unifiedConfig.pageTypes.page,
        dedication: {
          components: [
            {
              id: 'dedication-text',
              type: 'text',
              content: 'Para mi querido...',
              typography: 'text-medium'
            }
          ]
        }
      }
    };
    
    // Test cover
    const { container: coverContainer } = render(
      <StoryRenderer config={multiPageConfig} pageType="cover" context="admin-edit" storyData={mockStoryData} />
    );
    expect(coverContainer.querySelector('[data-testid="cover-title"]')).toBeInTheDocument();
    
    // Test page
    const { container: pageContainer } = render(
      <StoryRenderer config={multiPageConfig} pageType="page" context="admin-edit" storyData={mockStoryData} />
    );
    expect(pageContainer.querySelector('[data-testid="page-text"]')).toBeInTheDocument();
    
    // Test dedication
    const { container: dedicationContainer } = render(
      <StoryRenderer config={multiPageConfig} pageType="dedication" context="admin-edit" storyData={mockStoryData} />
    );
    expect(dedicationContainer.querySelector('[data-testid="dedication-text"]')).toBeInTheDocument();
  });
});