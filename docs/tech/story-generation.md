# Story Generation Edge Function

This function generates the story text and cover using OpenAI.

## Endpoint

`POST /functions/v1/generate-story`

## Payload

```json
{
  "story_id": "<uuid>",
  "theme": "Adventure in the woods",
"characters": [{
  "id": "<uuid>",
  "name": "Luna",
  "age": "7",
  "thumbnail_url": "https://..."
}],
  "target_age": "5-7",
  "literary_style": "Narrativo",
  "central_message": "La amistad es lo más importante",
"additional_details": ""
}
```

The `thumbnail_url` values are used as reference images when generating the
cover so the characters match their thumbnails. All images are produced with
`gpt-image-1` using a fixed size and standard quality.

## Response

```json
{
  "story_id": "<uuid>",
  "title": "La gran aventura de Luna",
  "pages": 8,
  "coverUrl": "https://..."
}
```

The function stores the generated title in `stories`, creates nine records in
`story_pages` (page 0 is the cover) and links the provided characters using the
`link_character_to_story` RPC.
If the prompt returns loader messages, they are saved as JSON in the
`stories.loader` column for future use.
The frontend muestra estos mensajes desde el `OverlayLoader` mientras se genera la portada, cambiando cada cinco segundos para indicar el avance.
