-- DIAGNÓSTICO DE LA FUNCIÓN get_user_roles
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar si la función get_user_roles existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_user_roles'
AND routine_schema = 'public';

-- 2. Si no existe, crear la función get_user_roles
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS TABLE (
    role VARCHAR,
    granted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar que el usuario está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Retornar roles activos del usuario actual
    RETURN QUERY
    SELECT 
        ur.role::VARCHAR,
        ur.created_at as granted_at,
        ur.expires_at,
        ur.notes
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    ORDER BY ur.created_at DESC;
END;
$$;

-- 3. Verificar que la función se creó correctamente
SELECT 'Función get_user_roles creada exitosamente' as resultado;

-- 4. Probar la función con el usuario actual
SELECT * FROM get_user_roles();

-- 5. Verificar datos directamente en user_roles para el usuario fabarca212@gmail.com
SELECT 
    ur.*,
    au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'fabarca212@gmail.com'
AND ur.is_active = true;

-- 6. Verificar función has_permission existe
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'has_permission'
AND routine_schema = 'public';

-- 7. Verificar grants de la función
GRANT EXECUTE ON FUNCTION get_user_roles() TO authenticated;