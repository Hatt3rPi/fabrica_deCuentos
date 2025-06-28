/**
 * Hook useUIProtection
 * 
 * Aplica protecciones globales de UI para prevenir acciones no autorizadas
 * como descarga de imágenes, screenshots, inspect element, etc.
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

interface UIProtectionOptions {
  disableRightClick?: boolean;
  disableDevTools?: boolean;
  disableTextSelection?: boolean;
  disableDragDrop?: boolean;
  disableImageSave?: boolean;
  disablePrintScreen?: boolean;
  showWarnings?: boolean;
}

const DEFAULT_OPTIONS: UIProtectionOptions = {
  disableRightClick: true,
  disableDevTools: true,
  disableTextSelection: false, // No deshabilitamos por defecto para no afectar UX
  disableDragDrop: true,
  disableImageSave: true,
  disablePrintScreen: true,
  showWarnings: true,
};

const useUIProtection = (options: UIProtectionOptions = {}) => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  const devToolsCheckRef = useRef<NodeJS.Timeout>();
  const keySequenceRef = useRef<string[]>([]);

  /**
   * Detecta si las herramientas de desarrollo están abiertas usando múltiples métodos
   */
  const detectDevTools = useCallback((): boolean => {
    // Método 1: Comparar dimensiones de ventana
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    if (widthDiff > threshold || heightDiff > threshold) {
      return true;
    }

    // Método 2: Detectar console activo con timing
    let detected = false;
    const start = performance.now();
    
    try {
      // debugger statement pausará si DevTools están abiertas
      const checkTimer = setTimeout(() => {
        detected = false;
      }, 100);
      
      // eval('debugger'); - comentado para evitar pausas
      
      clearTimeout(checkTimer);
      const elapsed = performance.now() - start;
      
      if (elapsed > 100) {
        detected = true;
      }
    } catch (e) {
      // DevTools pueden estar bloqueando eval
      detected = true;
    }

    // Método 3: Detectar redirection de console (método original mejorado)
    if (!detected) {
      const element = document.createElement('div');
      let consoleDetected = false;
      
      Object.defineProperty(element, 'id', {
        get: function() {
          consoleDetected = true;
          return 'devtools-detector';
        }
      });

      // Usar requestAnimationFrame para hacer menos detectable
      requestAnimationFrame(() => {
        try {
          console.dir(element);
        } catch (e) {
          // Ignorar errores
        }
      });

      detected = consoleDetected;
    }

    // Método 4: Detectar cambios en window.chrome
    if (!detected && typeof window !== 'undefined') {
      const chrome = (window as any).chrome;
      if (chrome && chrome.runtime) {
        // Verificar si hay extensiones de desarrollo activas
        detected = chrome.runtime.onConnect && chrome.runtime.onConnect.hasListeners;
      }
    }

    // Método 5: Detectar firebug
    if (!detected && typeof window !== 'undefined') {
      detected = !!(window as any).firebug || !!(window as any).console?.firebug;
    }

    // Método 6: Performance timing heuristic
    if (!detected) {
      const perfTiming = performance.now();
      const regex = /./;
      regex.toString = function() {
        detected = true;
        return 'devtools-detected';
      };
      
      // Algunos DevTools interceptan regex toString
      setTimeout(() => {
        try {
          console.log(regex);
        } catch (e) {
          // Ignorar errores
        }
      }, 1);
    }

    return detected;
  }, []);

  /**
   * Maneja la detección de herramientas de desarrollo
   */
  const handleDevToolsDetection = useCallback(() => {
    if (!finalOptions.disableDevTools) return;

    const detected = detectDevTools();
    if (detected) {
      if (finalOptions.showWarnings) {
        // Crear overlay de advertencia
        const overlay = document.createElement('div');
        overlay.id = 'dev-tools-warning';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.95);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 18px;
          text-align: center;
        `;
        
        overlay.innerHTML = `
          <div style="max-width: 500px; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h2 style="margin-bottom: 20px; font-size: 24px;">Contenido Protegido</h2>
            <p style="margin-bottom: 30px; line-height: 1.6;">
              Este contenido está protegido. Por favor, cierre las herramientas de desarrollo 
              para continuar navegando.
            </p>
            <p style="color: #888; font-size: 14px;">
              La CuenterIA - Protección de contenido activada
            </p>
          </div>
        `;

        // Remover overlay existente si hay uno
        const existing = document.getElementById('dev-tools-warning');
        if (existing) {
          existing.remove();
        }

        document.body.appendChild(overlay);
        
        logger.warn('Herramientas de desarrollo detectadas');
      }
    } else {
      // Remover overlay si las dev tools se cerraron
      const overlay = document.getElementById('dev-tools-warning');
      if (overlay) {
        overlay.remove();
      }
    }
  }, [finalOptions.disableDevTools, finalOptions.showWarnings, detectDevTools]);

  /**
   * Previene el menú contextual (right-click)
   */
  const preventContextMenu = useCallback((e: MouseEvent) => {
    if (finalOptions.disableRightClick) {
      e.preventDefault();
      e.stopPropagation();
      
      if (finalOptions.showWarnings) {
        // Mostrar tooltip temporal
        showTemporaryMessage('Menú contextual deshabilitado', e.clientX, e.clientY);
      }
    }
  }, [finalOptions.disableRightClick, finalOptions.showWarnings]);

  /**
   * Previene arrastrar y soltar
   */
  const preventDragDrop = useCallback((e: DragEvent) => {
    if (finalOptions.disableDragDrop) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [finalOptions.disableDragDrop]);

  /**
   * Previene atajos de teclado peligrosos
   */
  const preventKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    // Secuencias de teclas a bloquear
    const blockedCombinations = [
      // DevTools
      ['F12'],
      ['Control', 'Shift', 'I'],
      ['Control', 'Shift', 'J'],
      ['Control', 'Shift', 'C'],
      ['Control', 'U'], // Ver código fuente
      
      // Guardar
      ['Control', 'S'],
      
      // Imprimir (Print Screen se maneja por separado)
      ['Control', 'P'],
    ];

    // Convertir evento a string para comparación
    const pressedKeys = [];
    if (e.ctrlKey) pressedKeys.push('Control');
    if (e.shiftKey) pressedKeys.push('Shift');
    if (e.altKey) pressedKeys.push('Alt');
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
      pressedKeys.push(e.key);
    }

    const currentCombination = pressedKeys.sort().join(',');
    
    for (const blocked of blockedCombinations) {
      const blockedCombination = blocked.sort().join(',');
      if (currentCombination === blockedCombination) {
        e.preventDefault();
        e.stopPropagation();
        
        if (finalOptions.showWarnings) {
          showTemporaryMessage('Acción no permitida');
        }
        
        logger.debug('Blocked keyboard shortcut:', pressedKeys);
        return;
      }
    }

    // Detectar Print Screen (no se puede prevenir, pero sí detectar)
    if (finalOptions.disablePrintScreen && e.key === 'PrintScreen') {
      if (finalOptions.showWarnings) {
        showTemporaryMessage('Captura de pantalla detectada');
      }
      logger.warn('Print screen detected');
    }
  }, [finalOptions.showWarnings, finalOptions.disablePrintScreen]);

  /**
   * Previene selección de texto
   */
  const preventTextSelection = useCallback((e: Event) => {
    if (finalOptions.disableTextSelection) {
      e.preventDefault();
    }
  }, [finalOptions.disableTextSelection]);

  /**
   * Muestra un mensaje temporal en pantalla
   */
  const showTemporaryMessage = useCallback((message: string, x?: number, y?: number) => {
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      position: fixed;
      ${x ? `left: ${x}px;` : 'left: 50%;'}
      ${y ? `top: ${y}px;` : 'top: 50%;'}
      ${!x ? 'transform: translateX(-50%);' : ''}
      ${!y ? 'transform: translateY(-50%);' : ''}
      ${!x && !y ? 'transform: translate(-50%, -50%);' : ''}
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    messageElement.textContent = message;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 2000);
  }, []);

  /**
   * Aplica estilos CSS globales para protección
   */
  const applyGlobalStyles = useCallback(() => {
    const styleId = 'ui-protection-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const styles = [];

    if (finalOptions.disableTextSelection) {
      styles.push(`
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        input, textarea, [contenteditable] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `);
    }

    if (finalOptions.disableDragDrop) {
      styles.push(`
        img {
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
          pointer-events: auto !important;
        }
      `);
    }

    styleElement.textContent = styles.join('\n');
  }, [finalOptions.disableTextSelection, finalOptions.disableDragDrop]);

  /**
   * Configura todas las protecciones
   */
  const setupProtections = useCallback(() => {
    // Aplicar estilos globales
    applyGlobalStyles();

    // Event listeners
    if (finalOptions.disableRightClick) {
      document.addEventListener('contextmenu', preventContextMenu);
    }

    if (finalOptions.disableDragDrop) {
      document.addEventListener('dragstart', preventDragDrop);
      document.addEventListener('drop', preventDragDrop);
    }

    if (finalOptions.disableTextSelection) {
      document.addEventListener('selectstart', preventTextSelection);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', preventKeyboardShortcuts);

    // DevTools detection
    if (finalOptions.disableDevTools) {
      devToolsCheckRef.current = setInterval(handleDevToolsDetection, 1000);
    }

    logger.debug('UI protections activated:', finalOptions);
  }, [
    applyGlobalStyles,
    preventContextMenu,
    preventDragDrop,
    preventTextSelection,
    preventKeyboardShortcuts,
    handleDevToolsDetection,
    finalOptions
  ]);

  /**
   * Limpia todas las protecciones
   */
  const cleanupProtections = useCallback(() => {
    // Remover event listeners
    document.removeEventListener('contextmenu', preventContextMenu);
    document.removeEventListener('dragstart', preventDragDrop);
    document.removeEventListener('drop', preventDragDrop);
    document.removeEventListener('selectstart', preventTextSelection);
    document.removeEventListener('keydown', preventKeyboardShortcuts);

    // Detener detección de DevTools
    if (devToolsCheckRef.current) {
      clearInterval(devToolsCheckRef.current);
    }

    // Remover estilos
    const styleElement = document.getElementById('ui-protection-styles');
    if (styleElement) {
      styleElement.remove();
    }

    // Remover overlay de advertencia
    const overlay = document.getElementById('dev-tools-warning');
    if (overlay) {
      overlay.remove();
    }

    logger.debug('UI protections deactivated');
  }, [preventContextMenu, preventDragDrop, preventTextSelection, preventKeyboardShortcuts]);

  // Setup y cleanup
  useEffect(() => {
    setupProtections();
    return cleanupProtections;
  }, [setupProtections, cleanupProtections]);

  return {
    showTemporaryMessage,
    detectDevTools,
    isProtected: true,
  };
};

export default useUIProtection;