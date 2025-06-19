# Plan de Sistema de Edición de Estilos para Administradores

## 📋 Resumen Ejecutivo

Sistema de edición visual tipo Word que permite a los administradores configurar el estilo de textos en cuentos, sincronizando perfectamente entre la vista de lectura web y el PDF exportado.

## 🎯 Objetivos

1. **Sincronización perfecta** entre vista web y PDF
2. **Editor intuitivo** similar a procesadores de texto
3. **Preview en tiempo real** con imagen y texto de muestra
4. **Configuración granular** de posición, tamaño, color y efectos
5. **Templates predefinidos** para diferentes estilos de cuentos

## 🗃️ Diseño de Base de Datos

### Tabla: `story_style_configs`

```sql
CREATE TABLE story_style_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  version integer DEFAULT 1,
  
  -- Configuración de portada
  cover_config jsonb NOT NULL DEFAULT '{
    "title": {
      "fontSize": "4rem",
      "fontFamily": "Indie Flower",
      "fontWeight": "bold",
      "color": "#ffffff",
      "textAlign": "center",
      "textShadow": "3px 3px 6px rgba(0,0,0,0.8)",
      "position": "center",
      "containerStyle": {
        "background": "transparent",
        "padding": "2rem 3rem",
        "borderRadius": "0",
        "maxWidth": "85%"
      }
    }
  }',
  
  -- Configuración de páginas internas
  page_config jsonb NOT NULL DEFAULT '{
    "text": {
      "fontSize": "2.2rem",
      "fontFamily": "Indie Flower",
      "fontWeight": "600",
      "lineHeight": "1.4",
      "color": "#ffffff",
      "textAlign": "center",
      "textShadow": "3px 3px 6px rgba(0,0,0,0.9)",
      "position": "bottom",
      "verticalAlign": "flex-end",
      "containerStyle": {
        "background": "transparent",
        "padding": "1rem 2rem 6rem 2rem",
        "minHeight": "25%",
        "gradientOverlay": "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.5), transparent)"
      }
    }
  }'
);

-- Índices
CREATE INDEX idx_story_style_configs_active ON story_style_configs(is_active);
CREATE INDEX idx_story_style_configs_default ON story_style_configs(is_default);

-- Trigger para solo un default activo
CREATE OR REPLACE FUNCTION ensure_single_default_style()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE story_style_configs 
    SET is_default = false 
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_style_trigger
BEFORE INSERT OR UPDATE ON story_style_configs
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_style();
```

### Tabla: `story_style_templates`

```sql
CREATE TABLE story_style_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL, -- 'classic', 'modern', 'playful', 'elegant'
  thumbnail_url text,
  config_data jsonb NOT NULL,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
```

## 🎨 Interfaz de Usuario

### Componente Principal: `AdminStyleEditor`

```typescript
interface StyleEditorState {
  // Preview
  previewImage: string;
  previewText: string;
  currentPageType: 'cover' | 'page';
  
  // Configuración activa
  activeConfig: StoryStyleConfig;
  
  // Estados de UI
  isDirty: boolean;
  isSaving: boolean;
  showGrid: boolean;
  showRulers: boolean;
  zoomLevel: number;
}
```

### Layout del Editor

```
┌─────────────────────────────────────────────────────────────┐
│  Toolbar: [Guardar] [Templates] [Zoom] [Grid] [Rulers]     │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                             │
│  Controls Panel │            Preview Canvas                  │
│                 │                                             │
│  ┌───────────┐  │  ┌─────────────────────────────────────┐  │
│  │ Tipografía │  │  │                                     │  │
│  ├───────────┤  │  │      [Imagen de fondo]              │  │
│  │ Posición  │  │  │                                     │  │
│  ├───────────┤  │  │                                     │  │
│  │ Colores   │  │  │      [Texto de muestra con         │  │
│  ├───────────┤  │  │       estilo aplicado]              │  │
│  │ Efectos   │  │  │                                     │  │
│  ├───────────┤  │  │                                     │  │
│  │ Container │  │  └─────────────────────────────────────┘  │
│  └───────────┘  │                                             │
│                 │  [Switch: Portada | Página]               │
└─────────────────┴───────────────────────────────────────────┘
```

## 🛠️ Controles de Edición

### 1. Panel de Tipografía
- **Fuente**: Dropdown con Google Fonts populares
- **Tamaño**: Slider + input (8px - 120px)
- **Peso**: 100-900 con presets
- **Altura de línea**: 1.0 - 3.0
- **Espaciado de letras**: -5px a 10px

