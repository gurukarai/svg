/*
  # Storage RLS Policies for user-files bucket

  Sets up Row Level Security on the storage.objects table so users can only
  access files within their own folder (user_id prefix) in the 'user-files' bucket.

  1. Policies
    - SELECT: Users can read their own files
    - INSERT: Users can upload to their own folder
    - UPDATE: Users can update their own files
    - DELETE: Users can delete their own files
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can read own storage files'
  ) THEN
    CREATE POLICY "Users can read own storage files"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload own storage files'
  ) THEN
    CREATE POLICY "Users can upload own storage files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update own storage files'
  ) THEN
    CREATE POLICY "Users can update own storage files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete own storage files'
  ) THEN
    CREATE POLICY "Users can delete own storage files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
