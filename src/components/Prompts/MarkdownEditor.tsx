import React, { useState, useRef } from 'react';
import { Bold, Italic, Code, List, ListOrdered, Quote, Link, Eye, EyeOff } from 'lucide-react';
import MarkdownPreview from './MarkdownPreview';
import { isMarkdown } from '../../utils/markdownHelpers';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe tu prompt aquí...',
  rows = 6,
  className = '',
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detectar si el contenido actual es Markdown
  const hasMarkdownSyntax = isMarkdown(value);

  // Función para insertar texto en la posición del cursor
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);

    // Restaurar el foco y selección
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Botones de la toolbar
  const toolbarButtons = [
    {
      icon: Bold,
      title: 'Negrita',
      action: () => insertText('**', '**', 'texto en negrita'),
    },
    {
      icon: Italic,
      title: 'Cursiva',
      action: () => insertText('*', '*', 'texto en cursiva'),
    },
    {
      icon: Code,
      title: 'Código',
      action: () => insertText('`', '`', 'código'),
    },
    {
      icon: List,
      title: 'Lista con viñetas',
      action: () => insertText('- ', '', 'elemento de lista'),
    },
    {
      icon: ListOrdered,
      title: 'Lista numerada',
      action: () => insertText('1. ', '', 'elemento de lista'),
    },
    {
      icon: Quote,
      title: 'Cita',
      action: () => insertText('> ', '', 'texto de cita'),
    },
    {
      icon: Link,
      title: 'Enlace',
      action: () => insertText('[', '](url)', 'texto del enlace'),
    },
  ];

  return (
    <div className={`border rounded ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              title={button.title}
              className="p-1.5 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <button.icon size={14} />
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicador de Markdown */}
          {hasMarkdownSyntax && (
            <span className="text-xs text-blue-600 font-medium">MD</span>
          )}
          
          {/* Toggle Preview */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
            className={`p-1.5 rounded transition-colors ${
              showPreview
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
            }`}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className={showPreview ? 'grid grid-cols-2' : ''}>
        {/* Editor */}
        <div className={showPreview ? 'border-r' : ''}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 text-sm font-mono resize-none focus:outline-none focus:ring-0 border-0"
            style={{ minHeight: `${rows * 1.5}rem` }}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="p-3 bg-gray-50 overflow-auto" style={{ minHeight: `${rows * 1.5}rem` }}>
            <div className="text-xs text-gray-500 mb-2 font-medium">Vista previa:</div>
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>

      {/* Footer con ayuda */}
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            Soporta Markdown: **negrita**, *cursiva*, `código`, listas, enlaces, etc.
          </span>
          <span className="text-gray-400">
            {value.length} caracteres
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;