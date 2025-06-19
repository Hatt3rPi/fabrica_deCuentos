-- Corregir políticas de storage usando el método estándar de Supabase
-- Eliminar migraciones problemáticas anteriores

-- Asegurar que el bucket 'storage' existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('storage', 'storage', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "authenticated_upload_style_design" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_style_design" ON storage.objects;
DROP POLICY IF EXISTS "public_read_style_design" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_style_design" ON storage.objects;

-- Política para permitir a usuarios autenticados subir archivos a style_design
CREATE POLICY "authenticated_upload_style_design" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);

-- Política para permitir a usuarios autenticados actualizar archivos en style_design
CREATE POLICY "authenticated_update_style_design" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
)
WITH CHECK (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);

-- Política para permitir lectura pública de archivos en style_design
CREATE POLICY "public_read_style_design" 
ON storage.objects FOR SELECT 
TO public 
USING (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);

-- Política para permitir a usuarios autenticados eliminar archivos en style_design
CREATE POLICY "authenticated_delete_style_design" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);