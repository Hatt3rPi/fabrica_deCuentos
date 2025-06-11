# generate-image_pages Edge Function

Función que genera o regenera la ilustración de una página del cuento.

## Endpoint

`POST /functions/v1/generate-image_pages`

## Payload

```json
{
  "story_id": "<uuid>",
  "page_id": "<uuid>",
  "prompt": "Escena detallada de la página"
}
```

Todos los campos son obligatorios.

## Response

```json
{ "imageUrl": "https://.../story-images/<story>/<page>.png" }
```

La imagen se almacena en el bucket `storage` dentro de `story-images/{story_id}/{page_id}.png`
y se actualiza el registro correspondiente en `story_pages.image_url`.
