-- Initialize default wizard state and add validation function

-- Default value for new stories
ALTER TABLE stories
  ALTER COLUMN wizard_state SET DEFAULT '{"1.personajes": {"estado": "no_iniciada", "personajesAsignados": 0}, "2.cuento": "no_iniciada", "3.diseno": "no_iniciada", "4.vistaPrevia": "no_iniciada"}'::jsonb;

-- Helper to obtain the order of a state
CREATE OR REPLACE FUNCTION wizard_state_rank(p_state text)
RETURNS integer AS $$
BEGIN
  CASE p_state
    WHEN 'no_iniciada' THEN RETURN 0;
    WHEN 'borrador' THEN RETURN 1;
    WHEN 'completado' THEN RETURN 2;
    ELSE RETURN -1;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to enforce sequential flow
CREATE OR REPLACE FUNCTION enforce_wizard_state()
RETURNS trigger AS $$
DECLARE
  old_p text := COALESCE((OLD.wizard_state->'1.personajes'->>'estado'), 'no_iniciada');
  new_p text := COALESCE((NEW.wizard_state->'1.personajes'->>'estado'), old_p);
  old_c text := COALESCE((OLD.wizard_state->>'2.cuento'), 'no_iniciada');
  new_c text := COALESCE((NEW.wizard_state->>'2.cuento'), old_c);
  old_d text := COALESCE((OLD.wizard_state->>'3.diseno'), 'no_iniciada');
  new_d text := COALESCE((NEW.wizard_state->>'3.diseno'), old_d);
  old_v text := COALESCE((OLD.wizard_state->>'4.vistaPrevia'), 'no_iniciada');
  new_v text := COALESCE((NEW.wizard_state->>'4.vistaPrevia'), old_v);
BEGIN
  -- Prevent state regression
  IF wizard_state_rank(new_p) < wizard_state_rank(old_p) THEN
    RAISE EXCEPTION 'Estado de personajes invalido';
  END IF;
  IF wizard_state_rank(new_c) < wizard_state_rank(old_c) THEN
    RAISE EXCEPTION 'Estado de cuento invalido';
  END IF;
  IF wizard_state_rank(new_d) < wizard_state_rank(old_d) THEN
    RAISE EXCEPTION 'Estado de diseño invalido';
  END IF;
  IF wizard_state_rank(new_v) < wizard_state_rank(old_v) THEN
    RAISE EXCEPTION 'Estado de vista previa invalido';
  END IF;

  -- Sequential dependencies
  IF wizard_state_rank(new_c) > 0 AND wizard_state_rank(new_p) < 2 THEN
    RAISE EXCEPTION 'No se puede iniciar cuento sin completar personajes';
  END IF;
  IF wizard_state_rank(new_d) > 0 AND wizard_state_rank(new_c) < 2 THEN
    RAISE EXCEPTION 'No se puede iniciar diseño sin completar cuento';
  END IF;
  IF wizard_state_rank(new_v) > 0 AND wizard_state_rank(new_d) < 2 THEN
    RAISE EXCEPTION 'No se puede iniciar vista previa sin completar diseño';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_wizard_state_trigger ON stories;
CREATE TRIGGER enforce_wizard_state_trigger
BEFORE UPDATE OF wizard_state ON stories
FOR EACH ROW EXECUTE FUNCTION enforce_wizard_state();

GRANT EXECUTE ON FUNCTION wizard_state_rank(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION enforce_wizard_state() TO PUBLIC;
