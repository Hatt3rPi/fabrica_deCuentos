/*
  # Password Reset System

  1. New Tables
    - `password_reset_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, unique)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `used_at` (timestamptz, nullable)
      - `attempts` (integer, default 0)

  2. Security
    - Enable RLS on password_reset_tokens table
    - Add policy for public token validation

  3. Functions
    - `generate_reset_token()`: Generates a random 8-character token
    - `create_reset_token(user_email)`: Creates a new reset token for a user
    - `reset_password(token, new_password)`: Resets a user's password using a valid token
*/

-- Create tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow token validation" ON password_reset_tokens;

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

-- Ensure old reset_password function is dropped to avoid type conflicts
DROP FUNCTION IF EXISTS reset_password(text, text);

-- Function to reset password
CREATE OR REPLACE FUNCTION reset_password(p_token text, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  token_record password_reset_tokens%ROWTYPE;
BEGIN
  -- Get token record
  SELECT * INTO token_record
  FROM password_reset_tokens
  WHERE 
    token = p_token AND
    expires_at > now() AND
    used_at IS NULL AND
    attempts < 5;

  IF token_record IS NULL THEN
    -- Increment attempts if token exists but is invalid
    UPDATE password_reset_tokens
    SET attempts = attempts + 1
    WHERE token = p_token;
    
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  -- Update user's password
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = token_record.user_id;

  -- Mark token as used
  UPDATE password_reset_tokens
  SET 
    used_at = now(),
    attempts = attempts + 1
  WHERE id = token_record.id;
END;
$$;
