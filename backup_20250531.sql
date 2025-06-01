

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cleanup_user_content"("p_email" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
  -- 0) Resolver el UUID del usuario a partir de su email
  p_user_id      uuid;
  story_ids      uuid[];
  orphaned_ids   uuid[];
  n_stories      integer;
  n_orphaned     integer;
begin
  select id
    into p_user_id
  from auth.users
  where email = p_email
  limit 1;

  if p_user_id is null then
    return format('Usuario no encontrado: %s', p_email);
  end if;

  /* 1) Recoger todas las historias de ese usuario */
  select array_agg(s.id)
    into story_ids
  from stories s
  where s.user_id = p_user_id;

  if story_ids is null then
    return format('No se encontraron historias para %s (ID: %s)', p_email, p_user_id);
  end if;

  n_stories := coalesce(array_length(story_ids,1), 0);

  /* 2) Borrar páginas */
  delete from story_pages sp
  where sp.story_id = any(story_ids);

  /* 3) Borrar diseños */
  delete from story_designs sd
  where sd.story_id = any(story_ids);

  /* 4) Borrar relaciones historia–personaje */
  delete from story_characters sc
  where sc.story_id = any(story_ids);

  /* 5) Detectar personajes huérfanos */
  
    delete from characters c
    where c.user_id = p_user_id;

  /* 7) Borrar notificaciones de esas historias */
  delete from notifications n
  where n.user_id = p_user_id;

  /* 8) Borrar finalmente las historias */
  delete from stories s
  where s.id = any(story_ids);

  /* 9) Devolver un mensaje con totales */
  return format(
    'Eliminación completa para %s (ID: %s): %s historias y %s personajes huérfanos borrados.',
    p_email, p_user_id, n_stories, n_orphaned
  );
end;$$;


ALTER FUNCTION "public"."cleanup_user_content"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_user_content"("user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
declare
  -- Alias para el parámetro
  p_user_id        alias for $1;
  -- Arrays temporales
  story_ids        uuid[];
  orphaned_ids     uuid[];
  n_stories        integer;
  n_orphaned       integer;
begin
  /* 1) Recoger todas las historias del usuario */
  select array_agg(s.id)
    into story_ids
  from stories s
  where s.user_id = p_user_id;

  if story_ids is null then
    return 'No se encontraron historias para este usuario.';
  end if;

  n_stories := coalesce(array_length(story_ids,1), 0);

  /* 2) Borrar todas las páginas de esas historias */
  delete from story_pages sp
  where sp.story_id = any(story_ids);

  /* 3) Borrar todos los diseños de esas historias */
  delete from story_designs sd
  where sd.story_id = any(story_ids);

  /* 4) Borrar relaciones historia–personaje */
  delete from story_characters sc
  where sc.story_id = any(story_ids);

  /* 5) Identificar personajes huérfanos de este usuario */
  select array_agg(c.id)
    into orphaned_ids
  from characters c
  left join story_characters sc2 on sc2.character_id = c.id
  where c.user_id = p_user_id
    and sc2.character_id is null;

  n_orphaned := coalesce(array_length(orphaned_ids,1), 0);

  /* 6) Borrar los personajes huérfanos */
  if n_orphaned > 0 then
    delete from characters c
    where c.id = any(orphaned_ids);
  end if;

  /* 7) Borrar notificaciones de esas historias (suponiendo que notifications.story_id existe) */
  delete from notifications n
  where n.story_id = any(story_ids);

  /* 8) Borrar finalmente las historias */
  delete from stories s
  where s.id = any(story_ids);

  /* 9) Devolver resumen */
  return format(
    'Eliminación completa: %s historias y %s personajes huérfanos borrados.',
    n_stories,
    n_orphaned
  );
end;
$_$;


ALTER FUNCTION "public"."cleanup_user_content"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_reset_token"("user_email" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."create_reset_token"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_full_story"("story_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
declare
  -- alias limpio al parámetro
  p_story_id        alias for $1;
  orphaned_characters uuid[];
  image_urls          text[] := '{}';
  character_ids       text[] := '{}';
begin
  -- 1) URLs de imágenes
  select array_agg(sp.image_url)
    into image_urls
  from story_pages        sp
  where sp.story_id = p_story_id
    and sp.image_url is not null;

  -- 2) Borrar pages
  delete from story_pages sp
  where sp.story_id = p_story_id;

  -- 3) Borrar designs
  delete from story_designs sd
  where sd.story_id = p_story_id;

  -- 4) IDs de personajes en la historia
  select array_agg(sc.character_id::text)
    into character_ids
  from story_characters   sc
  where sc.story_id = p_story_id;

  -- 5) Personajes huérfanos
  orphaned_characters := array(
    select sc2.character_id
      from story_characters sc2
     where sc2.story_id = p_story_id
  );

  -- 6) Borrar relaciones story–character
  delete from story_characters sc3
  where sc3.story_id = p_story_id;

  -- 7) Borrar personajes huérfanos
  delete from characters c
  where c.id = any(orphaned_characters)
    and not exists (
      select 1
        from story_characters sc4
       where sc4.character_id = c.id
    );

  -- 8) Borrar la historia
  delete from stories s
  where s.id = p_story_id;

  -- 9) Devolver URLs + IDs
  return image_urls || character_ids;
