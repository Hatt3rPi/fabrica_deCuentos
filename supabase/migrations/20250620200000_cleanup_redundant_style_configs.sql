-- Limpiar registros redundantes de story_style_configs
-- Mantener solo el registro activo y el default (si es diferente)

DO $$
DECLARE
    active_id UUID;
    default_id UUID;
BEGIN
    -- Obtener ID del registro activo
    SELECT id INTO active_id 
    FROM story_style_configs 
    WHERE is_active = true 
    LIMIT 1;
    
    -- Obtener ID del registro default
    SELECT id INTO default_id 
    FROM story_style_configs 
    WHERE is_default = true 
    LIMIT 1;
    
    -- Si no hay registro activo pero hay default, convertir default en activo
    IF active_id IS NULL AND default_id IS NOT NULL THEN
        UPDATE story_style_configs 
        SET is_active = true 
        WHERE id = default_id;
        active_id := default_id;
    END IF;
    
    -- Eliminar todos los registros excepto el activo
    -- (Si active_id y default_id son el mismo, solo se mantiene uno)
    DELETE FROM story_style_configs 
    WHERE id != COALESCE(active_id, default_id)
    AND NOT (id = default_id AND default_id != active_id);
    
    RAISE NOTICE 'Cleanup completed. Active ID: %, Default ID: %', active_id, default_id;
END $$;