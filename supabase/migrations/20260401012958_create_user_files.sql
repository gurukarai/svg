/*
  # Create User Files Table

  Stores metadata for files uploaded by users (PDFs, SVG templates, and result files).

  1. New Tables
    - `user_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - file owner
      - `job_id` (uuid, references processing_jobs, nullable) - associated job if any
      - `file_name` (text) - original file name
      - `file_type` (text) - 'pdf', 'svg', or 'result'
      - `storage_path` (text) - path in Supabase Storage
      - `file_size` (bigint) - file size in bytes
      - `mime_type` (text) - MIME type
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_files` table
    - Users can only access their own files
*/

CREATE TABLE IF NOT EXISTS user_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES processing_jobs(id) ON DELETE SET NULL,
  file_name text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'pdf',
  storage_path text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON user_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON user_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files"
  ON user_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON user_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_job_id ON user_files(job_id);
CREATE INDEX IF NOT EXISTS idx_user_files_file_type ON user_files(file_type);
