// Re-export the browser's Notification API type
export type { Notification } from 'typescript';

// Tipos relacionados con funcionalidades del navegador
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  platform: string;
}

// Declaración para detectar entorno Cypress
declare global {
  interface Window {
    Cypress?: any;
  }
}