end;
$_$;


ALTER FUNCTION "public"."delete_full_story"("story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_reset_token"() RETURNS "text"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."generate_reset_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) RETURNS TABLE("user_id" "uuid", "user_email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Verificar que el usuario esté autenticado
  if auth.uid() is null then
    raise exception 'No autorizado';
  end if;
  
  -- Verificar que el usuario sea administrador
  if not exists (
    select 1 from auth.users 
    where id = auth.uid() 
    and email in (
      'fabarca212@gmail.com',
      'lucianoalonso2000@gmail.com',
      'javier2000asr@gmail.com'
    )
  ) then
    raise exception 'No tienes permisos para ver esta información';
  end if;
  
  -- Retornar solo los IDs y correos de los usuarios solicitados
  return query
  select u.id as user_id, u.email::text as user_email
  from auth.users u
  where u.id = any(user_ids);
end;
$$;


ALTER FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) IS 'Obtiene los correos electrónicos de usuarios por sus IDs, solo accesible por administradores. Corrige problemas de ambigüedad en la versión anterior.';



CREATE OR REPLACE FUNCTION "public"."get_user_id_by_email"("p_email" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_user_id uuid;
begin
  select id
    into v_user_id
  from auth.users
  where email = p_email
  limit 1;

  if v_user_id is null then
    raise exception 'Usuario no encontrado: %', p_email;
  end if;

  return v_user_id;
end;
$$;


ALTER FUNCTION "public"."get_user_id_by_email"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_prompt_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into prompt_versions(prompt_id, version, content, created_by)
  values(new.id, new.version, new.content, new.updated_by);
  return new;
end;
$$;


ALTER FUNCTION "public"."log_prompt_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_password"("p_token" "text", "p_new_password" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."reset_password"("p_token" "text", "p_new_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_prompt_version"("p_id" "uuid", "p_version" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_content text;
begin
  select content into v_content
  from prompt_versions
  where prompt_id = p_id and version = p_version
  order by created_at desc limit 1;
  if v_content is null then
    raise exception 'Version not found';
  end if;
  update prompts
  set content = v_content,
      version = p_version,
      updated_at = now()
  where id = p_id;
end;
$$;


ALTER FUNCTION "public"."revert_prompt_version"("p_id" "uuid", "p_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_characters_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_characters_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_prompt_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.version := coalesce(old.version,1) + 1;
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_prompt_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_profiles_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."character_thumbnails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "style_type" "text" NOT NULL,
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."character_thumbnails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "age" "text",
    "reference_urls" "text"[] DEFAULT ARRAY[]::"text"[],
    "thumbnail_url" "text",
    "frontal_view_url" "text",
    "side_view_url" "text",
    "back_view_url" "text",
    CONSTRAINT "reference_urls_length" CHECK (("array_length"("reference_urls", 1) <= 3))
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb",
    "priority" "text" NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "actions" "jsonb"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."password_reset_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "attempts" integer DEFAULT 0
);


ALTER TABLE "public"."password_reset_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "modelo_ia" "text" NOT NULL,
    "tiempo_respuesta_ms" integer,
    "estado" "text",
    "tokens_entrada" integer,
    "tokens_salida" integer,
    "usuario_id" "uuid",
    "metadatos" "jsonb",
    "error_type" "text"
);


ALTER TABLE "public"."prompt_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_id" "uuid",
    "version" integer NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."prompt_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "target_age" "text",
    "literary_style" "text",
    "central_message" "text",
    "additional_details" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    CONSTRAINT "stories_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "character_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_designs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "visual_style" "text" NOT NULL,
    "color_palette" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_designs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "page_number" integer NOT NULL,
    "text" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_preferences" "jsonb" DEFAULT '{"mutedUntil": null, "soundChoice": "default", "enableSounds": true, "notificationTypes": {"SYSTEM_UPDATE": {"enabled": true, "channels": {"push": false, "email": false, "inApp": true}}, "COMMUNITY_ACTIVITY": {"enabled": true, "channels": {"push": false, "email": false, "inApp": true}}, "CONTENT_INTERACTION": {"enabled": true, "channels": {"push": true, "email": false, "inApp": true}}, "INACTIVITY_REMINDER": {"enabled": true, "channels": {"push": true, "email": false, "inApp": true}}, "CHARACTER_GENERATION_COMPLETE": {"enabled": true, "channels": {"push": true, "email": false, "inApp": true}}}, "enablePushNotifications": true, "enableEmailNotifications": false, "enableInAppNotifications": true}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "theme_preference" "text" DEFAULT 'light'::"text",
    "shipping_address" "text",
    "shipping_comuna" "text",
    "shipping_city" "text",
    "shipping_region" "text",
    "shipping_phone" "text",
    "contact_person" "text",
    "additional_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."character_thumbnails"
    ADD CONSTRAINT "character_thumbnails_character_id_style_type_key" UNIQUE ("character_id", "style_type");



ALTER TABLE ONLY "public"."character_thumbnails"
    ADD CONSTRAINT "character_thumbnails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."prompt_metrics"
    ADD CONSTRAINT "prompt_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_versions"
    ADD CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_type_key" UNIQUE ("type");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_characters"
    ADD CONSTRAINT "story_characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_characters"
    ADD CONSTRAINT "story_characters_story_id_character_id_key" UNIQUE ("story_id", "character_id");



ALTER TABLE ONLY "public"."story_designs"
    ADD CONSTRAINT "story_designs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_pages"
    ADD CONSTRAINT "story_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_prompt_metrics_prompt" ON "public"."prompt_metrics" USING "btree" ("prompt_id");



CREATE INDEX "idx_prompt_metrics_timestamp" ON "public"."prompt_metrics" USING "btree" ("timestamp");



CREATE INDEX "idx_story_characters_character_id" ON "public"."story_characters" USING "btree" ("character_id");



CREATE INDEX "idx_story_characters_story_id" ON "public"."story_characters" USING "btree" ("story_id");



CREATE INDEX "idx_story_designs_story_id" ON "public"."story_designs" USING "btree" ("story_id");



CREATE INDEX "idx_story_pages_story_id" ON "public"."story_pages" USING "btree" ("story_id");



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "notifications_read_idx" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "notifications_type_idx" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id");



CREATE UNIQUE INDEX "user_preferences_user_id_idx" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trg_log_prompt_version" AFTER INSERT OR UPDATE ON "public"."prompts" FOR EACH ROW EXECUTE FUNCTION "public"."log_prompt_version"();



CREATE OR REPLACE TRIGGER "trg_update_prompt_version" BEFORE UPDATE ON "public"."prompts" FOR EACH ROW EXECUTE FUNCTION "public"."update_prompt_version"();



CREATE OR REPLACE TRIGGER "update_characters_updated_at" BEFORE UPDATE ON "public"."characters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stories_updated_at" BEFORE UPDATE ON "public"."stories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_story_designs_updated_at" BEFORE UPDATE ON "public"."story_designs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_story_pages_updated_at" BEFORE UPDATE ON "public"."story_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_profiles_updated_at"();



ALTER TABLE ONLY "public"."character_thumbnails"
    ADD CONSTRAINT "character_thumbnails_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."prompt_metrics"
    ADD CONSTRAINT "prompt_metrics_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id");



ALTER TABLE ONLY "public"."prompt_metrics"
    ADD CONSTRAINT "prompt_metrics_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."prompt_versions"
    ADD CONSTRAINT "prompt_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."prompt_versions"
    ADD CONSTRAINT "prompt_versions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."story_characters"
    ADD CONSTRAINT "story_characters_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_characters"
    ADD CONSTRAINT "story_characters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_designs"
    ADD CONSTRAINT "story_designs_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_pages"
    ADD CONSTRAINT "story_pages_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can modify system settings" ON "public"."system_settings" TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = 'fabarca212@gmail.com'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = 'fabarca212@gmail.com'::"text"));



