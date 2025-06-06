# generate-cover-variant Edge Function

Esta función crea una versión alternativa de una portada ya generada aplicando un estilo visual específico.
Se utiliza durante la etapa de diseño para mostrar una vista previa de cada estilo.

## Endpoint

`POST /functions/v1/generate-cover-variant`

## Payload

```json
{
  "imageUrl": "https://.../covers/<id>.png",
  "promptType": "PROMPT_ESTILO_KAWAII"
}
```

Ambos campos son obligatorios y `promptType` se usa para obtener el prompt desde la tabla `prompts`.

## Response

```json
{ "coverUrl": "https://..." }
```
