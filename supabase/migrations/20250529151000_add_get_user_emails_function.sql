-- Función segura para obtener correos de usuarios
create or replace function public.get_user_emails(user_ids uuid[])
returns table (user_id uuid, user_email text) as $$
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
$$ language plpgsql security definer;

-- Otorgar permisos a la función para usuarios autenticados
grant execute on function public.get_user_emails(uuid[]) to authenticated;
