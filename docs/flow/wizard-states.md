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
   - El estado se guarda con `zustand` utilizando `localStorage`, permitiendo reanudar el progreso al volver a la aplicación.
3. **Carga de datos**
   - Al continuar desde el inicio se identifica la primera etapa en `borrador` y se navega a ella cargando la información guardada.

## Uso

El store `useWizardFlowStore` expone acciones para actualizar cada etapa y avanzar o retroceder entre ellas.

```ts
const { estado, setPersonajes, avanzarEtapa, regresarEtapa, resetEstado } = useWizardFlowStore();
```

Estas acciones pueden integrarse en los componentes del wizard para mantener el seguimiento del flujo de creación.

