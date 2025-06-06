# generate-cover-variant Edge Function

Esta función crea una versión alternativa de una portada ya generada aplicando un estilo visual específico.
Se utiliza durante la etapa de diseño para mostrar una vista previa de cada estilo.

## Endpoint

`POST /functions/v1/generate-cover-variant`

## Payload

```json
{
  "imageUrl": "https://.../covers/<id>.png",
  "promptType": "PROMPT_ESTILO_KAWAII",
  "storyId": "<uuid>",
  "styleKey": "kawaii"
}
```

Todos los campos son obligatorios. `promptType` se usa para obtener el texto del estilo y `styleKey` determina el nombre del archivo en Storage.

## Response

```json
{ "coverUrl": "https://.../covers/<id>_<style>.png" }
```
