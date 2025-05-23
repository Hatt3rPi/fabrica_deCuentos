# Configuración de Supabase Storage para Imágenes de Respaldo

Este documento proporciona instrucciones para configurar Supabase Storage para almacenar las imágenes de respaldo por estilo visual.

## Estructura de Buckets

Se recomienda la siguiente estructura de buckets en Supabase Storage:

```
storage/
└── fallback-images/
    ├── acuarela-digital.webp
    ├── dibujado-a-mano.webp
    ├── recortes-de-papel.webp
    └── kawaii.webp
```

## Pasos para la Configuración

### 1. Crear el Bucket

1. Accede al panel de administración de Supabase
2. Navega a la sección "Storage"
3. Haz clic en "Create a new bucket"
4. Nombre del bucket: `fallback-images`
5. Tipo de acceso: Privado (recomendado para control de acceso)
6. Haz clic en "Create bucket"

### 2. Configurar Políticas de Acceso

Para permitir el acceso público a las imágenes de respaldo:

1. Selecciona el bucket `fallback-images`
2. Ve a la pestaña "Policies"
3. Haz clic en "Add Policy"
4. Configura una política para permitir acceso de lectura pública:
   - Policy name: `public_read`
   - Allowed operation: `SELECT`
   - Policy definition: `true` (para permitir acceso a todos)
   - Policy execution: `Before`
5. Haz clic en "Save policy"

### 3. Subir las Imágenes

1. Selecciona el bucket `fallback-images`
2. Haz clic en "Upload File"
3. Sube cada una de las imágenes de respaldo:
   - `acuarela-digital.webp`
   - `dibujado-a-mano.webp`
   - `recortes-de-papel.webp`
   - `kawaii.webp`
4. Asegúrate de que los nombres de archivo coincidan exactamente con los esperados

### 4. Obtener URLs Públicas

Para obtener las URLs públicas de las imágenes:

1. Selecciona el bucket `fallback-images`
2. Haz clic en cada imagen
3. En el panel de detalles, copia la "Public URL"
4. Actualiza el archivo `supabase/storage/fallback-images/README.md` con estas URLs

## Configuración de CORS (Cross-Origin Resource Sharing)

Si experimentas problemas de CORS al acceder a las imágenes desde tu aplicación:

1. Ve a la sección "Storage" en el panel de administración de Supabase
2. Haz clic en "Policies" en la barra lateral
3. Selecciona la pestaña "CORS"
4. Agrega una nueva configuración de CORS:
   - Allowed Origins: `*` (o el dominio específico de tu aplicación)
   - Allowed Methods: `GET`
   - Allowed Headers: `*`
   - Max Age: `86400` (1 día en segundos)
5. Haz clic en "Save"

## Verificación

Para verificar que las imágenes se han configurado correctamente:

1. Accede a la aplicación
2. Navega a la página de visualización de imágenes de respaldo
3. Verifica que todas las imágenes se muestren correctamente
4. Confirma que las URLs públicas funcionen al acceder directamente a ellas

## Solución de Problemas

### Imagen no visible

Si una imagen no es visible:

1. Verifica que el archivo exista en el bucket
2. Confirma que la política de acceso esté configurada correctamente
3. Comprueba que el nombre del archivo coincida exactamente con el esperado
4. Verifica la configuración de CORS si accedes desde un dominio diferente

### Error 403 Forbidden

Si recibes un error 403 al acceder a una imagen:

1. Verifica que la política de acceso permita operaciones SELECT
2. Confirma que la política se aplique a todos los usuarios (`true`)
3. Asegúrate de que la política esté activa

### Error 404 Not Found

Si recibes un error 404 al acceder a una imagen:

1. Verifica que el archivo exista en el bucket correcto
2. Confirma que la ruta de acceso sea correcta
3. Comprueba que el nombre del archivo coincida exactamente con el esperado

