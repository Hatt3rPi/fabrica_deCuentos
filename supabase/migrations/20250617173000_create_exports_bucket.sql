-- Create storage bucket for story exports
-- This migration is additive and non-breaking

DO $$ 
BEGIN
  -- Create exports bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('exports', 'exports', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create RLS policy for exports bucket - users can read their own exports
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can read own exports'
  ) THEN
    CREATE POLICY "Users can read own exports"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  
  -- Create RLS policy for exports bucket - service role can insert exports
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Service role can insert exports'
  ) THEN
    CREATE POLICY "Service role can insert exports"
      ON storage.objects
      FOR INSERT
      TO service_role
      WITH CHECK (bucket_id = 'exports');
  END IF;
  
  -- Create RLS policy for exports bucket - authenticated users can insert in their own folder
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can insert own exports'
  ) THEN
    CREATE POLICY "Users can insert own exports"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;