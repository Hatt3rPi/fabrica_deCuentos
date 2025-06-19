-- Configuración mínima y compatible para storage
-- Esta migración usa solo comandos SQL estándar que funcionan en todas las versiones

-- 1. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'storage', 
  'storage', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) 
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Si las políticas ya existen, no hacer nada (para evitar errores)
-- Solo crear políticas si no existen

-- Nota: En caso de que las políticas no puedan crearse automáticamente,
-- el administrador puede crear estas políticas manualmente en el dashboard de Supabase:

-- Política 1: "Allow authenticated uploads to style_design"
-- Aplicar a: INSERT en storage.objects
-- Target roles: authenticated
-- WITH CHECK: bucket_id = 'storage' AND (storage.foldername(name))[1] = 'style_design'

-- Política 2: "Allow public reads from style_design"  
-- Aplicar a: SELECT en storage.objects
-- Target roles: public
-- USING: bucket_id = 'storage' AND (storage.foldername(name))[1] = 'style_design'

-- Política 3: "Allow authenticated updates to style_design"
-- Aplicar a: UPDATE en storage.objects  
-- Target roles: authenticated
-- USING y WITH CHECK: bucket_id = 'storage' AND (storage.foldername(name))[1] = 'style_design'

-- Política 4: "Allow authenticated deletes from style_design"
-- Aplicar a: DELETE en storage.objects
-- Target roles: authenticated  
-- USING: bucket_id = 'storage' AND (storage.foldername(name))[1] = 'style_design'