/*
  # Create Processing Jobs Table

  1. New Tables
    - `processing_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `status` (text) - pending, processing, complete, error
      - `render_width` (integer) - width for rendering
      - `pdf_count` (integer) - number of PDFs to process
      - `current_step` (text) - current processing step
      - `error_message` (text) - error details if failed
      - `result_url` (text) - URL to download final result
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `processing_jobs` table
    - Add policies for users to manage their own jobs
*/

CREATE TABLE IF NOT EXISTS processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  render_width integer NOT NULL DEFAULT 5700,
  pdf_count integer NOT NULL DEFAULT 0,
  current_step text,
  error_message text,
  result_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'processing_jobs' AND policyname = 'Users can view own jobs'
  ) THEN
    CREATE POLICY "Users can view own jobs"
      ON processing_jobs FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'processing_jobs' AND policyname = 'Users can create own jobs'
  ) THEN
    CREATE POLICY "Users can create own jobs"
      ON processing_jobs FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'processing_jobs' AND policyname = 'Users can update own jobs'
  ) THEN
    CREATE POLICY "Users can update own jobs"
      ON processing_jobs FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'processing_jobs' AND policyname = 'Users can delete own jobs'
  ) THEN
    CREATE POLICY "Users can delete own jobs"
      ON processing_jobs FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
