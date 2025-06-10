# 🔄 OverlayLoader

Componente que muestra un overlay de carga con mensajes rotativos y spinner.

## Props

```typescript
interface OverlayLoaderProps {
  etapa: Etapa;
  context?: Record<string, any>;
  /** Lista de mensajes personalizados a rotar */
  messages?: string[];
  timeoutMs?: number;
  onTimeout?: () => void;
  onCancel?: () => void;
  onFallback?: () => void;
  fallbackDelayMs?: number;
  progress?: { current: number; total: number };
}
```

- **etapa**: etapa del flujo para filtrar los mensajes.
- **context**: variables para interpolar en los mensajes. Si incluye `personajes` como array, se activará la variante `_multi` y se formatearán los nombres de manera adecuada.
- **messages**: lista de textos personalizados que reemplazan a los de `loaderMessages`.
- **timeoutMs**: tiempo máximo antes de disparar `onTimeout`.
- **onCancel**: callback para cancelar la operación.
- **onFallback**: se ejecuta al superar el tiempo máximo absoluto (60s por defecto).
- **fallbackDelayMs**: tiempo en milisegundos para `onFallback`.
- **progress**: objeto con el progreso actual y total.

El componente utiliza `aria-live="polite"` para informar a lectores de pantalla y es totalmente responsive.

Cuando se utilice la variante `_multi`, el placeholder `{personajes}` se reemplazará automáticamente por una lista como `Luna y Sol` o `Luna, Sol y Estrella`.
