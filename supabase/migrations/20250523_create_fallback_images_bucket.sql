-- Crear el bucket para las imágenes de respaldo
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, file_size_limit, allowed_mime_types)
VALUES (
  'fallback-images',
  'fallback-images',
  (SELECT id FROM auth.users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'),
  NOW(),
  NOW(),
  FALSE,
  524288, -- 512KB
  ARRAY['image/webp', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Crear política para permitir acceso de lectura pública
CREATE POLICY "Public Read Access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'fallback-images');

-- Crear política para permitir que los usuarios autenticados suban archivos
CREATE POLICY "Authenticated Users Can Upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'fallback-images');

-- Crear política para permitir que los usuarios autenticados actualicen sus propios archivos
CREATE POLICY "Authenticated Users Can Update Own Files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'fallback-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'fallback-images' AND owner = auth.uid());

-- Crear política para permitir que los usuarios autenticados eliminen sus propios archivos
CREATE POLICY "Authenticated Users Can Delete Own Files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'fallback-images' AND owner = auth.uid());

