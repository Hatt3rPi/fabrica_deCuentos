# Modelo de Estados del Wizard

Este documento explica la estructura del campo `wizard_state` y las reglas que gestiona el avance del usuario durante la creación de un cuento.

## Estados disponibles

Cada etapa del asistente se encuentra en uno de los siguientes estados:

- `no_iniciada`
- `borrador`
- `completado`

```ts
export type EtapaEstado = 'no_iniciada' | 'borrador' | 'completado';
```

La estructura completa del flujo es la siguiente:

```ts
export interface WizardState {
  '1.personajes': { estado: EtapaEstado; personajesAsignados: number };
  '2.cuento': { estado: EtapaEstado };
  '3.diseno': { estado: EtapaEstado };
  '4.vistaPrevia': { estado: EtapaEstado };
}
```

Al crear un cuento se inicializa con todas las etapas en `no_iniciada` y `personajesAsignados` en `0`.

## Reglas principales

1. **Transiciones válidas**
   - No se avanza a una etapa si la anterior no está en `completado`.
   - Asignar personajes cambia la etapa a `borrador` y el botón "Siguiente" la marca como `completado` cuando hay 3 personajes.
2. **Persistencia**
   - El estado se guarda en la columna `wizard_state` de `stories` y opcionalmente se cachea de manera local.
   - Las funciones `actualizarWizardState` y `continuarCuento` del módulo `wizardManager` son las únicas encargadas de mutar este valor.
3. **Reanudación**
   - `continuarCuento(storyId)` consulta la BD y devuelve la primera etapa en `borrador` para redirigir la interfaz.
4. **Solo avance**
   - Una vez que una etapa queda en `completado` no se puede volver atrás.

## Uso desde código

```ts
import { actualizarWizardState, continuarCuento } from '@/services/wizardManager';

await actualizarWizardState(storyId, 'siguiente_cuento');
const etapa = await continuarCuento(storyId);
```

La lógica de validación y sincronización está centralizada en el módulo para mantener coherencia entre clientes y evitar saltos de etapa.
