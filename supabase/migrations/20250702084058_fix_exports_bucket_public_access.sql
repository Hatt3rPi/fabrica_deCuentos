-- Fix: Permitir acceso público de lectura al bucket 'exports'
-- Esto resuelve el problema de descarga de PDFs sin autenticación

-- Crear política para permitir lectura pública del bucket exports
CREATE POLICY "Public can read exports"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'exports');

-- Nota: Esta política permite que cualquier usuario (autenticado o no)
-- pueda leer archivos del bucket 'exports'. Esto es seguro porque:
-- 1. Los PDFs contienen cuentos infantiles (contenido no sensible)
-- 2. Los archivos tienen nombres únicos con userId y timestamp
-- 3. Solo se permite lectura (SELECT), no modificación ni eliminación