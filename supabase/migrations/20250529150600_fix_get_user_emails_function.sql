-- Migración para corregir la función get_user_emails
-- Soluciona el problema de ambigüedad en la columna 'id'

-- Primero eliminamos la función existente
drop function if exists public.get_user_emails(uuid[]);

-- Luego la creamos de nuevo con los nombres de columnas explícitos
create or replace function public.get_user_emails(user_ids uuid[])
returns table (user_id uuid, user_email text) as $$
declare
  admin_emails text[] := array['fabarca212@gmail.com', 'lucianoalonso2000@gmail.com', 'javier2000asr@gmail.com'];
  current_user_id uuid;
  current_user_email text;
begin
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario esté autenticado
  if current_user_id is null then
    raise exception 'No autorizado';
  end if;
  
  -- Verificar que el usuario sea administrador
  select email into current_user_email
  from auth.users
  where id = current_user_id;
  
  if current_user_email is null or not (current_user_email = any(admin_emails)) then
    raise exception 'No tienes permisos para ver esta información';
  end if;
  
  -- Retornar solo los IDs y correos de los usuarios solicitados
  -- Usando nombres de tabla explícitos para evitar ambigüedades
  return query
  select 
    auth_users.id as user_id, 
    auth_users.email::text as user_email
  from 
    auth.users as auth_users
  where 
    auth_users.id = any(user_ids);
end;
$$ language plpgsql security definer;

-- Otorgar permisos a la función para usuarios autenticados
grant execute on function public.get_user_emails(uuid[]) to authenticated;

-- Comentario para documentar el propósito de esta migración
comment on function public.get_user_emails is 'Obtiene los correos electrónicos de usuarios por sus IDs, solo accesible por administradores. Corrige problemas de ambigüedad en la versión anterior.';
