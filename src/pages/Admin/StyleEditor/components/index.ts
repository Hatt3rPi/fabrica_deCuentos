// TDD FASE GREEN - Exports para tests de paneles refactorizados

// Usar wrappers TDD para los tests
export { 
  ComponentsPanel,
  PositionPanel, 
  ContainerPanel,
  TypographyPanel
} from './TDDPanelWrappers';

// Exports originales para otros usos
export { default as ColorPanel } from './ColorPanel';
export { default as ComponentRenderer } from './ComponentRenderer';
export { default as StylePreview } from './StylePreview';
export { default as StylePreviewSimple } from './StylePreviewSimple';