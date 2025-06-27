import React from 'react';
import { DedicatoriaConfig } from '../../../../types/styleConfig';

interface DedicatoriaImagePanelProps {
  config: DedicatoriaConfig;
  onChange: (updates: Partial<DedicatoriaConfig>) => void;
}

const DedicatoriaImagePanel: React.FC<DedicatoriaImagePanelProps> = ({
  config,
  onChange
}) => {
  const updateConfig = (updates: Partial<DedicatoriaConfig>) => {
    onChange(updates);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Configuración de Imagen del Usuario
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Estas configuraciones controlan cómo se muestran las imágenes que suben los usuarios en sus dedicatorias.
        </p>

        {/* Tamaño de imagen por defecto */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tamaño de imagen por defecto
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Los usuarios verán esta configuración y no podrán cambiarla
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'pequena' as const, label: 'Pequeña', description: '80x80px' },
              { value: 'mediana' as const, label: 'Mediana', description: '128x128px' },
              { value: 'grande' as const, label: 'Grande', description: '160x160px' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateConfig({ imageSize: option.value })}
                className={`p-3 text-sm rounded-lg border transition-colors ${
                  config.imageSize === option.value
                    ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-400 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Posiciones permitidas */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Posiciones permitidas para la imagen
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Los usuarios solo podrán elegir entre estas opciones
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'imagen-arriba' as const, label: 'Arriba del texto' },
              { value: 'imagen-abajo' as const, label: 'Abajo del texto' },
              { value: 'imagen-izquierda' as const, label: 'Izquierda del texto' },
              { value: 'imagen-derecha' as const, label: 'Derecha del texto' }
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.allowedLayouts.includes(option.value)}
                  onChange={(e) => {
                    const newLayouts = e.target.checked
                      ? [...config.allowedLayouts, option.value]
                      : config.allowedLayouts.filter(layout => layout !== option.value);
                    updateConfig({ allowedLayouts: newLayouts });
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Alineaciones permitidas */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Alineaciones permitidas para el texto
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Los usuarios solo podrán elegir entre estas opciones
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'izquierda' as const, label: 'Izquierda' },
              { value: 'centro' as const, label: 'Centro' },
              { value: 'derecha' as const, label: 'Derecha' }
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.allowedAlignments.includes(option.value)}
                  onChange={(e) => {
                    const newAlignments = e.target.checked
                      ? [...config.allowedAlignments, option.value]
                      : config.allowedAlignments.filter(alignment => alignment !== option.value);
                    updateConfig({ allowedAlignments: newAlignments });
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Vista previa de configuración */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            Resumen de configuración
          </h4>
          <div className="text-xs space-y-1">
            <div className="text-gray-600 dark:text-gray-400">
              <strong>Tamaño:</strong> {config.imageSize === 'pequena' ? 'Pequeña' : config.imageSize === 'mediana' ? 'Mediana' : 'Grande'}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              <strong>Posiciones:</strong> {config.allowedLayouts.length} opciones disponibles
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              <strong>Alineaciones:</strong> {config.allowedAlignments.length} opciones disponibles
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DedicatoriaImagePanel;