-- Políticas simples para el bucket storage
-- Este enfoque usa comandos SQL directos en lugar de JSONB

-- Primero, asegurar que el bucket existe y es público para lectura
UPDATE storage.buckets 
SET public = true 
WHERE id = 'storage';

-- Crear políticas usando el formato más simple
-- Permitir a usuarios autenticados subir archivos a style_design
CREATE POLICY "authenticated_upload_style_design" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);

-- Permitir a usuarios autenticados actualizar sus propios archivos
CREATE POLICY "authenticated_update_style_design" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
)
WITH CHECK (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);

-- Permitir lectura pública
CREATE POLICY "public_read_style_design" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);

-- Permitir a usuarios autenticados eliminar sus archivos
CREATE POLICY "authenticated_delete_style_design" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'storage' AND 
  (storage.foldername(name))[1] = 'style_design'
);