CREATE POLICY "Admins can read system settings" ON "public"."system_settings" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = 'fabarca212@gmail.com'::"text"));



CREATE POLICY "Admins insert prompt metrics" ON "public"."prompt_metrics" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['fabarca212@gmail.com'::"text", 'lucianoalonso2000@gmail.com'::"text", 'javier2000asr@gmail.com'::"text"])));



CREATE POLICY "Admins insert prompt_versions" ON "public"."prompt_versions" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['fabarca212@gmail.com'::"text", 'lucianoalonso2000@gmail.com'::"text", 'javier2000asr@gmail.com'::"text"])));



CREATE POLICY "Admins modify prompts" ON "public"."prompts" TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['fabarca212@gmail.com'::"text", 'lucianoalonso2000@gmail.com'::"text", 'javier2000asr@gmail.com'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['fabarca212@gmail.com'::"text", 'lucianoalonso2000@gmail.com'::"text", 'javier2000asr@gmail.com'::"text"])));



CREATE POLICY "Admins read prompt metrics" ON "public"."prompt_metrics" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['fabarca212@gmail.com'::"text", 'lucianoalonso2000@gmail.com'::"text", 'javier2000asr@gmail.com'::"text"])));



CREATE POLICY "Admins read prompt_versions" ON "public"."prompt_versions" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['fabarca212@gmail.com'::"text", 'lucianoalonso2000@gmail.com'::"text", 'javier2000asr@gmail.com'::"text"])));



