import React from 'react';

interface DedicatoriaTextEditorProps {
  text: string;
  isDisabled: boolean;
  onTextChange: (text: string) => void;
}

const DedicatoriaTextEditor: React.FC<DedicatoriaTextEditorProps> = ({
  text,
  isDisabled,
  onTextChange
}) => {
  const ejemplosDedicatoria = [
    "Para mi hijo Juan, con todo mi amor",
    "Dedicado a mi pequeña aventurera",
    "Para la luz de mis ojos",
    "Con amor infinito para mi tesoro",
    "Para quien llena mis días de alegría"
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Mensaje de Dedicatoria
      </h3>
      
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={isDisabled ? "No hay texto de dedicatoria" : "Escribe tu mensaje personal..."}
        maxLength={300}
        disabled={isDisabled}
        className={`w-full p-3 border rounded-lg resize-none
                  ${isDisabled
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  }`}
        rows={4}
      />
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-gray-500">
          {text.length}/300 caracteres
        </span>
      </div>

      {/* Ejemplos de dedicatoria */}
      {!isDisabled && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ejemplos:</p>
          <div className="space-y-1">
            {ejemplosDedicatoria.map((ejemplo, index) => (
              <button
                key={index}
                onClick={() => onTextChange(ejemplo)}
                disabled={isDisabled}
                className={`block text-sm text-left
                          ${isDisabled
                            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300'
                          }`}
              >
                "{ejemplo}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DedicatoriaTextEditor;