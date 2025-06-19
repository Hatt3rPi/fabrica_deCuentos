-- Crear políticas para el bucket 'storage' si no existen
-- Esto permite a los administradores subir imágenes a la carpeta style_design

-- Política para permitir uploads a administradores en la carpeta style_design
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'storage',
  'Admins can upload to style_design folder',
  jsonb_build_object(
    'effect', 'allow',
    'subject', jsonb_build_object(
      'kind', 'user',
      'roles', jsonb_build_array('authenticated')
    ),
    'action', jsonb_build_object(
      'permission', true
    ),
    'object', jsonb_build_object(
      'paths', jsonb_build_array('style_design/*')
    ),
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'expression', 'auth.jwt() ->> ''role'' = ''admin'''
      )
    )
  ),
  'INSERT'
) ON CONFLICT (bucket_id, name, operation) DO UPDATE
SET definition = EXCLUDED.definition;

-- Política para permitir actualizaciones
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'storage',
  'Admins can update style_design files',
  jsonb_build_object(
    'effect', 'allow',
    'subject', jsonb_build_object(
      'kind', 'user',
      'roles', jsonb_build_array('authenticated')
    ),
    'action', jsonb_build_object(
      'permission', true
    ),
    'object', jsonb_build_object(
      'paths', jsonb_build_array('style_design/*')
    ),
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'expression', 'auth.jwt() ->> ''role'' = ''admin'''
      )
    )
  ),
  'UPDATE'
) ON CONFLICT (bucket_id, name, operation) DO UPDATE
SET definition = EXCLUDED.definition;

-- Política para permitir lectura pública de style_design
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'storage',
  'Public can read style_design files',
  jsonb_build_object(
    'effect', 'allow',
    'subject', jsonb_build_object(
      'kind', 'user',
      'roles', jsonb_build_array('anon', 'authenticated')
    ),
    'action', jsonb_build_object(
      'permission', true
    ),
    'object', jsonb_build_object(
      'paths', jsonb_build_array('style_design/*')
    )
  ),
  'SELECT'
) ON CONFLICT (bucket_id, name, operation) DO UPDATE
SET definition = EXCLUDED.definition;

-- Política para permitir eliminación a administradores
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'storage',
  'Admins can delete style_design files',
  jsonb_build_object(
    'effect', 'allow',
    'subject', jsonb_build_object(
      'kind', 'user',
      'roles', jsonb_build_array('authenticated')
    ),
    'action', jsonb_build_object(
      'permission', true
    ),
    'object', jsonb_build_object(
      'paths', jsonb_build_array('style_design/*')
    ),
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'expression', 'auth.jwt() ->> ''role'' = ''admin'''
      )
    )
  ),
  'DELETE'
) ON CONFLICT (bucket_id, name, operation) DO UPDATE
SET definition = EXCLUDED.definition;