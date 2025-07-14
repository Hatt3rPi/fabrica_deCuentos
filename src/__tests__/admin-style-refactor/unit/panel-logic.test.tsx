import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import {
  ComponentsPanel,
  PositionPanel, 
  ContainerPanel,
  TypographyPanel
} from '../../../pages/Admin/StyleEditor/components';
import { createMockComponent, createMockTextComponent, createMockUnifiedConfig } from '../setup/test-utils';

// ESTOS TESTS DEBEN FALLAR INICIALMENTE - FASE RED DEL TDD

describe('Panel Deduplication - TDD RED Phase', () => {
  const mockOnUpdate = vi.fn();
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Position Panel should be the ONLY source of positioning logic', () => {
    const mockComponent = createMockComponent();
    
    // Panel Elementos NO debe tener controles de posición
    const { container: elementsContainer } = render(
      <ComponentsPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(elementsContainer.querySelector('[data-testid="position-controls"]')).toBeNull();
    expect(elementsContainer.querySelector('[data-testid="horizontal-position-select"]')).toBeNull();
    expect(elementsContainer.querySelector('[data-testid="vertical-position-select"]')).toBeNull();
    expect(elementsContainer.querySelector('[data-testid="x-coordinate"]')).toBeNull();
    expect(elementsContainer.querySelector('[data-testid="y-coordinate"]')).toBeNull();
    
    // Panel Contenedor NO debe tener controles de alineación
    const { container: containerContainer } = render(
      <ContainerPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(containerContainer.querySelector('[data-testid="vertical-alignment"]')).toBeNull();
    expect(containerContainer.querySelector('[data-testid="horizontal-alignment"]')).toBeNull();
    expect(containerContainer.querySelector('[data-testid="position-grid"]')).toBeNull();
    
    // Solo Panel Posición debe tener controles de posicionamiento
    const { container: positionContainer } = render(
      <PositionPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(positionContainer.querySelector('[data-testid="grid-3x3"]')).toBeInTheDocument();
    expect(positionContainer.querySelector('[data-testid="positioning-controls"]')).toBeInTheDocument();
    expect(positionContainer.querySelector('[data-testid="position-top-left"]')).toBeInTheDocument();
    expect(positionContainer.querySelector('[data-testid="position-center-center"]')).toBeInTheDocument();
  });

  test('Typography Panel should be the ONLY source of text alignment', () => {
    const mockComponent = createMockTextComponent();
    
    // Panel Tipografía debe tener controles de alineación de texto
    const { container: typographyContainer } = render(
      <TypographyPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(typographyContainer.querySelector('[data-testid="text-align-controls"]')).toBeInTheDocument();
    expect(typographyContainer.querySelector('[data-testid="text-align-left"]')).toBeInTheDocument();
    expect(typographyContainer.querySelector('[data-testid="text-align-center"]')).toBeInTheDocument();
    expect(typographyContainer.querySelector('[data-testid="text-align-right"]')).toBeInTheDocument();
    
    // Panel Contenedor NO debe tener alineación de texto
    const { container: containerContainer } = render(
      <ContainerPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(containerContainer.querySelector('[data-testid="text-align-controls"]')).toBeNull();
    expect(containerContainer.querySelector('[data-testid="text-align-left"]')).toBeNull();
    
    // Panel Posición NO debe tener alineación de texto
    const { container: positionContainer } = render(
      <PositionPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(positionContainer.querySelector('[data-testid="text-align-controls"]')).toBeNull();
  });

  test('should update ONLY selected component when making changes', async () => {
    const config = createMockUnifiedConfig();
    const selectedComponentId = 'cover-title';
    const user = userEvent.setup();
    
    // Mock de función de actualización
    const mockUpdateComponentTypography = vi.fn();
    
    // Renderizar panel con componente seleccionado
    render(
      <TypographyPanel 
        component={config.pageTypes.cover.components[0]}
        selectedComponentId={selectedComponentId}
        onUpdate={mockUpdateComponentTypography}
      />
    );
    
    // Cambiar fontSize
    const fontSizeInput = screen.getByTestId('font-size-input');
    await user.clear(fontSizeInput);
    await user.type(fontSizeInput, '5rem');
    // Trigger onBlur para que se actualice
    fontSizeInput.blur();
    
    // Verificar que se llamó la función de actualización solo para el componente seleccionado
    expect(mockUpdateComponentTypography).toHaveBeenCalledWith(
      selectedComponentId, 
      'typography',
      { fontSize: '5rem' }
    );
    
    // Verificar que otros componentes NO fueron afectados
    expect(mockUpdateComponentTypography).toHaveBeenCalledTimes(1);
  });

  test('Position Panel should use 3x3 grid system exclusively', async () => {
    const mockComponent = createMockComponent();
    const user = userEvent.setup();
    
    render(
      <PositionPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    
    // Debe tener exactamente 9 botones de posición (3x3 grid)
    const gridButtons = screen.getAllByTestId(/^position-(top|center|bottom)-(left|center|right)$/);
    expect(gridButtons).toHaveLength(9);
    
    // Click en top-center debe actualizar solo region
    const topCenterBtn = screen.getByTestId('position-top-center');
    await user.click(topCenterBtn);
    
    expect(mockOnUpdate).toHaveBeenCalledWith('positioning', {
      region: 'top-center'
    });
    
    // NO debe actualizar propiedades legacy
    expect(mockOnUpdate).not.toHaveBeenCalledWith(
      expect.anything(), 
      expect.objectContaining({
        position: expect.anything(),
        horizontalPosition: expect.anything(),
        x: expect.anything(),
        y: expect.anything()
      })
    );
  });

  test('Container Panel should handle ONLY visual container properties', () => {
    const mockComponent = createMockComponent();
    
    render(
      <ContainerPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    
    // Debe tener controles de container SOLAMENTE
    expect(screen.getByTestId('background-color-input')).toBeInTheDocument();
    expect(screen.getByTestId('padding-controls')).toBeInTheDocument();
    expect(screen.getByTestId('border-radius-input')).toBeInTheDocument();
    expect(screen.getByTestId('backdrop-filter-controls')).toBeInTheDocument();
    
    // NO debe tener controles de posición
    expect(screen.queryByTestId('position-controls')).toBeNull();
    expect(screen.queryByTestId('grid-3x3')).toBeNull();
    
    // NO debe tener controles de tipografía
    expect(screen.queryByTestId('font-family-select')).toBeNull();
    expect(screen.queryByTestId('font-size-input')).toBeNull();
    expect(screen.queryByTestId('text-align-controls')).toBeNull();
  });

  test('Components Panel should handle ONLY component management', () => {
    const mockComponents = [
      createMockComponent({ id: 'comp1', content: 'Component 1' }),
      createMockComponent({ id: 'comp2', content: 'Component 2' })
    ];
    
    render(
      <ComponentsPanel 
        components={mockComponents}
        onSelect={mockOnSelect}
        onUpdate={mockOnUpdate}
      />
    );
    
    // Debe mostrar lista de componentes
    expect(screen.getByTestId('component-comp1')).toBeInTheDocument();
    expect(screen.getByTestId('component-comp2')).toBeInTheDocument();
    
    // Debe tener botón para agregar componente
    expect(screen.getByTestId('add-component-btn')).toBeInTheDocument();
    
    // Debe tener botones de eliminar
    expect(screen.getAllByTestId(/delete-component-/)).toHaveLength(2);
    
    // NO debe tener controles de estilo
    expect(screen.queryByTestId('position-controls')).toBeNull();
    expect(screen.queryByTestId('typography-controls')).toBeNull();
    expect(screen.queryByTestId('container-controls')).toBeNull();
  });

  test('should prevent cross-panel property conflicts', async () => {
    const mockComponent = createMockComponent({
      style: {
        fontSize: '2rem',      // Typography
        padding: '1rem',       // Container  
        textAlign: 'center'    // Typography
      },
      x: 100, y: 50,          // Position (legacy)
      position: 'center'      // Position (legacy)
    });
    
    // Typography panel NO debe permitir cambiar padding
    const { container: typographyContainer, unmount: unmountTypography } = render(
      <TypographyPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(typographyContainer.querySelector('[data-testid="padding-controls"]')).toBeNull();
    unmountTypography();
    
    // Container panel NO debe permitir cambiar fontSize
    const { container: containerContainer, unmount: unmountContainer } = render(
      <ContainerPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(containerContainer.querySelector('[data-testid="font-size-input"]')).toBeNull();
    unmountContainer();
    
    // Position panel NO debe permitir cambiar textAlign  
    const { container: positionContainer } = render(
      <PositionPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    expect(positionContainer.querySelector('[data-testid="text-align-controls"]')).toBeNull();
  });

  test('should maintain consistent update interface across panels', async () => {
    const mockComponent = createMockComponent();
    const user = userEvent.setup();
    
    // Todos los paneles deben usar la misma interfaz: onUpdate(category, properties)
    
    // Typography Panel
    render(
      <TypographyPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    const fontSizeInput = screen.getByTestId('font-size-input');
    await user.clear(fontSizeInput);
    await user.type(fontSizeInput, '3rem');
    fontSizeInput.blur();
    
    expect(mockOnUpdate).toHaveBeenCalledWith('typography', {
      fontSize: '3rem'
    });
    
    vi.clearAllMocks();
    
    // Container Panel  
    const { unmount } = render(
      <TypographyPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    unmount();
    
    render(
      <ContainerPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    const paddingInput = screen.getByTestId('padding-input');
    await user.clear(paddingInput);
    await user.type(paddingInput, '2rem');
    paddingInput.blur();
    
    expect(mockOnUpdate).toHaveBeenCalledWith('container', {
      padding: '2rem'
    });
    
    vi.clearAllMocks();
    
    // Position Panel
    const { unmount: unmount2 } = render(
      <ContainerPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    unmount2();
    
    render(
      <PositionPanel component={mockComponent} onUpdate={mockOnUpdate} />
    );
    const centerBtn = screen.getByTestId('position-center-center');
    await user.click(centerBtn);
    
    expect(mockOnUpdate).toHaveBeenCalledWith('positioning', {
      region: 'center-center'
    });
  });
});