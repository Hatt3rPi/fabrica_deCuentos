/*
  # Configuración del bucket character-images
  
  1. Nuevo Bucket
    - Crear bucket `character-images` para almacenar imágenes de personajes
    - Establecer bucket como público para permitir acceso a las imágenes
  
  2. Políticas
    - Permitir a usuarios autenticados subir imágenes
    - Permitir acceso público de lectura
    - Restringir eliminación a propietarios
*/

-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-images', 'character-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir subida de archivos a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'character-images' AND
  auth.role() = 'authenticated'
);

-- Política para permitir lectura pública
CREATE POLICY "Acceso público de lectura para imágenes" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'character-images');

-- Política para permitir eliminación solo al propietario
CREATE POLICY "Usuarios pueden eliminar sus propias imágenes" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'character-images' AND
  owner = auth.uid()
);