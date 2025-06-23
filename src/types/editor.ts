/**
 * Estado de edición para el editor en tiempo real
 */
export type EditState = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

/**
 * Configuración para el editor en tiempo real
 */
export interface RealTimeEditorConfig {
  /** Delay en ms para auto-save después de parar de escribir */
  autoSaveDelay: number;
  /** Mostrar indicadores visuales de estado */
  showIndicators: boolean;
  /** Permitir edición multiline */
  multiline: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Estado del editor en tiempo real
 */
export interface RealTimeEditorState {
  /** Estado actual del editor */
  editState: EditState;
  /** Texto local (temporal) */
  localText: string;
  /** Texto original (guardado) */
  originalText: string;
  /** Si está en modo edición */
  isEditing: boolean;
  /** Si hay cambios sin guardar */
  hasUnsavedChanges: boolean;
  /** Error message si hay error */
  errorMessage?: string;
}

/**
 * Acciones del editor en tiempo real
 */
export interface RealTimeEditorActions {
  /** Iniciar edición */
  startEditing: () => void;
  /** Actualizar texto local */
  updateText: (text: string) => void;
  /** Guardar texto manualmente */
  saveText: () => Promise<void>;
  /** Cancelar edición */
  cancelEditing: () => void;
  /** Resetear estado de error */
  clearError: () => void;
}

/**
 * Return type del hook useRealTimeEditor
 */
export interface UseRealTimeEditorReturn extends RealTimeEditorState, RealTimeEditorActions {}

/**
 * Props para el componente InlineTextEditor
 */
export interface InlineTextEditorProps {
  /** Texto inicial */
  initialText: string;
  /** Función para guardar texto */
  onSave: (text: string) => Promise<void>;
  /** Configuración del editor */
  config?: Partial<RealTimeEditorConfig>;
  /** Estilos aplicados al texto */
  textStyles?: React.CSSProperties;
  /** Clases CSS adicionales */
  className?: string;
  /** Si el editor está deshabilitado */
  disabled?: boolean;
  /** Callback cuando inicia edición */
  onEditStart?: () => void;
  /** Callback cuando termina edición */
  onEditEnd?: () => void;
}

/**
 * Props para el modal de edición avanzada
 */
export interface AdvancedEditModalProps {
  /** Si el modal está abierto */
  isOpen: boolean;
  /** Función para cerrar modal */
  onClose: () => void;
  /** Datos de la página a editar */
  pageData: {
    id: string;
    text: string;
    prompt: string;
    pageNumber: number;
    imageUrl?: string;
  };
  /** Función para guardar cambios */
  onSave: (updates: { text?: string; prompt?: string }) => Promise<void>;
  /** Función para regenerar imagen con nuevo prompt */
  onRegenerate: (prompt: string) => Promise<void>;
  /** Si está en proceso de regeneración */
  isRegenerating?: boolean;
}