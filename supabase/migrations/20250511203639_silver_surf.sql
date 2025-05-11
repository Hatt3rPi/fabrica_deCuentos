-- Function to reset password
CREATE OR REPLACE FUNCTION reset_password(token text, new_password text)
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
    token = reset_password.token AND
    expires_at > now() AND
    used_at IS NULL AND
    attempts < 5;

  IF token_record IS NULL THEN
    -- Increment attempts if token exists but is invalid
    UPDATE password_reset_tokens
    SET attempts = attempts + 1
    WHERE token = reset_password.token;
    
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  -- Update user's password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = token_record.user_id;

  -- Mark token as used
  UPDATE password_reset_tokens
  SET 
    used_at = now(),
    attempts = attempts + 1
  WHERE id = token_record.id;
END;
$$;