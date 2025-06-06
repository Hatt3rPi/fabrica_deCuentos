# 🎛️ StageActivityCard

Tarjeta utilizada en el panel de administración para controlar cada actividad del flujo.

## 📋 Descripción

Muestra el nombre de la actividad, la función asociada y un toggle para activarla o desactivarla. Además indica el número de llamadas activas y un gráfico del rendimiento de la última hora.

## 🔧 Props

```typescript
interface ActivityPoint {
  time: string;
  success: number;
  error: number;
}

interface ActivityStats {
  total: number;
  errorRate: number;
  timeline: ActivityPoint[];
}

interface Props {
  label: string;
  fn: string;
  enabled: boolean;
  inflight: number;
  stats?: ActivityStats;
  onToggle: (value: boolean) => void;
}
```

## 📈 Métricas

`stats` incluye la serie temporal de la última hora con los éxitos y errores por minuto. El componente utiliza `StackedAreaChart` de `recharts` para mostrar esta información.
