// Panel Wrappers refactorizados - Implementación del sistema unificado de paneles
// Eliminación de duplicaciones y separación clara de responsabilidades

import React from 'react';

// Interfaces unificadas para el sistema de paneles
interface PanelProps {
  component?: any;
  components?: any[];
  selectedComponentId?: string;
  onUpdate: (category: string, properties: any) => void | ((id: string, category: string, properties: any) => void);
  onSelect?: (id: string) => void;
}

// Constantes reutilizables
const GRID_REGIONS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center-center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right'
] as const;

const FONT_FAMILIES = ['Arial', 'Georgia', 'Ribeye'] as const;
const TEXT_ALIGNMENTS = ['left', 'center', 'right'] as const;

// Componente reutilizable para inputs
const StyledInput: React.FC<{
  testId: string;
  type?: 'text' | 'color' | 'number';
  defaultValue?: string | number;
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
}> = ({ testId, type = 'text', defaultValue, onBlur, onChange }) => (
  <input 
    data-testid={testId}
    type={type}
    defaultValue={defaultValue}
    onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
  />
);

// Panel de gestión de componentes - Solo responsable de lista y CRUD
export const ComponentsPanel: React.FC<PanelProps> = ({ 
  components = [], 
  onUpdate, 
  onSelect 
}) => (
  <div data-testid="components-panel">
    <h3>Gestión de Componentes</h3>
    
    {/* Lista de componentes */}
    {components.map((component, index) => {
      const id = component.id || index;
      return (
        <div key={id} data-testid={`component-${id}`}>
          <span>{component.content || `Component ${index + 1}`}</span>
          <button data-testid={`delete-component-${id}`}>
            Delete
          </button>
        </div>
      );
    })}
    
    <button data-testid="add-component-btn">
      Add Component
    </button>
  </div>
);

// Panel de posicionamiento - Solo responsable del grid 3x3 y offsets
export const PositionPanel: React.FC<PanelProps> = ({ 
  component, 
  onUpdate 
}) => {
  const handleGridPositionChange = (region: string) => {
    onUpdate('positioning', { region });
  };

  const currentRegion = component?.positioning?.region;

  return (
    <div data-testid="position-panel">
      <h3>Posicionamiento</h3>
      
      {/* Grid 3x3 */}
      <div data-testid="grid-3x3" className="grid grid-cols-3 gap-2">
        {GRID_REGIONS.map(region => (
          <button
            key={region}
            data-testid={`position-${region}`}
            onClick={() => handleGridPositionChange(region)}
            className={`p-2 border rounded ${
              currentRegion === region ? 'bg-blue-200' : 'bg-gray-100'
            }`}
          >
            {region.replace('-', ' ')}
          </button>
        ))}
      </div>
      
      {/* Offsets */}
      <div data-testid="positioning-controls">
        <label>Offset X:</label>
        <StyledInput 
          testId="offset-x" 
          type="number" 
          defaultValue={component?.x || 0} 
        />
        
        <label>Offset Y:</label>
        <StyledInput 
          testId="offset-y" 
          type="number" 
          defaultValue={component?.y || 0} 
        />
      </div>
    </div>
  );
};

// Panel de contenedor - Solo responsable de estilos visuales del contenedor
export const ContainerPanel: React.FC<PanelProps> = ({ 
  component, 
  onUpdate 
}) => {
  const handleUpdate = (property: string, value: string) => {
    onUpdate('container', { [property]: value });
  };

  const style = component?.style || {};

  return (
    <div data-testid="container-panel">
      <h3>Contenedor</h3>
      
      <div>
        <label>Color de fondo:</label>
        <StyledInput 
          testId="background-color-input"
          type="color"
          defaultValue={style.backgroundColor || '#ffffff'}
          onBlur={(value) => handleUpdate('backgroundColor', value)}
        />
      </div>
      
      <div data-testid="padding-controls">
        <label>Padding:</label>
        <StyledInput 
          testId="padding-input"
          defaultValue={style.padding || '1rem'}
          onBlur={(value) => handleUpdate('padding', value)}
        />
      </div>
      
      <div>
        <label>Border Radius:</label>
        <StyledInput 
          testId="border-radius-input"
          defaultValue={style.borderRadius || '0px'}
          onBlur={(value) => handleUpdate('borderRadius', value)}
        />
      </div>
      
      <div data-testid="backdrop-filter-controls">
        <label>Backdrop Filter:</label>
        <StyledInput 
          testId="backdrop-filter-input"
          defaultValue={style.backdropFilter || 'none'}
          onBlur={(value) => handleUpdate('backdropFilter', value)}
        />
      </div>
    </div>
  );
};

// Panel de tipografía - Solo responsable de estilos de texto
export const TypographyPanel: React.FC<PanelProps> = ({ 
  component, 
  selectedComponentId,
  onUpdate 
}) => {
  const handleUpdate = (property: string, value: string) => {
    if (selectedComponentId) {
      // Interfaz de 3 parámetros cuando hay componente seleccionado
      (onUpdate as (id: string, category: string, properties: any) => void)(
        selectedComponentId, 
        'typography', 
        { [property]: value }
      );
    } else {
      // Interfaz de 2 parámetros para actualización global
      onUpdate('typography', { [property]: value });
    }
  };

  const style = component?.style || {};

  return (
    <div data-testid="typography-panel">
      <h3>Tipografía</h3>
      
      <div>
        <label>Familia de fuente:</label>
        <select 
          data-testid="font-family-select"
          defaultValue={style.fontFamily || 'Arial'}
          onChange={(e) => handleUpdate('fontFamily', e.target.value)}
        >
          {FONT_FAMILIES.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label>Tamaño de fuente:</label>
        <StyledInput 
          testId="font-size-input"
          defaultValue={style.fontSize || '1rem'}
          onBlur={(value) => handleUpdate('fontSize', value)}
        />
      </div>
      
      {/* Controles de alineación de texto */}
      <div data-testid="text-align-controls">
        <label>Alineación de texto:</label>
        <div>
          {TEXT_ALIGNMENTS.map(align => (
            <button 
              key={align}
              data-testid={`text-align-${align}`}
              onClick={() => handleUpdate('textAlign', align)}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};