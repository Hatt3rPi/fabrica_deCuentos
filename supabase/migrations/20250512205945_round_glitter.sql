/*
  # Fix login functionality and password reset

  This migration fixes issues with the password reset function and ensures proper parameter handling.
*/

-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS reset_password(text, text);
DROP FUNCTION IF EXISTS reset_password(p_token text, p_new_password text);

-- Recreate the function with proper parameter handling
CREATE OR REPLACE FUNCTION reset_password(
  p_token text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_count int;
BEGIN
  -- Get the user_id for the valid token
  SELECT user_id INTO v_user_id
  FROM password_reset_tokens t
  WHERE t.token = p_token
    AND expires_at > now()
    AND used_at IS NULL
    AND attempts < 5;

  IF v_user_id IS NULL THEN
    -- Increment attempts counter
    UPDATE password_reset_tokens
    SET attempts = attempts + 1
    WHERE token = p_token;
    
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
    WHERE token = p_token;
    
    RETURN true;
  END IF;

  RETURN false;
END;
$$;