# Fix: Story Export Bucket Correction

## 📋 Issues Resueltos
- Issue: Edge Function `story-export` fallaba con error `"Bucket not found"` al intentar subir PDFs
- Error crítico: `{ statusCode: "404", error: "Bucket not found", message: "Bucket not found" }`

## 🎯 Objetivo
Corregir la configuración de bucket en la Edge Function `story-export` para usar el bucket correcto que existe en Supabase Storage.

## 📁 Archivos Modificados
- `supabase/functions/story-export/index.ts` - Corrección de bucket de `'stories'` a `'exports'`

## 🔧 Cambios Técnicos

### Root Cause Analysis
```bash
# Error observado en logs
[story-export] Error uploading PDF: { 
  statusCode: "404", 
  error: "Bucket not found", 
  message: "Bucket not found" 
}
```

**Problema:** Edge Function intentaba usar bucket `'stories'` que no existe.

**Buckets disponibles verificados en Supabase Storage:**
- ✅ `exports` (Public) 
- ✅ `storage` (Public)
- ✅ `covers`
- ✅ `story-images`
- ✅ `thumbnails`
- ❌ `stories` (NO EXISTE)

### Corrección Aplicada

#### Antes (líneas 449 y 462)
```typescript
// Upload PDF
const { data, error } = await supabaseAdmin.storage
  .from('stories')  // ❌ Bucket inexistente
  .upload(filePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: false
  });

// Get public URL  
const { data: urlData } = supabaseAdmin.storage
  .from('stories')  // ❌ Bucket inexistente
  .getPublicUrl(filePath);
```

#### Después (líneas 449 y 462)
```typescript
// Upload PDF
const { data, error } = await supabaseAdmin.storage
  .from('exports')  // ✅ Bucket existente y público
  .upload(filePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: false
  });

// Get public URL
const { data: urlData } = supabaseAdmin.storage
  .from('exports')  // ✅ Bucket existente y público
  .getPublicUrl(filePath);
```

### Estructura de Archivos
La estructura de archivos se mantiene igual:
```
exports/
  {user_id}/
    story-{story_id}-{timestamp}.pdf
```

## 🧪 Testing

### Manual
- [x] **Verificar buckets**: Confirmar que bucket `exports` existe y es público
- [ ] **Test de upload**: Ejecutar Edge Function con cuento completo
- [ ] **Verificar descarga**: Confirmar que URL pública funciona
- [ ] **Test de permisos**: Verificar que solo el usuario puede acceder a sus archivos

### Error Monitoring
```bash
# Comando para verificar logs de Edge Function
# En Supabase Dashboard > Edge Functions > story-export > Logs
```

**Errores esperados ANTES del fix:**
```
[story-export] Error uploading PDF: { statusCode: "404", error: "Bucket not found" }
```

**Comportamiento esperado DESPUÉS del fix:**
```
[story-export] Subiendo PDF a storage...
[story-export] PDF uploaded successfully to exports/{user_id}/story-{id}-{timestamp}.pdf
```

## 🚀 Deployment

### Requisitos
- [x] Bucket `exports` existe en Supabase Storage (verificado)
- [x] Bucket `exports` es público (verificado)
- [ ] Edge Function desplegada con corrección

### Pasos
1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy story-export
   ```

2. **Verificar en Dashboard**:
   - Edge Function aparece como activa
   - Logs muestran que se está usando bucket correcto

3. **Test de funcionalidad**:
   - Completar un cuento en la aplicación
   - Verificar que PDF se genera sin error 404
   - Confirmar descarga exitosa

### Verificación Post-Deploy
- [ ] **Function Health**: Edge Function responde correctamente
- [ ] **Storage Access**: PDFs se suben a bucket `exports`
- [ ] **Public URLs**: Links de descarga funcionan
- [ ] **Error Logs**: No más errores de "Bucket not found"

## 📊 Monitoreo

### Métricas a Observar
- **Success Rate**: % de exports que se completan sin error
- **Storage Usage**: Crecimiento del bucket `exports`
- **Response Time**: Tiempo de generación y upload de PDFs
- **Error Rate**: Frecuencia de errores en Edge Function

### Posibles Regresiones
- **Performance**: Upload puede ser lento con PDFs grandes
- **Storage Limits**: Bucket `exports` puede alcanzar límites
- **Permissions**: RLS policies pueden bloquear acceso
- **Function Timeout**: Edge Function puede timeout con cuentos muy largos

## 🔧 Troubleshooting

### Errores Comunes Post-Fix
1. **"Permission denied"**: Verificar RLS policies en bucket `exports`
2. **"File size too large"**: Optimizar tamaño de imágenes en PDF
3. **"Function timeout"**: Reducir tiempo de procesamiento
4. **"Invalid file path"**: Verificar formato de nombres de archivo

### Debugging
```bash
# Verificar bucket existe
# En Supabase Dashboard > Storage > verificar bucket 'exports'

# Verificar RLS policies  
# En Supabase Dashboard > Storage > exports > Settings

# Monitorear logs
# En Supabase Dashboard > Edge Functions > story-export > Logs
```

## 🔗 Referencias
- Error original: Edge Function logs showing "Bucket not found"
- [Story Export Edge Function](../../tech/story-export.md)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- Bucket verification: Supabase Dashboard > Storage