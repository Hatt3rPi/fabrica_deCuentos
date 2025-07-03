import React, { useState } from 'react';
import './ComponentsPanel.css';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Settings, 
  Type, 
  Image, 
  FileSignature,
  QrCode,
  Move,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  ComponentConfig, 
  TextComponentConfig, 
  ImageComponentConfig, 
  PageType,
  ComponentType,
  DEFAULT_AUTHOR_COMPONENT,
  DEFAULT_LOGO_COMPONENT,
  DEFAULT_SIGNATURE_COMPONENT
} from '../../../../types/styleConfig';

interface ComponentsPanelProps {
  pageType: PageType;
  components: ComponentConfig[];
  onChange: (components: ComponentConfig[]) => void;
}

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({ 
  pageType, 
  components, 
  onChange 
}) => {
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleComponent = (componentId: string) => {
    const updated = components.map(comp => 
      comp.id === componentId 
        ? { ...comp, enabled: !comp.enabled }
        : comp
    );
    onChange(updated);
  };

  const removeComponent = (componentId: string) => {
    const updated = components.filter(comp => comp.id !== componentId);
    onChange(updated);
  };

  const updateComponent = (componentId: string, updates: Partial<ComponentConfig>) => {
    const updated = components.map(comp => 
      comp.id === componentId 
        ? { ...comp, ...updates }
        : comp
    );
    onChange(updated);
  };

  const addComponent = (type: ComponentType, name: string) => {
    let newComponent: ComponentConfig;
    const id = `${type}-${Date.now()}`;

    switch (type) {
      case 'text':
        newComponent = {
          ...DEFAULT_AUTHOR_COMPONENT,
          id,
          name,
          content: name === 'autor' ? 'Nombre del Autor' : `Texto de ${name}`
        };
        break;
      case 'image':
        newComponent = {
          ...DEFAULT_LOGO_COMPONENT,
          id,
          name
        };
        break;
      case 'signature':
        newComponent = {
          ...DEFAULT_SIGNATURE_COMPONENT,
          id,
          name
        };
        break;
      default:
        return;
    }

    onChange([...components, newComponent]);
    setShowAddModal(false);
  };

  const getComponentIcon = (type: ComponentType) => {
    switch (type) {
      case 'text': return <Type size={16} />;
      case 'image': return <Image size={16} />;
      case 'signature': return <FileSignature size={16} />;
      case 'qrcode': return <QrCode size={16} />;
      default: return <Settings size={16} />;
    }
  };

  return (
    <div className="components-panel">
      <div className="panel-header">
        <h3>Componentes de {pageType}</h3>
        <button 
          className="btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      <div className="components-list">
        {components.map((component) => (
          <div key={component.id} className="component-item">
            <div className="component-header">
              <div className="component-info">
                <button
                  className="expand-btn"
                  onClick={() => setExpandedComponent(
                    expandedComponent === component.id ? null : component.id
                  )}
                >
                  {expandedComponent === component.id ? 
                    <ChevronDown size={16} /> : 
                    <ChevronRight size={16} />
                  }
                </button>
                
                {getComponentIcon(component.type)}
                
                <span className="component-name">{component.name}</span>
                
                <span className={`component-type ${component.type}`}>
                  {component.type}
                </span>
              </div>

              <div className="component-actions">
                <button
                  className={`btn-icon ${component.enabled ? 'active' : ''}`}
                  onClick={() => toggleComponent(component.id)}
                  title={component.enabled ? 'Ocultar' : 'Mostrar'}
                >
                  {component.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                
                <button
                  className="btn-icon btn-danger"
                  onClick={() => removeComponent(component.id)}
                  title="Eliminar componente"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {expandedComponent === component.id && (
              <div className="component-config">
                <ComponentConfigEditor 
                  component={component}
                  onChange={(updates) => updateComponent(component.id, updates)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddComponentModal
          pageType={pageType}
          onAdd={addComponent}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

// Componente para editar configuración específica
const ComponentConfigEditor: React.FC<{
  component: ComponentConfig;
  onChange: (updates: Partial<ComponentConfig>) => void;
}> = ({ component, onChange }) => {
  if (component.type === 'text') {
    const textComp = component as TextComponentConfig;
    
    return (
      <div className="config-editor">
        <div className="form-group">
          <label>Contenido</label>
          <input
            type="text"
            value={textComp.content || ''}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Texto a mostrar"
          />
        </div>

        <div className="form-group">
          <label>Tamaño de fuente</label>
          <input
            type="text"
            value={textComp.style.fontSize}
            onChange={(e) => onChange({ 
              style: { ...textComp.style, fontSize: e.target.value }
            })}
            placeholder="1.8rem"
          />
        </div>

        <div className="form-group">
          <label>Color</label>
          <input
            type="color"
            value={textComp.style.color}
            onChange={(e) => onChange({ 
              style: { ...textComp.style, color: e.target.value }
            })}
          />
        </div>

        <PositionControls 
          position={component.position}
          horizontalPosition={component.horizontalPosition}
          onChange={(pos) => onChange(pos)}
        />
      </div>
    );
  }

  if (component.type === 'image') {
    const imageComp = component as ImageComponentConfig;
    
    return (
      <div className="config-editor">
        <div className="form-group">
          <label>URL de imagen</label>
          <input
            type="url"
            value={imageComp.imageUrl || ''}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="https://ejemplo.com/imagen.png"
          />
        </div>

        <div className="form-group">
          <label>Tamaño</label>
          <select
            value={imageComp.size}
            onChange={(e) => onChange({ size: e.target.value as any })}
          >
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div className="form-group">
          <label>Opacidad</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={imageComp.opacity || 1}
            onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
          />
          <span>{Math.round((imageComp.opacity || 1) * 100)}%</span>
        </div>

        <PositionControls 
          position={component.position}
          horizontalPosition={component.horizontalPosition}
          onChange={(pos) => onChange(pos)}
        />
      </div>
    );
  }

  return null;
};

// Controles de posicionamiento
const PositionControls: React.FC<{
  position: string;
  horizontalPosition?: string;
  onChange: (updates: any) => void;
}> = ({ position, horizontalPosition, onChange }) => (
  <div className="position-controls">
    <div className="form-group">
      <label>Posición vertical</label>
      <select
        value={position}
        onChange={(e) => onChange({ position: e.target.value })}
      >
        <option value="top">Superior</option>
        <option value="center">Centro</option>
        <option value="bottom">Inferior</option>
      </select>
    </div>

    <div className="form-group">
      <label>Posición horizontal</label>
      <select
        value={horizontalPosition || 'center'}
        onChange={(e) => onChange({ horizontalPosition: e.target.value })}
      >
        <option value="left">Izquierda</option>
        <option value="center">Centro</option>
        <option value="right">Derecha</option>
      </select>
    </div>
  </div>
);

// Modal para agregar componente
const AddComponentModal: React.FC<{
  pageType: PageType;
  onAdd: (type: ComponentType, name: string) => void;
  onClose: () => void;
}> = ({ pageType, onAdd, onClose }) => {
  const [selectedType, setSelectedType] = useState<ComponentType>('text');
  const [componentName, setComponentName] = useState('');

  const componentTypes = [
    { type: 'text' as ComponentType, label: 'Texto', icon: <Type size={20} /> },
    { type: 'image' as ComponentType, label: 'Imagen', icon: <Image size={20} /> },
    { type: 'signature' as ComponentType, label: 'Firma', icon: <FileSignature size={20} /> }
  ];

  const presetNames = {
    text: ['autor', 'subtitulo', 'dedicatoria_custom', 'nota'],
    image: ['logo', 'sello', 'decoracion'],
    signature: ['creado_con', 'firma_digital']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (componentName.trim()) {
      onAdd(selectedType, componentName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Agregar Componente</h3>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Tipo de componente</label>
            <div className="component-type-selector">
              {componentTypes.map((type) => (
                <button
                  key={type.type}
                  type="button"
                  className={`type-option ${selectedType === type.type ? 'selected' : ''}`}
                  onClick={() => setSelectedType(type.type)}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Nombre del componente</label>
            <input
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              placeholder="Ej: autor, logo, subtitulo..."
              required
            />
          </div>

          <div className="form-group">
            <label>Nombres sugeridos:</label>
            <div className="preset-names">
              {presetNames[selectedType].map((name) => (
                <button
                  key={name}
                  type="button"
                  className="preset-name"
                  onClick={() => setComponentName(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Agregar Componente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComponentsPanel;