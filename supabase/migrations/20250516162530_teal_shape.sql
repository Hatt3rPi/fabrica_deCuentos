/*
  # Configuración de políticas de almacenamiento

  1. Estructura
    - Configura los buckets y carpetas para almacenamiento de imágenes
    - Establece políticas de acceso granular por usuario
    - Define permisos para diferentes tipos de contenido

  2. Políticas
    - Acceso de lectura/escritura por usuario
    - Protección contra modificación de archivos de otros usuarios
    - Políticas específicas para cada tipo de contenido

  3. Organización
    - /reference-images/{user_id}/{character_id}/
    - /story-images/{user_id}/{story_id}/
    - /thumbnails/{user_id}/
*/

-- Crear carpetas base en el bucket 'storage'
INSERT INTO storage.buckets (id, name)
VALUES ('storage', 'storage')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en el bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Política para insertar archivos
CREATE POLICY "Usuarios pueden subir sus propios archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  -- Verifica que el path comience con el user_id del usuario autenticado
  (bucket_id = 'storage') AND
  (path ~ ('^' || auth.uid() || '/'))
);

-- Política para leer archivos
CREATE POLICY "Usuarios pueden leer sus propios archivos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  -- Permite leer archivos que comiencen con el user_id del usuario
  (bucket_id = 'storage') AND
  (path ~ ('^' || auth.uid() || '/'))
);

-- Política para actualizar archivos
CREATE POLICY "Usuarios pueden actualizar sus propios archivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  -- Solo permite actualizar archivos propios
  (bucket_id = 'storage') AND
  (path ~ ('^' || auth.uid() || '/'))
)
WITH CHECK (
  -- Asegura que no se pueda cambiar el path a otro usuario
  (bucket_id = 'storage') AND
  (path ~ ('^' || auth.uid() || '/'))
);

-- Política para eliminar archivos
CREATE POLICY "Usuarios pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  -- Solo permite eliminar archivos propios
  (bucket_id = 'storage') AND
  (path ~ ('^' || auth.uid() || '/'))
);

-- Política para acceso público a thumbnails
CREATE POLICY "Acceso público a thumbnails"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'storage' AND
  path ~ '^thumbnails/'
);