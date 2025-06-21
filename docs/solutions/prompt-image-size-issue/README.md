# Solución: Problema con el tamaño de imagen en generación de portadas

## Problema Identificado

La función `generate-cover` no estaba respetando el tamaño "auto" configurado en el admin de prompts, siempre generando imágenes de 1024x1024 píxeles.

## Causa Raíz

1. **Esquema de base de datos correcto**: La tabla `prompts` tiene las columnas `size`, `quality`, `width`, y `height` agregadas por la migración `20250618221346_add_image_preferences_to_prompts.sql`.

2. **Admin guardando correctamente**: El componente `PromptAccordion` y el servicio `promptService` están pasando y guardando correctamente los valores de size y quality.

3. **Edge Function leyendo correctamente**: La función `generate-cover` en las líneas 260-262 lee correctamente los valores de la base de datos:
   ```typescript
   const configuredSize = promptRow?.size || '1024x1024';
   const configuredQuality = promptRow?.quality || 'standard';
   ```

4. **El problema real**: El registro `PROMPT_CUENTO_PORTADA` en la base de datos tiene el campo `size` como NULL, por lo que siempre cae al valor por defecto '1024x1024'.

## Solución Implementada

### 1. Migración de Base de Datos
Se creó una migración (`20250120180000_update_prompt_cuento_portada_size.sql`) que actualiza los valores NULL a 'auto':

```sql
UPDATE prompts
SET size = 'auto'
WHERE type = 'PROMPT_CUENTO_PORTADA' 
AND size IS NULL;

UPDATE prompts
SET quality = 'auto'
WHERE type = 'PROMPT_CUENTO_PORTADA'
AND quality IS NULL;
```

### 2. Página de Debug (Temporal)
Se creó `/test-prompts` para verificar los valores actuales en la base de datos.

## Verificación

1. Aplicar la migración:
   ```bash
   npm run supabase:push
   ```

2. Verificar en `/admin/prompts` que PROMPT_CUENTO_PORTADA muestra:
   - Size: auto
   - Quality: auto

3. Probar la generación de una nueva portada para confirmar que usa el tamaño "auto".

## Próximos Pasos

1. Eliminar la página de test `/test-prompts` una vez verificado el fix.
2. Considerar agregar valores por defecto en el seed inicial de la base de datos para evitar este problema en futuras instalaciones.

## Archivos Modificados

- `supabase/migrations/20250120180000_update_prompt_cuento_portada_size.sql` - Nueva migración
- `src/pages/TestPrompts.tsx` - Página de debug temporal
- `src/App.tsx` - Ruta temporal para debug