### 2. Panel de Posición
- **Posición vertical**: Top, Center, Bottom + offset manual
- **Posición horizontal**: Left, Center, Right + offset manual
- **Padding**: Control de 4 lados independientes
- **Margen**: Control de 4 lados independientes
- **Ancho máximo**: Porcentaje o píxeles

### 3. Panel de Colores
- **Color de texto**: Color picker con presets
- **Opacidad**: 0-100%
- **Sombra de texto**: 
  - Offset X/Y
  - Blur
  - Color
  - Múltiples sombras

### 4. Panel de Efectos
- **Fondo del contenedor**:
  - Color sólido
  - Gradiente
  - Transparencia
  - Blur de fondo
- **Bordes**:
  - Radio
  - Estilo
  - Color
  - Ancho

### 5. Panel de Container
- **Overlay de gradiente**: Para mejorar legibilidad
- **Posición del container**: Flexible con drag & drop
- **Dimensiones**: Altura mínima/máxima

## 🔄 Sistema de Preview en Tiempo Real

### Componente: `StylePreview`

```typescript
interface StylePreviewProps {
  config: StoryStyleConfig;
  pageType: 'cover' | 'page';
  sampleImage: string;
  sampleText: string;
  showGrid: boolean;
  showRulers: boolean;
  zoomLevel: number;
}
```

### Características del Preview:
1. **Actualización instantánea** al cambiar cualquier valor
2. **Grid opcional** para alineación precisa
3. **Reglas** con medidas en px/rem
4. **Zoom** 25% - 200%
5. **Drag & Drop** para posicionar elementos
6. **Responsive preview** (móvil/tablet/desktop)

## 🔗 API y Sincronización

### Edge Function: `style-config`

```typescript
// GET: Obtener configuración activa
async function getActiveStyleConfig() {
  const { data } = await supabase
    .from('story_style_configs')
    .select('*')
    .eq('is_active', true)
    .single();
  
  return data || getDefaultConfig();
}

// POST: Guardar nueva configuración
async function saveStyleConfig(config: StoryStyleConfig) {
  // Validar permisos de admin
  // Crear nueva versión
  // Actualizar configuración activa
  return savedConfig;
}
```

### Sincronización con Componentes

1. **StoryReader**: Aplicar estilos desde configuración activa
2. **story-export**: Generar CSS dinámico desde configuración
3. **Cache**: Invalidar al cambiar configuración

## 📐 Sistema de Templates

### Templates Predefinidos:

1. **Clásico**
   - Fuente serif
   - Texto negro sobre fondo claro
   - Posición inferior centrada

2. **Moderno**
   - Fuente sans-serif
   - Texto blanco con sombra fuerte
   - Overlay de gradiente

3. **Infantil**
   - Fuente playful (Comic Sans, Indie Flower)
   - Colores vibrantes
   - Bordes redondeados

4. **Elegante**
   - Fuente script
   - Dorado/plateado
   - Efectos sutiles

## 🚀 Plan de Implementación

### Fase 1: Infraestructura (2-3 días)
1. Crear tablas en base de datos
2. Implementar API básica
3. Crear tipos TypeScript

### Fase 2: Editor Visual (3-4 días)
1. Layout principal del editor
2. Paneles de control
3. Sistema de preview
4. Drag & drop

### Fase 3: Integración (2-3 días)
1. Modificar StoryReader
2. Modificar story-export
3. Sistema de caché
4. Testing

### Fase 4: Polish (1-2 días)
1. Templates predefinidos
2. Validaciones
3. UX improvements
4. Documentación

## 🔒 Consideraciones de Seguridad

1. **Permisos**: Solo admins pueden acceder
2. **Validación**: Sanitizar todos los inputs CSS
3. **Límites**: Prevenir valores extremos
4. **Backup**: Versiones anteriores disponibles

## 📊 Métricas de Éxito

1. **Sincronización perfecta** entre web y PDF
2. **Tiempo de edición** < 5 minutos para configurar estilo
3. **Preview accuracy** 100% match con resultado final
4. **User satisfaction** de administradores

## 🎯 Entregables Finales

1. **Editor visual completo** en `/admin/style`
2. **Sistema de templates** con 4+ opciones
3. **API robusta** para gestión de estilos
4. **Sincronización perfecta** web/PDF
5. **Documentación completa** para admins