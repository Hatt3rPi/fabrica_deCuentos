/*
  # Fix reset password function

  1. Changes
    - Drop existing reset_password function
    - Recreate reset_password function with correct return type
    - Add proper token validation and password update logic
    
  2. Security
    - Function remains security definer
    - Maintains proper token validation
    - Tracks token usage and attempts
*/

-- First drop the existing function
DROP FUNCTION IF EXISTS reset_password(text, text);

-- Recreate the function with the correct implementation
CREATE OR REPLACE FUNCTION reset_password(
  p_token text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_count int;
BEGIN
  -- Get the user_id for the valid token
  SELECT user_id INTO v_user_id
  FROM password_reset_tokens
  WHERE password_reset_tokens.token = p_token
    AND expires_at > now()
    AND used_at IS NULL
    AND attempts < 5;

  IF v_user_id IS NULL THEN
    -- Increment attempts counter
    UPDATE password_reset_tokens
    SET attempts = attempts + 1
    WHERE password_reset_tokens.token = p_token;
    
    RETURN false;
  END IF;

  -- Update the user's password
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    -- Mark token as used
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE password_reset_tokens.token = p_token;
    
    RETURN true;
  END IF;

  RETURN false;
END;
$$;