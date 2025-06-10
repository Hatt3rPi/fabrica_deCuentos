# Wizard Manager

Este servicio centraliza la actualización del campo `wizard_state` de los cuentos.

## Funciones

### `actualizarWizardState(storyId, accion)`
Aplica las reglas de transición y sincroniza el estado con la base de datos y la cache local.

### `continuarCuento(storyId)`
Lee el estado guardado y devuelve la clave de la primera etapa en estado `borrador` para reanudar el flujo.

## Cache local

Los estados se escriben en la carpeta `.cache` del proyecto. Si la lectura falla se consulta la base de datos.
