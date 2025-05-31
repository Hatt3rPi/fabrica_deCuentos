-- Función para asociar un personaje a una historia de manera segura
create or replace function public.link_character_to_story(
  p_story_id uuid,
  p_character_id uuid,
  p_user_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  -- Verificar que la historia existe y pertenece al usuario
  if not exists (
    select 1 
    from public.stories 
    where id = p_story_id 
    and user_id = p_user_id
  ) then
    raise exception 'La historia no existe o no tienes permisos';
  end if;

  -- Verificar que el personaje existe y pertenece al usuario
  if not exists (
    select 1 
    from public.characters 
    where id = p_character_id 
    and user_id = p_user_id
  ) then
    raise exception 'El personaje no existe o no tienes permisos';
  end if;

  -- Insertar la relación si no existe
  insert into public.story_characters (story_id, character_id)
  values (p_story_id, p_character_id)
  on conflict (story_id, character_id) do nothing;
end;
$$;

-- Otorgar permisos a la función para usuarios autenticados
grant execute on function public.link_character_to_story(uuid, uuid, uuid) to authenticated;
