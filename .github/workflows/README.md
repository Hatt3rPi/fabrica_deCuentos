# GitHub Workflows

## Verificación Funcionamiento CORE

Este workflow ejecuta las pruebas críticas de Cypress para verificar el funcionamiento básico de la aplicación.

### Activación Manual

El workflow **NO se ejecuta automáticamente** en push o PR. Debe ser activado manualmente mediante un comentario en el PR.

#### Cómo activar:

1. En cualquier PR, escribe un comentario que contenga: `@QA_lacuenteria`
2. El bot reaccionará con 🚀 y comenzará las pruebas
3. Recibirás notificaciones del progreso:
   - Comentario inicial confirmando el inicio
   - Comentario final con el resultado (✅ éxito / ❌ fallo)

#### Ejemplo:
```
Por favor ejecutar pruebas @QA_lacuenteria
```

### Qué prueba:

- Flujo completo de creación de historia
- Login/logout
- Creación de personajes
- Navegación del wizard
- Generación de contenido

### Artifacts:

Si las pruebas fallan, se suben:
- Screenshots de errores
- Videos de la ejecución

### Requisitos:

- El comentario debe hacerse en un PR (no en issues)
- El usuario debe tener permisos de escritura en el repositorio