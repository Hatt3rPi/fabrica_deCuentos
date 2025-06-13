# generate-image-pages Edge Function

Función que genera o regenera la ilustración de una página del cuento.

## Endpoint

`POST /functions/v1/generate-image-pages`

## Payload

```json
{
  "story_id": "<uuid>",
  "page_id": "<uuid>"
}
```
Todos los campos son obligatorios. El texto de la página y el estilo se obtienen
automáticamente desde la base de datos.

## Response

```json
{ "imageUrl": "https://.../story-images/<story>/<page>.png" }
```

La imagen se almacena en el bucket `storage` dentro de `story-images/{story_id}/{page_id}.png`
y se actualiza el registro correspondiente en `story_pages.image_url`.

## Uso desde el frontend

La función `storyService.generatePageImage(storyId, pageId)` envía esta
petición incluyendo el identificador de la historia. El `WizardContext` expone
`generatePageImage(pageId)` para actualizar o crear la imagen de la página
mostrada en el paso de vista previa.
