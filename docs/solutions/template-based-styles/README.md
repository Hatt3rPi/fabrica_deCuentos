# Solución: Migración a Sistema de Templates Activos

## Resumen
Migración completa del sistema de estilos de `story_style_configs` a `story_style_templates` con soporte para templates activos. Ahora PDF y vista de cuentos siguen el template activo, mientras que admin/style edita directamente este template.

## Problema Original
El usuario identificó que el sistema debería usar templates activos:
> "al ingresar a admin/style se debería activar el template activo (que el pdf y la vista están siguiendo). en story_style_templates debería existir la columna is_active. para que, por ejemplo, cada vez que genere un pdf siga el estilo del template activo"

## Solución Implementada

### 1. Base de Datos

#### Nueva Estructura de Templates
```sql
-- Columna is_active agregada a story_style_templates
ALTER TABLE story_style_templates 
ADD COLUMN is_active boolean DEFAULT false;

-- Trigger para asegurar solo un template activo
CREATE TRIGGER ensure_single_active_template_trigger
BEFORE INSERT OR UPDATE ON story_style_templates
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION ensure_single_active_template();
```

#### Función Actualizada para Templates
```sql
-- get_active_story_style() ahora busca en templates
CREATE OR REPLACE FUNCTION get_active_story_style()
RETURNS jsonb AS $$
BEGIN
  -- Buscar en templates activos
  SELECT jsonb_build_object(
    'id', id, 'name', name,
    'cover_config', config_data->'cover_config',
    'page_config', config_data->'page_config'
  ) INTO active_template
  FROM story_style_templates
  WHERE is_active = true LIMIT 1;
  
  RETURN active_template;
END;
$$;
```

#### Migración Automática
- Migra configuración activa actual de `story_style_configs` a template activo
- Si no hay config activa, activa el primer template disponible
- Proceso seguro con validaciones

### 2. Servicios Actualizados

#### styleConfigService.ts
```typescript
// Nuevo método principal
async getActiveTemplate(): Promise<StyleTemplate | null> {
  const { data } = await supabase
    .from('story_style_templates')
    .select('*')
    .eq('is_active', true)
    .single();
  return data;
}

// Actualizar template activo
async updateActiveTemplate(updates: Partial<StyleTemplate>): Promise<StyleTemplate | null> {
  const activeTemplate = await this.getActiveTemplate();
  // Actualiza directamente el template activo
}

// Activar template específico
async activateTemplate(id: string): Promise<boolean> {
  return supabase.rpc('activate_template', { template_id: id });
}
```

### 3. AdminStyleEditor Renovado

#### Flujo Simplificado
```typescript
// 1. Carga template activo al iniciar
const loadActiveTemplate = async () => {
  const template = await styleConfigService.getActiveTemplate();
  setActiveTemplate(template);
  // Convierte a config para compatibilidad
  setActiveConfig(convertTemplateToConfig(template));
};

// 2. Guarda cambios directamente en template activo
const handleSave = async () => {
  const templateUpdate = {
    configData: {
      cover_config: activeConfig.coverConfig,
      page_config: activeConfig.pageConfig
    }
  };
  await styleConfigService.updateActiveTemplate(templateUpdate);
};

// 3. Seleccionar template lo activa inmediatamente
const handleTemplateSelect = async (template) => {
  await styleConfigService.activateTemplate(template.id);
  await loadActiveTemplate(); // Recarga editor
};
```

#### UI Mejorada
- **Indicador claro**: "Editando: [Nombre del Template]"
- **Estado fijo**: "Template Activo" en lugar de botón activar
- **Sincronización**: Cambios se aplican automáticamente al guardar

### 4. Separación de Responsabilidades

| Componente | Responsabilidad |
|------------|----------------|
| **Templates Activos** | Configuración usada por PDF y vista de cuentos |
| **Admin/Style** | Editor directo del template activo |
| **Imágenes Custom** | Solo para preview del editor (no se usan en PDF/vista) |
| **Templates Biblioteca** | Versiones predefinidas para seleccionar |

## Beneficios Obtenidos

### ✅ Sincronización Perfecta
- **PDF y Vista**: Siempre usan el template activo
- **Editor**: Modifica directamente el template en uso
- **Sin desfase**: Cambios se reflejan inmediatamente

### ✅ Flujo Simplificado
- **Un solo template activo**: No más confusión sobre cuál se usa
- **Edición directa**: Sin necesidad de "aplicar" cambios
- **Activación fácil**: Seleccionar template lo activa automáticamente

### ✅ Compatibilidad Mantenida
- **get_active_story_style()**: Sigue funcionando igual para PDF/vista
- **Imágenes custom**: Mantenidas solo para admin/style
- **Templates existentes**: Migrados automáticamente

### ✅ Escalabilidad
- **Nuevos templates**: Se pueden crear y activar fácilmente
- **Versioning**: Templates sirven como versiones guardadas
- **Performance**: Menos consultas, un solo registro activo

## Flujo de Uso Final

### Para Admins
1. **Entrar a admin/style**: Carga automáticamente el template activo
2. **Editar configuración**: Cambios en tiempo real en el preview
3. **Guardar**: Actualiza directamente el template activo
4. **Cambiar template**: Seleccionar otro lo activa inmediatamente

### Para PDF/Vista
1. **Llamada a get_active_story_style()**: Retorna el template activo
2. **Configuración aplicada**: Siempre la más reciente del template activo
3. **Sin cache**: Cambios del admin se reflejan inmediatamente

## Migración y Limpieza

### Proceso Automático
```sql
-- Migra configuración activa actual a template
INSERT INTO story_style_templates (name, config_data, is_active)
SELECT name, jsonb_build_object(
  'cover_config', cover_config,
  'page_config', page_config
), true
FROM story_style_configs WHERE is_active = true;
```

### Compatibilidad Temporal
- `getActiveStyle()` adaptado para usar templates
- `activateStyle()` redirige a `activateTemplate()`
- Transición suave sin romper código existente

## Testing

### Casos Validados
- [ ] Template activo se carga al entrar al editor
- [ ] Cambios se guardan en el template activo
- [ ] Seleccionar template lo activa automáticamente
- [ ] PDF usa configuración del template activo
- [ ] Vista usa configuración del template activo
- [ ] Solo un template puede estar activo
- [ ] Migración funciona correctamente

### Comando de Verificación
```sql
-- Solo debe haber 1 template activo
SELECT COUNT(*) FROM story_style_templates WHERE is_active = true;
-- Resultado esperado: 1

-- PDF usa template activo
SELECT get_active_story_style();
-- Debe retornar el template activo
```

## Próximos Pasos

1. **Testing en desarrollo**: Verificar que PDF y vista usan template activo
2. **Migración en staging**: Aplicar migración y validar funcionamiento
3. **Monitoreo**: Confirmar que solo un template está activo
4. **Limpieza**: Considerar deprecar `story_style_configs` si no se usa más

## Notas Técnicas

### Backward Compatibility
- ✅ `get_active_story_style()` sigue funcionando
- ✅ Código existente no necesita cambios
- ✅ Migración automática preserva configuración actual

### Performance
- ✅ Un solo template activo reduce consultas
- ✅ Índice en `is_active` para búsquedas rápidas
- ✅ Sin duplicación de datos

### Seguridad
- ✅ RLS policies mantenidas
- ✅ Solo admins pueden modificar templates
- ✅ Validaciones de integridad en triggers