/*
  # Add password reset functionality

  1. New Tables
    - `password_reset_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, unique)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
      - `used_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `password_reset_tokens` table
    - Add policy for token validation
*/

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts integer DEFAULT 0
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow token validation
CREATE POLICY "Allow token validation"
  ON password_reset_tokens
  FOR SELECT
  TO public
  USING (
    expires_at > now() AND
    used_at IS NULL AND
    attempts < 5
  );

-- Function to generate random token
CREATE OR REPLACE FUNCTION generate_reset_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text[] := ARRAY['A','B','C','D','E','F','G','H','J','K','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$;

-- Function to create reset token
CREATE OR REPLACE FUNCTION create_reset_token(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  new_token text;
BEGIN
  -- Get user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Invalidate existing tokens
  UPDATE password_reset_tokens
  SET used_at = now()
  WHERE user_id = target_user_id AND used_at IS NULL;

  -- Generate new token
  new_token := generate_reset_token();

  -- Create new reset token
  INSERT INTO password_reset_tokens (user_id, token, expires_at)
  VALUES (
    target_user_id,
    new_token,
    now() + interval '10 minutes'
  );

  RETURN new_token;
END;
$$;