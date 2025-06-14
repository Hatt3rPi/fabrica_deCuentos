# Flujo del Wizard

Este documento resume cómo se controlan las etapas del asistente de creación de cuentos.

## Estado centralizado

`useWizardFlowStore` define el tipo `EstadoFlujo` para cada etapa del wizard:

```ts
export interface EstadoFlujo {
  personajes: { estado: EtapaEstado; personajesAsignados: number };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
}
```

Cada etapa puede estar en `no_iniciada`, `borrador` o `completado`. Las transiciones se realizan mediante las acciones del store (`avanzarEtapa`, `regresarEtapa`, `setPersonajes`).

### Reglas principales

1. **Secuencialidad**. No se puede avanzar si la etapa anterior no está marcada como `completado`.
2. **Auto‑avance**. Al completar una etapa la siguiente pasa automáticamente a `borrador`.
3. **Persistencia**. El estado se guarda en Supabase y se respalda en `localStorage` utilizando el hook `useAutosave`.
4. **Edición previa**. Si una etapa anterior se modifica, las siguientes regresan a `borrador`.

## Limpieza controlada

El store incluye la bandera `skipCleanup` para indicar si debe omitirse la eliminación automática del borrador al salir del wizard. Se usa cuando el usuario edita un personaje fuera del asistente.

```ts
const { skipCleanup, setSkipCleanup } = useWizardFlowStore();
```

Al navegar para editar un personaje se llama `setSkipCleanup(true)` y al volver se restablece a `false`.

## Registro de operaciones

Las funciones de autosave y limpieza escriben mensajes en la consola para
informar cuándo se envían datos a Supabase y si la operación fue exitosa
o produjo un error. En cada mensaje se muestra el identificador de la
historia (los últimos seis caracteres) para distinguir fácilmente qué
borrador está en uso. Esto facilita depurar problemas de sincronización.
