import React, { useState } from 'react';
import { 
  Plus,
  Type,
  Image,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ComponentConfig, TextComponentConfig, ImageComponentConfig, COMPONENT_PRESETS } from '../../../../types/styleConfig';

interface ComponentsPanelProps {
  components: ComponentConfig[];
  selectedComponentId?: string;
  onAddComponent: (component: ComponentConfig) => void;
  onUpdateComponent: (componentId: string, updates: Partial<ComponentConfig>) => void;
  onDeleteComponent: (componentId: string) => void;
  onSelectComponent: (componentId: string | null) => void;
  pageType: 'cover' | 'page' | 'dedicatoria';
}

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (component: ComponentConfig) => void;
  pageType: 'cover' | 'page' | 'dedicatoria';
}

const AddComponentModal: React.FC<AddComponentModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  pageType 
}) => {
  const [selectedType, setSelectedType] = useState<'text' | 'image'>('text');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    let component: ComponentConfig;
    const id = `component_${Date.now()}`;

    if (selectedType === 'text') {
      if (selectedPreset && COMPONENT_PRESETS.text[selectedPreset as keyof typeof COMPONENT_PRESETS.text]) {
        const preset = COMPONENT_PRESETS.text[selectedPreset as keyof typeof COMPONENT_PRESETS.text];
        component = {
          id,
          type: 'text',
          name: customName || preset.name,
          content: preset.content,
          position: preset.position,
          horizontalPosition: preset.horizontalPosition,
          style: preset.style,
          visible: true,
          zIndex: 10
        } as TextComponentConfig;
      } else {
        component = {
          id,
          type: 'text',
          name: customName || 'Texto personalizado',
          content: 'Nuevo texto',
          position: 'center',
          horizontalPosition: 'center',
          style: {
            fontSize: '1.5rem',
            fontFamily: 'Inter, sans-serif',
            color: '#ffffff',
            textAlign: 'center'
          },
          visible: true,
          zIndex: 10
        } as TextComponentConfig;
      }
    } else {
      if (selectedPreset && COMPONENT_PRESETS.image[selectedPreset as keyof typeof COMPONENT_PRESETS.image]) {
        const preset = COMPONENT_PRESETS.image[selectedPreset as keyof typeof COMPONENT_PRESETS.image];
        component = {
          id,
          type: 'image',
          name: customName || preset.name,
          imageType: preset.imageType,
          size: preset.size,
          objectFit: preset.objectFit,
          position: preset.position,
          horizontalPosition: preset.horizontalPosition,
          style: preset.style,
          visible: true,
          zIndex: 10
        } as ImageComponentConfig;
      } else {
        component = {
          id,
          type: 'image',
          name: customName || 'Imagen personalizada',
          imageType: 'fixed',
          size: 'medium',
          objectFit: 'cover',
          position: 'center',
          horizontalPosition: 'center',
          visible: true,
          zIndex: 10
        } as ImageComponentConfig;
      }
    }

    onAdd(component);
    onClose();
    setSelectedPreset('');
    setCustomName('');
  };

  const getPresetsForType = () => {
    if (selectedType === 'text') {
      return Object.entries(COMPONENT_PRESETS.text);
    }
    return Object.entries(COMPONENT_PRESETS.image);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Agregar Componente
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selector de tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de componente
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedType('text')}
                className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                  selectedType === 'text'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Type className="w-6 h-6" />
                Texto
              </button>
              <button
                onClick={() => setSelectedType('image')}
                className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors ${
                  selectedType === 'image'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Image className="w-6 h-6" />
                Imagen
              </button>
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plantillas predefinidas
            </label>
            <div className="space-y-2">
              {getPresetsForType().map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(selectedPreset === key ? '' : key)}
                  className={`w-full text-left p-3 border rounded-lg transition-colors ${
                    selectedPreset === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  {selectedType === 'text' && 'content' in preset && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {preset.content}
                    </div>
                  )}
                  {selectedType === 'image' && 'imageType' in preset && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {preset.imageType === 'fixed' ? 'Imagen fija' : 'Imagen dinámica (usuario)'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre personalizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre personalizado (opcional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nombre del componente..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  components,
  selectedComponentId,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
  onSelectComponent,
  pageType
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const toggleExpanded = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const handleToggleVisibility = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      onUpdateComponent(componentId, { visible: !component.visible });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Componentes
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {components.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay componentes agregados</p>
          <p className="text-sm">Haz click en "Agregar" para crear uno</p>
        </div>
      ) : (
        <div className="space-y-2">
          {components.map((component) => {
            const isExpanded = expandedComponents.has(component.id);
            const isSelected = selectedComponentId === component.id;

            return (
              <div
                key={component.id}
                className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
                  isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div 
                    className="flex items-center gap-2 flex-1"
                    onClick={() => onSelectComponent(component.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(component.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {component.type === 'text' ? (
                      <Type className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Image className="w-4 h-4 text-green-500" />
                    )}

                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {component.name}
                    </span>

                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      component.type === 'text'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {component.type === 'text' ? 'Texto' : 'Imagen'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(component.id);
                      }}
                      className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600"
                    >
                      {component.visible ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteComponent(component.id);
                      }}
                      className="p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Posición:</span> {component.position} / {component.horizontalPosition}
                      </div>
                      
                      {component.type === 'text' && (
                        <div>
                          <span className="font-medium">Contenido:</span> {(component as TextComponentConfig).content}
                        </div>
                      )}
                      
                      {component.type === 'image' && (
                        <div>
                          <span className="font-medium">Tipo:</span> {
                            (component as ImageComponentConfig).imageType === 'fixed' 
                              ? 'Imagen fija' 
                              : 'Imagen dinámica (usuario)'
                          }
                        </div>
                      )}

                      <button
                        onClick={() => onSelectComponent(component.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar estilos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddComponentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddComponent}
        pageType={pageType}
      />
    </div>
  );
};

export default ComponentsPanel;