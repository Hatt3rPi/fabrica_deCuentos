# 🎛️ StageActivityCard

Tarjeta utilizada en el panel de administración para controlar cada actividad del flujo.

## 📋 Descripción

Muestra el nombre de la actividad, la función asociada y un toggle para activarla o desactivarla. Además indica el número de llamadas activas y estadísticas de los últimos 10 minutos.

## 🔧 Props

```typescript
interface ActivityStats {
  total: number;
  errorRate: number;
  errors: Record<string, number>;
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

El componente recibe `stats` con el total de llamadas registradas en `prompt_metrics` durante los últimos 10 minutos, la tasa de error y un desglose por tipo de error.
