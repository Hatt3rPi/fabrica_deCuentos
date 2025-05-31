# Almacenamiento de archivos

La plataforma utiliza un bucket principal `storage` de Supabase Storage para guardar las imágenes generadas. Dentro de este bucket se organizan diferentes carpetas para cada tipo de recurso.

## Organización de carpetas

El bucket `storage` contiene las siguientes carpetas:

- **reference-images/{user_id}/{character_id}/{imagen}**: imágenes de referencia que los usuarios suben para sus personajes.
- **story-images/{user_id}/{story_id}/{archivo}**: propuesta para almacenar las páginas de cada cuento. Los archivos se organizan por usuario y por historia.
- **thumbnails/{user_id}/{character_id}.png**: miniatura principal del personaje.
- **thumbnails/{user_id}/{character_id}_{estilo}.png**: variaciones de miniatura según estilo o versión.

Adicionalmente existe el bucket público **fabricacuentos** donde se guardan las imágenes finales de los cuentos publicados.

## Retención y limpieza

- Al eliminar un cuento mediante la función `delete_full_story`, se borran los registros de la base de datos y se devuelven las URLs de las imágenes asociadas. La aplicación utiliza estas URLs para eliminar los archivos de los buckets correspondientes.
- Cuando se elimina un cuento conservando sus personajes, la función `delete_story_preserve_characters` elimina las páginas y diseños pero mantiene las carpetas de personajes.
- Los buckets se limpian de forma automática en las pruebas y a través de funciones de mantenimiento que eliminan contenido huérfano con más de 90 días.

Estas políticas buscan evitar archivos huérfanos y asegurar que el almacenamiento se mantenga optimizado.
