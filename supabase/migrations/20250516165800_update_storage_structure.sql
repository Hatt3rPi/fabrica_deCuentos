-- Crear bucket storage si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'storage'
  ) THEN
    INSERT INTO storage.buckets (id, name)
    VALUES ('storage', 'storage');
  END IF;
END $$;

-- Crear políticas para el bucket storage
-- Políticas para reference-images
CREATE POLICY "Users can upload reference images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'storage' AND
  name LIKE concat('%', auth.uid(), '/', '%', '/%') AND
  (name LIKE concat('%', auth.uid(), '/', '%', '/reference-images/%') OR
   name LIKE concat('%', auth.uid(), '/', '%', '/story-images/%') OR
   name LIKE concat('%', auth.uid(), '/', 'thumbnails/%'))
);

CREATE POLICY "Users can get their own reference images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'storage' AND
  name LIKE concat('%', auth.uid(), '/', '%', '/%') AND
  (name LIKE concat('%', auth.uid(), '/', '%', '/reference-images/%') OR
   name LIKE concat('%', auth.uid(), '/', '%', '/story-images/%') OR
   name LIKE concat('%', auth.uid(), '/', 'thumbnails/%'))
);

CREATE POLICY "Users can delete their own reference images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'storage' AND
  name LIKE concat('%', auth.uid(), '/', '%', '/%') AND
  (name LIKE concat('%', auth.uid(), '/', '%', '/reference-images/%') OR
   name LIKE concat('%', auth.uid(), '/', '%', '/story-images/%') OR
   name LIKE concat('%', auth.uid(), '/', 'thumbnails/%'))
);

-- Eliminar políticas antiguas del bucket reference-images
DROP POLICY IF EXISTS "Users can upload reference images" ON storage.objects;
DROP POLICY IF EXISTS "Users can get their own reference images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own reference images" ON storage.objects;

-- Eliminar bucket reference-images si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'reference-images'
  ) THEN
    DELETE FROM storage.objects WHERE bucket_id = 'reference-images';
    DELETE FROM storage.buckets WHERE id = 'reference-images';
  END IF;
END $$;
