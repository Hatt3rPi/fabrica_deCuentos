# 📈 Panel de Analytics en Tiempo Real

Este documento describe la funcionalidad de monitoreo implementada para seguir el flujo de generación de contenido en vivo. Forma parte de la issue [LAC-79](https://linear.app/lacuenteria/issue/LAC-79/analytics-irt).

## Tabla `inflight_calls`

La tabla almacena las llamadas a las funciones Edge que están en ejecución:

```sql
create table inflight_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  etapa text,
  actividad text,
  modelo text,
  input jsonb,
  inicio timestamptz default now()
);
```

Cada registro se crea al iniciar una función y se elimina una vez finalizada. De esta forma sólo se guardan las llamadas en curso.

## Helpers para funciones Edge

El archivo `supabase/functions/_shared/inflight.ts` provee dos utilidades:

```ts
startInflightCall({ user_id, etapa, actividad, modelo, input })
endInflightCall(user_id, actividad)
```

Las funciones Edge deben invocarlas al comenzar y al terminar. Por ejemplo, en `analyze-character`:

```ts
await startInflightCall({
  user_id: userId,
  etapa: 'personajes',
  actividad: 'generar_descripcion',
  modelo: apiModel,
  input: { imageUrl, name, age }
});

...// lógica principal

await endInflightCall(userId, 'generar_descripcion');
```

## Suscripciones en el Frontend

El helper `subscribeToInflight` (ubicado en `src/lib/supabase/realtime.ts`) permite escuchar cambios en `inflight_calls` para actualizar el panel en vivo:

```ts
const unsub = subscribeToInflight(loadInflight);
```

Cada inserción o eliminación en la tabla dispara una recarga de datos.

## Componente `StageActivityCard`

El componente `StageActivityCard` muestra el estado de cada actividad. Indica si está **activada** o **desactivada**, el número de llamadas activas y un resumen de las métricas de los últimos 10 minutos:

```tsx
<StageActivityCard
  label="Generar descripción"
  enabled={settings.personajes.generar_descripcion}
  inflight={inflightCount}
  stats={{ total: 3, errorRate: 0.33, errors: { service_error: 1 } }}
  onToggle={(value) => toggle('personajes', 'generar_descripcion', value)}
/>

La propiedad `stats` se obtiene consultando `prompt_metrics` para los últimos 10 minutos y
muestra el número total de llamadas, la tasa de errores y el desglose por tipo de error.
```

## Página `/admin/flujo`

La página reúne todas las actividades agrupadas por etapa y utiliza `subscribeToInflight` junto con un pequeño _polling_ cada segundo para mantener los números actualizados. Los estados de activación se guardan en `system_settings` bajo la clave `stages_enabled`.

Cada función Edge consulta este ajuste mediante `isActivityEnabled` antes de ejecutarse para respetar los toggles del panel.

---

Con estos elementos se obtiene un panel que permite monitorizar el avance de las funciones de IA y habilitar o deshabilitar partes del flujo según sea necesario.
