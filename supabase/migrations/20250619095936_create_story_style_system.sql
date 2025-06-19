-- Crear tabla para configuraciones de estilo
CREATE TABLE IF NOT EXISTS story_style_configs (
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
  }'::jsonb,
  
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
  }'::jsonb
);

-- Índices para performance
CREATE INDEX idx_story_style_configs_active ON story_style_configs(is_active);
CREATE INDEX idx_story_style_configs_default ON story_style_configs(is_default);

-- Función para asegurar solo un estilo por defecto
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

-- Trigger para mantener un solo default
CREATE TRIGGER ensure_single_default_style_trigger
BEFORE INSERT OR UPDATE ON story_style_configs
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_style();

-- Función para asegurar solo un estilo activo
CREATE OR REPLACE FUNCTION ensure_single_active_style()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE story_style_configs 
    SET is_active = false 
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener un solo activo
CREATE TRIGGER ensure_single_active_style_trigger
BEFORE INSERT OR UPDATE ON story_style_configs
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION ensure_single_active_style();

-- Tabla para templates predefinidos
CREATE TABLE IF NOT EXISTS story_style_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('classic', 'modern', 'playful', 'elegant')),
  thumbnail_url text,
  config_data jsonb NOT NULL,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE story_style_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_style_templates ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y modificar configuraciones
CREATE POLICY "Admins can view style configs" ON story_style_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can insert style configs" ON story_style_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update style configs" ON story_style_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Todos pueden ver templates (para futuras features)
CREATE POLICY "Anyone can view style templates" ON story_style_templates
  FOR SELECT USING (true);

-- Solo admins pueden modificar templates
CREATE POLICY "Admins can manage style templates" ON story_style_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insertar configuración por defecto
INSERT INTO story_style_configs (name, description, is_active, is_default)
VALUES (
  'Estilo Por Defecto',
  'Configuración estándar para todos los cuentos',
  true,
  true
);

