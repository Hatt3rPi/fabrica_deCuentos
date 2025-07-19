// TDDPanelAdapter - Adaptador para integrar los paneles TDD con el AdminStyleEditor
import React, { useCallback, useMemo } from 'react';
import { 
  ComponentsPanel, 
  PositionPanel, 
  ContainerPanel, 
  TypographyPanel 
} from './TDDPanelWrappers';
import { ComponentConfig } from '../../../../types/styleConfig';

interface TDDPanelAdapterProps {
  activePanel: string;
  selectedComponent: ComponentConfig | null;
  allComponents: ComponentConfig[];
  currentPageType: 'cover' | 'page' | 'dedicatoria';
  onUpdateComponent: (componentId: string, updates: any) => void;
  onSelectComponent: (componentId: string) => void;
  onAddComponent: (component: ComponentConfig) => void;
  onDeleteComponent: (componentId: string) => void;
}

export const TDDPanelAdapter: React.FC<TDDPanelAdapterProps> = ({
  activePanel,
  selectedComponent,
  allComponents,
  currentPageType,
  onUpdateComponent,
  onSelectComponent,
  onAddComponent,
  onDeleteComponent
}) => {
  // Filtrar componentes de la página actual
  const pageComponents = useMemo(() => 
    allComponents.filter(c => c.pageType === currentPageType),
    [allComponents, currentPageType]
  );

  // Adaptador para actualización de componentes con categorías
  const handleUpdate = useCallback((category: string, properties: any) => {
    if (!selectedComponent) return;

    // Mapear categorías a propiedades del componente
    let updates: any = {};

    switch (category) {
      case 'typography':
        // Actualizar style con propiedades de tipografía
        updates.style = {
          ...selectedComponent.style,
          ...properties
        };
        break;

      case 'container':
        // Actualizar style y containerStyle con propiedades del contenedor
        updates.style = {
          ...selectedComponent.style,
          ...properties
        };
        if (properties.horizontalAlignment || properties.verticalAlignment) {
          updates.containerStyle = {
            ...selectedComponent.containerStyle,
            ...properties
          };
        }
        break;

      case 'positioning':
        // Actualizar posición basada en región del grid
        if (properties.region) {
          const [vertical, horizontal] = properties.region.split('-');
          updates.position = vertical;
          updates.horizontalPosition = horizontal;
        }
        if (properties.offset) {
          updates.x = properties.offset.x;
          updates.y = properties.offset.y;
        }
        break;

      default:
        updates = properties;
    }

    onUpdateComponent(selectedComponent.id, updates);
  }, [selectedComponent, onUpdateComponent]);

  // Adaptador para actualización con 3 parámetros (cuando hay componente seleccionado)
  const handleUpdateWithId = useCallback((id: string, category: string, properties: any) => {
    const component = allComponents.find(c => c.id === id);
    if (!component) return;

    let updates: any = {};

    switch (category) {
      case 'typography':
        updates.style = {
          ...component.style,
          ...properties
        };
        break;

      case 'container':
        updates.style = {
          ...component.style,
          ...properties
        };
        if (properties.horizontalAlignment || properties.verticalAlignment) {
          updates.containerStyle = {
            ...component.containerStyle,
            ...properties
          };
        }
        break;

      case 'positioning':
        if (properties.region) {
          const [vertical, horizontal] = properties.region.split('-');
          updates.position = vertical;
          updates.horizontalPosition = horizontal;
        }
        if (properties.offset) {
          updates.x = properties.offset.x;
          updates.y = properties.offset.y;
        }
        break;

      default:
        updates = properties;
    }

    onUpdateComponent(id, updates);
  }, [allComponents, onUpdateComponent]);

  // Manejar adición de componentes
  const handleAddComponent = useCallback(() => {
    const newComponent: ComponentConfig = {
      id: `component-${Date.now()}`,
      type: 'text',
      content: 'Nuevo texto',
      pageType: currentPageType,
      style: {
        fontSize: '1.5rem',
        fontFamily: 'Arial',
        color: '#000000'
      },
      position: 'center',
      horizontalPosition: 'center',
      x: 0,
      y: 0
    };
    onAddComponent(newComponent);
  }, [currentPageType, onAddComponent]);

  // Renderizar el panel activo
  switch (activePanel) {
    case 'components':
      return (
        <ComponentsPanel
          components={pageComponents}
          onUpdate={handleUpdate}
          onSelect={onSelectComponent}
        />
      );

    case 'typography':
      if (!selectedComponent) return null;
      return (
        <TypographyPanel
          component={selectedComponent}
          selectedComponentId={selectedComponent.id}
          onUpdate={handleUpdateWithId}
        />
      );

    case 'position':
      if (!selectedComponent) return null;
      return (
        <PositionPanel
          component={selectedComponent}
          onUpdate={handleUpdate}
        />
      );

    case 'container':
      if (!selectedComponent) return null;
      return (
        <ContainerPanel
          component={selectedComponent}
          onUpdate={handleUpdate}
        />
      );

    default:
      return null;
  }
};

export default TDDPanelAdapter;