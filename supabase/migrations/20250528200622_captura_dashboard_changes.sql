

create table "public"."notifications" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "message" text not null,
    "data" jsonb,
    "priority" text not null,
    "read" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone,
    "actions" jsonb
);


alter table "public"."notifications" enable row level security;

create table "public"."user_preferences" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "notification_preferences" jsonb not null default '{"mutedUntil": null, "soundChoice": "default", "enableSounds": true, "notificationTypes": {"SYSTEM_UPDATE": {"enabled": true, "channels": {"push": false, "email": false, "inApp": true}}, "COMMUNITY_ACTIVITY": {"enabled": true, "channels": {"push": false, "email": false, "inApp": true}}, "CONTENT_INTERACTION": {"enabled": true, "channels": {"push": true, "email": false, "inApp": true}}, "INACTIVITY_REMINDER": {"enabled": true, "channels": {"push": true, "email": false, "inApp": true}}, "CHARACTER_GENERATION_COMPLETE": {"enabled": true, "channels": {"push": true, "email": false, "inApp": true}}}, "enablePushNotifications": true, "enableEmailNotifications": false, "enableInAppNotifications": true}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."user_preferences" enable row level security;


CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE INDEX notifications_read_idx ON public.notifications USING btree (read);

CREATE INDEX notifications_type_idx ON public.notifications USING btree (type);

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_idx ON public.user_preferences USING btree (user_id);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_user_content(p_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
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
end;$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_user_content(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;
-- 0) Borra la versión previa (con p_story_id) para poder crear la nueva
DROP FUNCTION IF EXISTS public.delete_full_story(uuid);


CREATE OR REPLACE FUNCTION public.delete_full_story(story_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

create policy "Users can delete their own notifications"
on "public"."notifications"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own notifications"
on "public"."notifications"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own preferences"
on "public"."user_preferences"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own preferences"
on "public"."user_preferences"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own preferences"
on "public"."user_preferences"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