-- Insertar templates iniciales
INSERT INTO story_style_templates (name, category, config_data) VALUES
(
  'Clásico',
  'classic',
  '{
    "cover_config": {
      "title": {
        "fontSize": "3.5rem",
        "fontFamily": "Georgia, serif",
        "fontWeight": "normal",
        "color": "#2c3e50",
        "textAlign": "center",
        "textShadow": "1px 1px 2px rgba(0,0,0,0.3)",
        "position": "center",
        "containerStyle": {
          "background": "rgba(255,255,255,0.95)",
          "padding": "3rem 4rem",
          "borderRadius": "0.5rem",
          "maxWidth": "80%",
          "boxShadow": "0 4px 6px rgba(0,0,0,0.1)"
        }
      }
    },
    "page_config": {
      "text": {
        "fontSize": "1.8rem",
        "fontFamily": "Georgia, serif",
        "fontWeight": "normal",
        "lineHeight": "1.6",
        "color": "#2c3e50",
        "textAlign": "center",
        "textShadow": "none",
        "position": "bottom",
        "containerStyle": {
          "background": "rgba(255,255,255,0.9)",
          "padding": "2rem 3rem",
          "minHeight": "30%",
          "borderRadius": "0.5rem 0.5rem 0 0"
        }
      }
    }
  }'::jsonb
),
(
  'Moderno',
  'modern',
  '{
    "cover_config": {
      "title": {
        "fontSize": "5rem",
        "fontFamily": "Inter, sans-serif",
        "fontWeight": "800",
        "color": "#ffffff",
        "textAlign": "center",
        "textShadow": "4px 4px 8px rgba(0,0,0,0.9)",
        "position": "center",
        "containerStyle": {
          "background": "transparent",
          "padding": "2rem",
          "maxWidth": "90%"
        }
      }
    },
    "page_config": {
      "text": {
        "fontSize": "2rem",
        "fontFamily": "Inter, sans-serif",
        "fontWeight": "500",
        "lineHeight": "1.5",
        "color": "#ffffff",
        "textAlign": "left",
        "textShadow": "2px 2px 4px rgba(0,0,0,0.8)",
        "position": "bottom",
        "containerStyle": {
          "background": "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)",
          "padding": "2rem 3rem 3rem 3rem",
          "minHeight": "35%"
        }
      }
    }
  }'::jsonb
),
(
  'Infantil',
  'playful',
  '{
    "cover_config": {
      "title": {
        "fontSize": "4.5rem",
        "fontFamily": "Comic Neue, cursive",
        "fontWeight": "bold",
        "color": "#ff6b6b",
        "textAlign": "center",
        "textShadow": "3px 3px 0px #4ecdc4, 6px 6px 0px rgba(0,0,0,0.2)",
        "position": "center",
        "containerStyle": {
          "background": "rgba(255,255,255,0.9)",
          "padding": "2.5rem 3rem",
          "borderRadius": "2rem",
          "maxWidth": "85%",
          "border": "4px solid #4ecdc4"
        }
      }
    },
    "page_config": {
      "text": {
        "fontSize": "2.4rem",
        "fontFamily": "Comic Neue, cursive",
        "fontWeight": "bold",
        "lineHeight": "1.4",
        "color": "#2d3436",
        "textAlign": "center",
        "textShadow": "2px 2px 0px rgba(255,255,255,0.8)",
        "position": "bottom",
        "containerStyle": {
          "background": "rgba(255,234,167,0.95)",
          "padding": "2rem 2.5rem 2.5rem 2.5rem",
          "minHeight": "28%",
          "borderRadius": "2rem 2rem 0 0",
          "border": "3px solid #ff6b6b"
        }
      }
    }
  }'::jsonb
),
(
  'Elegante',
  'elegant',
  '{
    "cover_config": {
      "title": {
        "fontSize": "4rem",
        "fontFamily": "Playfair Display, serif",
        "fontWeight": "400",
        "color": "#d4af37",
        "textAlign": "center",
        "textShadow": "2px 2px 4px rgba(0,0,0,0.5)",
        "letterSpacing": "0.1em",
        "position": "center",
        "containerStyle": {
          "background": "rgba(0,0,0,0.7)",
          "padding": "3rem 4rem",
          "borderRadius": "0",
          "maxWidth": "75%",
          "border": "2px solid #d4af37"
        }
      }
    },
    "page_config": {
      "text": {
        "fontSize": "1.9rem",
        "fontFamily": "Crimson Text, serif",
        "fontWeight": "400",
        "lineHeight": "1.7",
        "color": "#ffffff",
        "textAlign": "justify",
        "textShadow": "1px 1px 3px rgba(0,0,0,0.7)",
        "position": "bottom",
        "containerStyle": {
          "background": "rgba(0,0,0,0.6)",
          "padding": "2.5rem 3.5rem 3rem 3.5rem",
          "minHeight": "32%",
          "borderTop": "1px solid #d4af37"
        }
      }
    }
  }'::jsonb
);

-- Función para obtener estilo activo con fallback
CREATE OR REPLACE FUNCTION get_active_story_style()
RETURNS jsonb AS $$
DECLARE
  active_style jsonb;
BEGIN
  SELECT 
    jsonb_build_object(
      'id', id,
      'name', name,
      'cover_config', cover_config,
      'page_config', page_config
    ) INTO active_style
  FROM story_style_configs
  WHERE is_active = true
  LIMIT 1;
  
  IF active_style IS NULL THEN
    -- Retornar configuración por defecto si no hay activa
    SELECT 
      jsonb_build_object(
        'id', id,
        'name', name,
        'cover_config', cover_config,
        'page_config', page_config
      ) INTO active_style
    FROM story_style_configs
    WHERE is_default = true
    LIMIT 1;
  END IF;
  
  RETURN active_style;
END;
$$ LANGUAGE plpgsql;

-- Actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_style_configs_updated_at
BEFORE UPDATE ON story_style_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();