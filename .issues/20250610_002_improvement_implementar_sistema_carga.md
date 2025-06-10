# 🎨 Implementar sistema de carga (overlay + spinner + mensajes) para todas las etapas

## 📌 Contexto
Necesitamos mejorar la experiencia de usuario durante los procesos de carga en La Cuentería mostrando un overlay con feedback visual (spinner) y mensajes temáticos que informen al usuario sobre el progreso de las operaciones asíncronas.

## 🎯 Objetivo
Crear un sistema de carga unificado que se integre en las 4 etapas principales del flujo de creación de cuentos, mejorando la percepción de rendimiento y proporcionando retroalimentación clara al usuario.

## 📋 Especificaciones Técnicas

### 1. Estructura de Datos
```typescript
// src/config/loaderMessages.ts
type Etapa = 'personajes' | 'cuento_fase1' | 'cuento_fase2' | 'vista_previa';

interface LoaderMessage {
  id: string;
  text: string; // Puede contener placeholders como {personaje}
  etapa: Etapa[]; // Etapas donde se puede mostrar este mensaje
}

const loaderMessages: LoaderMessage[] = [
  {
    id: 'personaje_creando',
    text: 'Dando vida a {personaje} con magia digital... ✨',
    etapa: ['personajes']
  },
  // Más mensajes...
];

export function getLoaderMessages(etapa: Etapa, context: Record<string, string> = {}): string[] {
  return loaderMessages
    .filter(m => m.etapa.includes(etapa))
    .map(m => {
      return Object.entries(context).reduce(
        (msg, [key, value]) => msg.replace(`{${key}}`, value),
        m.text
      );
    });
}
```

### 2. Componente Principal
```tsx
// src/components/ui/Loader/OverlayLoader.tsx
interface OverlayLoaderProps {
  etapa: Etapa;
  context?: Record<string, string>;
  timeoutMs?: number;
  onTimeout?: () => void;
  onCancel?: () => void;
  progress?: { current: number; total: number };
}
```

### 3. Comportamiento
- **Rotación de mensajes**: Cambiar cada 6-8 segundos
- **Timeout**: Mostrar mensaje especial después de 40s
- **Accesibilidad**: Soporte completo para lectores de pantalla
- **Responsive**: Funciona en móvil y escritorio

## ✅ Criterios de Aceptación

### Almacenamiento de Mensajes
- [ ] Mensajes centralizados en `src/config/loaderMessages.ts`
- [ ] Soporte para interpolación de variables
- [ ] Tipado TypeScript completo

### Componente OverlayLoader
- [ ] Overlay semitransparente con z-index adecuado
- [ ] Spinner animado centrado
- [ ] Rotación automática de mensajes
- [ ] Manejo de timeout configurable
- [ ] Indicador de progreso opcional
- [ ] Botón de cancelación con callback

### Integración
- [ ] Implementado en las 4 etapas principales:
  - [ ] Personajes - Generación de personajes
  - [ ] Cuento - Generación de texto (fase 1)
  - [ ] Cuento - Generación de portada (fase 2)
  - [ ] Diseño - carga de portada
  - [ ] Cuento - Vista previa de páginas

### Accesibilidad
- [ ] Soporte para lectores de pantalla (aria-live)
- [ ] Contraste de color WCAG 2.1 AA
- [ ] Manejo de foco accesible
- [ ] Estados de carga semánticos

### Rendimiento
- [ ] Carga perezosa del componente
- [ ] Optimización de animaciones
- [ ] Sin bloqueo del hilo principal

## 📚 Documentación
- [ ] Storybook con ejemplos de uso
- [ ] JSDoc para todas las funciones expuestas
- [ ] Guía de estilos en el README

## 🧪 Testing
- [ ] Tests unitarios para lógica de rotación
- [ ] Tests de integración con las etapas
- [ ] Pruebas de accesibilidad
- [ ] Pruebas de rendimiento

## 📱 Compatibilidad
- [ ] Chrome (últimas 2 versiones)
- [ ] Firefox (últimas 2 versiones)
- [ ] Safari (últimas 2 versiones)
- [ ] Edge (últimas 2 versiones)

