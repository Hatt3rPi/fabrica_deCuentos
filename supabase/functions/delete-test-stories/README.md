# Eliminación de Historias de Prueba

Esta Edge Function se encarga de eliminar todas las historias de un usuario de prueba y sus datos relacionados, incluyendo imágenes almacenadas. Está diseñada para ser utilizada durante las pruebas automatizadas con Cypress.

## Configuración

### Variables de entorno necesarias:

- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio de Supabase con permisos de administrador
- `CLEANUP_API_KEY`: Clave secreta para autenticar las llamadas a la función

### Configuración en Supabase:

1. Ve a la sección de Edge Functions en el panel de control de Supabase
2. Crea una nueva función llamada `delete-test-stories`
3. Establece el tiempo de espera máximo (sugerido: 60 segundos)
4. Configura las variables de entorno necesarias

## Uso

### Llamada a la API:

```http
POST /functions/v1/delete-test-stories
Authorization: Bearer <CLEANUP_API_KEY>
Content-Type: application/json

{
  "email": "usuario@ejemplo.com"
}
```

### Parámetros:

- `email` (requerido): Correo electrónico del usuario cuyas historias se desean eliminar

### Respuesta exitosa (200 OK):

```json
{
  "success": true,
  "deletedStories": 5,
  "deletedImages": 12,
  "userId": "usuario-uuid"
}
```

### Posibles códigos de error:

- `400`: Error en la solicitud (faltan parámetros, formato incorrecto, etc.)
- `401`: No autorizado (clave API incorrecta o faltante)
- `404`: Usuario no encontrado
- `500`: Error interno del servidor

## Uso con Cypress

La función está diseñada para ser utilizada con el comando personalizado `cy.cleanupTestStories()` en las pruebas de Cypress.

Ejemplo:

```javascript
// En un hook before o after
afterEach(() => {
  // Limpiar historias después de cada prueba
  cy.cleanupTestStories('usuario@ejemplo.com');
});
```

## Funcionamiento

La función ahora elimina completamente una historia y todos sus datos relacionados:

1. Busca todas las historias del usuario especificado
2. Para cada historia, utiliza la función RPC `delete_full_story` que:
   - Elimina registros en `story_pages`
   - Elimina registros en `story_designs`
   - Elimina relaciones en `story_characters`
   - Elimina personajes huérfanos (no utilizados en otras historias)
   - Elimina la historia en sí
   - Devuelve URLs de imágenes e IDs de personajes para limpieza de almacenamiento
3. Elimina las imágenes asociadas a las historias y personajes de los buckets de almacenamiento:
   - Procesa las URLs de imágenes para extraer bucket y ruta
   - Elimina archivos de imágenes de personajes en varios buckets
   - Limpia carpetas de usuario en todos los buckets configurados
4. Todo se ejecuta dentro de una transacción atómica para garantizar la integridad de los datos

## Buckets de almacenamiento limpiados

La función limpia imágenes y archivos de los siguientes buckets:

- `storage` - Bucket general de almacenamiento
- `reference-images` - Imágenes de referencia de personajes
- `character-images` - Imágenes de personajes
- `fabricacuentos` - Bucket principal de la aplicación

## Consideraciones de seguridad

- La función solo debe estar disponible en entornos de desarrollo y pruebas
- Utiliza autenticación por token para prevenir accesos no autorizados
- Registra todas las operaciones realizadas para facilitar la depuración
- No exponga la `CLEANUP_API_KEY` en el código del cliente
- Las operaciones de eliminación se realizan con el rol de servicio que tiene permisos elevados
