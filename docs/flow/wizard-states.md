# Modelo de Estados del Wizard

Este documento describe el sistema de estados que gestiona el avance del usuario durante la creación de un cuento.

## Estados disponibles

Cada etapa del asistente puede encontrarse en uno de los siguientes estados:

- `no_iniciada`
- `borrador`
- `completado`

```ts
export type EtapaEstado = 'no_iniciada' | 'borrador' | 'completado';
```

La estructura completa del flujo se define mediante la interfaz `EstadoFlujo`:

```ts
export interface EstadoFlujo {
  personajes: {
    estado: EtapaEstado;
    personajesAsignados: number;
  };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
}
```

## Reglas principales

1. **Transiciones válidas**
   - No se puede avanzar a una etapa si la anterior no está en estado `completado`.
   - Al asignar los tres personajes se marca automáticamente la etapa de personajes como `completado`.
2. **Persistencia**
   - El flujo se mantiene en el store `zustand` y se sincroniza con la columna `wizard_state` de la tabla `stories`.
   - Cada actualización del cuento envía el estado completo a Supabase.
3. **Carga de datos**
   - Al montar el wizard se intenta restaurar primero desde `localStorage` (backup o borrador principal).
   - Si no existe información local se consulta la BD y se aplica el `wizard_state` guardado.
4. **Solo avance**
   - Una etapa marcada como `completado` no regresa a `borrador` salvo que el usuario cambie los datos correspondientes.

## Persistencia en Supabase

Al crear una historia (al presionar **Nuevo cuento** en el dashboard) el campo `wizard_state` se inicializa con el siguiente JSON por defecto:

```json
{
  "1.personajes": { "estado": "no_iniciada", "personajesAsignados": 0 },
  "2.cuento": "no_iniciada",
  "3.diseno": "no_iniciada",
  "4.vistaPrevia": "no_iniciada"
}
```

Un trigger `enforce_wizard_state_trigger` valida cada actualización y evita retrocesos o saltos de etapa. Si una transición no es secuencial la operación se cancela.

## Uso

El store `useWizardFlowStore` expone acciones para actualizar cada etapa y avanzar o retroceder entre ellas.

```ts
const { estado, setPersonajes, avanzarEtapa, regresarEtapa, resetEstado } = useWizardFlowStore();
```

Además, el store mantiene `currentStoryId` para identificar el borrador activo y evitar registros de log sin contexto.

Estas acciones pueden integrarse en los componentes del wizard para mantener el seguimiento del flujo de creación.