CREATE POLICY "Admins read prompts" ON "public"."prompts" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['fabarca212@gmail.com'::"text", 'lucianoalonso2000@gmail.com'::"text", 'javier2000asr@gmail.com'::"text"])));



CREATE POLICY "Allow token validation" ON "public"."password_reset_tokens" FOR SELECT USING ((("expires_at" > "now"()) AND ("used_at" IS NULL) AND ("attempts" < 5)));



CREATE POLICY "Users can create characters" ON "public"."characters" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create stories" ON "public"."stories" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create story characters" ON "public"."story_characters" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_characters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create story designs" ON "public"."story_designs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_designs"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create story pages" ON "public"."story_pages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_pages"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own characters" ON "public"."characters" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own stories" ON "public"."stories" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own story characters" ON "public"."story_characters" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_characters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own story designs" ON "public"."story_designs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_designs"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own story pages" ON "public"."story_pages" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_pages"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own characters" ON "public"."characters" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own stories" ON "public"."stories" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own story characters" ON "public"."story_characters" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_characters"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read own story designs" ON "public"."story_designs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_designs"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read own story pages" ON "public"."story_pages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_pages"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own characters" ON "public"."characters" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own stories" ON "public"."stories" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own story designs" ON "public"."story_designs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_designs"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own story pages" ON "public"."story_pages" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_pages"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."character_thumbnails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_reset_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_designs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."prompt_metrics";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."cleanup_user_content"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_user_content"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_user_content"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_user_content"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_user_content"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_user_content"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_reset_token"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_reset_token"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_reset_token"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_full_story"("story_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_full_story"("story_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_full_story"("story_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_reset_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_reset_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_reset_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_emails"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_prompt_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_prompt_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_prompt_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_password"("p_token" "text", "p_new_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reset_password"("p_token" "text", "p_new_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_password"("p_token" "text", "p_new_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_prompt_version"("p_id" "uuid", "p_version" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."revert_prompt_version"("p_id" "uuid", "p_version" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_prompt_version"("p_id" "uuid", "p_version" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_characters_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_characters_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_characters_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_prompt_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_prompt_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_prompt_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profiles_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."character_thumbnails" TO "anon";
GRANT ALL ON TABLE "public"."character_thumbnails" TO "authenticated";
GRANT ALL ON TABLE "public"."character_thumbnails" TO "service_role";



GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."password_reset_tokens" TO "anon";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."password_reset_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_metrics" TO "anon";
GRANT ALL ON TABLE "public"."prompt_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_versions" TO "anon";
GRANT ALL ON TABLE "public"."prompt_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_versions" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."stories" TO "anon";
GRANT ALL ON TABLE "public"."stories" TO "authenticated";
GRANT ALL ON TABLE "public"."stories" TO "service_role";



GRANT ALL ON TABLE "public"."story_characters" TO "anon";
GRANT ALL ON TABLE "public"."story_characters" TO "authenticated";
GRANT ALL ON TABLE "public"."story_characters" TO "service_role";



GRANT ALL ON TABLE "public"."story_designs" TO "anon";
GRANT ALL ON TABLE "public"."story_designs" TO "authenticated";
GRANT ALL ON TABLE "public"."story_designs" TO "service_role";



GRANT ALL ON TABLE "public"."story_pages" TO "anon";
GRANT ALL ON TABLE "public"."story_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."story_pages" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
