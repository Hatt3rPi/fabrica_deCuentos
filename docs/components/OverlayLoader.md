# 🔄 OverlayLoader

Componente que muestra un overlay de carga con mensajes rotativos y spinner.

## Props

```typescript
interface OverlayLoaderProps {
  etapa: Etapa;
  context?: Record<string, string>;
  timeoutMs?: number;
  onTimeout?: () => void;
  onCancel?: () => void;
  onFallback?: () => void;
  fallbackDelayMs?: number;
  progress?: { current: number; total: number };
}
```

- **etapa**: etapa del flujo para filtrar los mensajes.
- **context**: variables para interpolar en los mensajes.
- **timeoutMs**: tiempo máximo antes de disparar `onTimeout`.
- **onCancel**: callback para cancelar la operación.
- **onFallback**: se ejecuta al superar el tiempo máximo absoluto (60s por defecto).
- **fallbackDelayMs**: tiempo en milisegundos para `onFallback`.
- **progress**: objeto con el progreso actual y total.

El componente utiliza `aria-live="polite"` para informar a lectores de pantalla y es totalmente responsive.
