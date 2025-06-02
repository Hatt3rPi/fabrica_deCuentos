# Story Generation Edge Function

This function generates the story text and cover using OpenAI.

## Endpoint

`POST /functions/v1/generate-story`

## Payload

```json
{
  "story_id": "<uuid>",
  "theme": "Adventure in the woods",
  "characters": [{"id": "<uuid>", "name": "Luna"}],
  "target_age": "5-7",
  "literary_style": "Narrativo",
  "central_message": "La amistad es lo más importante",
  "additional_details": ""
}
```

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
