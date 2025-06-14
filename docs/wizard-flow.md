# 🧙‍♂️ Flujo del Wizard

Este documento resume el funcionamiento de la máquina de estados que controla el asistente de creación de historias.

## Estados

Cada etapa puede estar en uno de los siguientes estados:

- `no_iniciada`
- `borrador`
- `completado`

La estructura completa se define con la interfaz `EstadoFlujo` mantenida en `zustand`.

```ts
export interface EstadoFlujo {
  personajes: { estado: EtapaEstado; personajesAsignados: number };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
}
```

## Reglas de transición

1. No se puede avanzar si la etapa anterior no está `completado`.
2. Al completar una etapa, la siguiente pasa automáticamente a `borrador`.
3. Modificar datos de una etapa previa vuelve las posteriores a `borrador`.
4. El estado se guarda en Supabase con autosave y se respalda en `localStorage`.

## Pausa del asistente

Al editar un personaje fuera del wizard se marca `skipCleanup` en el store para evitar borrar el borrador al salir. Esta bandera se reinicia al volver al asistente.
