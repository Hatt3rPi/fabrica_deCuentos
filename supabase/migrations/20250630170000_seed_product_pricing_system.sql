-- Seed data para el sistema de precios y productos de La CuenterIA
-- Datos de prueba completos para testing del carrito de compras
-- Creado: 2025-06-30

-- ==========================================
-- 1. PRODUCTOS ADICIONALES PARA TESTING
-- ==========================================

-- Agregar más tipos de productos para testing completo
INSERT INTO product_types (name, description, category, status, metadata) VALUES
('Libro Digital Básico', 'Versión básica del cuento personalizado en PDF', 'digital', 'active', 
 '{"format": "pdf", "pages": "8-12", "illustrations": "básicas"}'),
('Libro Digital Premium', 'Versión premium con ilustraciones adicionales', 'digital', 'active',
 '{"format": "pdf", "pages": "16-20", "illustrations": "premium", "extras": ["dedicatoria", "páginas_adicionales"]}'),
('Libro Físico Estándar', 'Cuento impreso en papel de calidad', 'physical', 'active',
 '{"format": "impreso", "paper": "couché", "binding": "grapa", "size": "A4"}'),
('Libro Físico Premium', 'Cuento impreso en papel premium con tapa dura', 'physical', 'inactive',
 '{"format": "impreso", "paper": "premium", "binding": "tapa_dura", "size": "A4"}'),
('Paquete Familiar', 'Cuento digital + impreso + versiones adicionales', 'premium', 'inactive',
 '{"includes": ["digital", "físico", "versión_abuelos"], "discount": 15}')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 2. PRECIOS DE TESTING VARIADOS
-- ==========================================

-- Precios para Libro Digital Básico
INSERT INTO product_prices (product_type_id, price, currency, discount_percentage, notes, created_at)
SELECT 
  pt.id,
  1500.00, -- $1500 CLP
  'CLP',
  0, -- Sin descuento
  'Precio base para versión básica del libro digital',
  now()
FROM product_types pt 
WHERE pt.name = 'Libro Digital Básico'
AND NOT EXISTS (
  SELECT 1 FROM product_prices pp WHERE pp.product_type_id = pt.id
);

-- Precios para Libro Digital Premium (con descuento de lanzamiento)
INSERT INTO product_prices (product_type_id, price, currency, discount_percentage, notes, created_at)
SELECT 
  pt.id,
  2990.00, -- $2990 CLP
  'CLP',
  20, -- 20% descuento de lanzamiento
  'Precio de lanzamiento con 20% descuento para versión premium',
  now()
FROM product_types pt 
WHERE pt.name = 'Libro Digital Premium'
AND NOT EXISTS (
  SELECT 1 FROM product_prices pp WHERE pp.product_type_id = pt.id
);

-- Precios para Libro Físico Estándar
INSERT INTO product_prices (product_type_id, price, currency, discount_percentage, notes, created_at)
SELECT 
  pt.id,
  8990.00, -- $8990 CLP (incluye impresión y envío)
  'CLP',
  0,
  'Precio libro físico estándar con envío incluido',
  now()
FROM product_types pt 
WHERE pt.name = 'Libro Físico Estándar'
AND NOT EXISTS (
  SELECT 1 FROM product_prices pp WHERE pp.product_type_id = pt.id
);

-- Precio histórico para testing (precio anterior del libro digital básico)
INSERT INTO product_prices (product_type_id, price, currency, discount_percentage, valid_from, valid_to, notes, created_at)
SELECT 
  pt.id,
  1200.00, -- Precio anterior más bajo
  'CLP',
  0,
  now() - interval '30 days', -- Válido desde hace 30 días
  now() - interval '1 day',   -- Hasta ayer
  'Precio promocional inicial (ya expirado)',
  now() - interval '30 days'
FROM product_types pt 
WHERE pt.name = 'Libro Digital Básico'
AND NOT EXISTS (
  SELECT 1 FROM product_prices pp 
  WHERE pp.product_type_id = pt.id 
  AND pp.price = 1200.00
);

-- ==========================================
-- 3. DATOS DE TESTING PARA ÓRDENES
-- ==========================================

-- Función helper para crear órdenes de testing (solo si no existen)
DO $$
DECLARE
  v_test_user_id UUID;
  v_digital_basic_id UUID;
  v_digital_premium_id UUID;
  v_test_story_id UUID;
  v_order_id UUID;
BEGIN
  -- Buscar usuario de testing
  SELECT id INTO v_test_user_id 
  FROM auth.users 
  WHERE email = 'tester@lacuenteria.cl'
  LIMIT 1;
  
  -- Solo proceder si existe el usuario de testing
  IF v_test_user_id IS NOT NULL THEN
    
    -- Obtener IDs de productos
    SELECT id INTO v_digital_basic_id FROM product_types WHERE name = 'Libro Digital Básico';
    SELECT id INTO v_digital_premium_id FROM product_types WHERE name = 'Libro Digital Premium';
    
    -- Buscar una historia completada del usuario de testing
    SELECT id INTO v_test_story_id 
    FROM stories 
    WHERE user_id = v_test_user_id 
    AND status = 'completed'
    LIMIT 1;
    
    -- Crear orden de ejemplo solo si hay historia y productos disponibles
    IF v_test_story_id IS NOT NULL AND v_digital_basic_id IS NOT NULL THEN
      
      -- Verificar que no exista ya una orden de testing
      IF NOT EXISTS (
        SELECT 1 FROM orders 
        WHERE user_id = v_test_user_id 
        AND order_type = 'cart'
        AND status = 'paid'
      ) THEN
        
        -- Crear orden de testing pagada
        INSERT INTO orders (
          user_id, order_type, status, subtotal, total_amount, 
          currency, payment_method, paid_at, created_at
        ) VALUES (
          v_test_user_id, 'cart', 'paid', 1500.00, 1500.00,
          'CLP', 'testing', now() - interval '1 hour', now() - interval '1 hour'
        ) RETURNING id INTO v_order_id;
        
        -- Crear item de la orden
        INSERT INTO order_items (
          order_id, story_id, product_type_id, quantity, 
          unit_price, total_price, created_at
        ) VALUES (
          v_order_id, v_test_story_id, v_digital_basic_id, 1,
          1500.00, 1500.00, now() - interval '1 hour'
        );
        
        RAISE NOTICE 'Orden de testing creada con ID: %', v_order_id;
      END IF;
    END IF;
  END IF;
END;
$$;

-- ==========================================
-- 4. FUNCIÓN HELPER PARA OBTENER PRODUCTO DEFAULT
-- ==========================================

-- Función para obtener el producto por defecto (usado por el carrito)
CREATE OR REPLACE FUNCTION get_default_product_type()
RETURNS TABLE(id UUID, name VARCHAR, description TEXT, category VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT pt.id, pt.name, pt.description, pt.category
  FROM product_types pt
  WHERE pt.status = 'active'
    AND pt.category = 'digital'
  ORDER BY 
    CASE 
      WHEN pt.name = 'Libro Digital' THEN 1
      WHEN pt.name = 'Libro Digital Básico' THEN 2
      ELSE 3
    END
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_default_product_type() TO authenticated;

-- ==========================================
-- 5. COMENTARIOS Y DOCUMENTACIÓN
-- ==========================================

COMMENT ON FUNCTION get_default_product_type() IS 'Obtiene el tipo de producto por defecto para el carrito (prioriza Libro Digital)';

-- Agregar metadatos a la tabla para identificar datos de seed
UPDATE product_types 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'), 
  '{seed_data}', 
  'true'
) 
WHERE name IN (
  'Libro Digital Básico', 
  'Libro Digital Premium', 
  'Libro Físico Estándar',
  'Libro Físico Premium',
  'Paquete Familiar'
);

-- ==========================================
-- 6. VALIDACIONES Y VERIFICACIONES
-- ==========================================

-- Verificar que tenemos productos activos para el carrito
DO $$
DECLARE
  v_active_products INTEGER;
  v_default_product_exists BOOLEAN;
BEGIN
  -- Contar productos activos
  SELECT COUNT(*) INTO v_active_products 
  FROM product_types 
  WHERE status = 'active';
  
  -- Verificar que existe un producto por defecto
  SELECT EXISTS(SELECT 1 FROM get_default_product_type()) INTO v_default_product_exists;
  
  -- Mostrar información de verificación
  RAISE NOTICE '=== VERIFICACIÓN DE SEED DATA ===';
  RAISE NOTICE 'Productos activos: %', v_active_products;
  RAISE NOTICE 'Producto por defecto disponible: %', v_default_product_exists;
  
  IF v_active_products = 0 THEN
    RAISE WARNING 'No hay productos activos disponibles para el carrito';
  END IF;
  
  IF NOT v_default_product_exists THEN
    RAISE WARNING 'No se pudo encontrar un producto por defecto para el carrito';
  END IF;
  
  RAISE NOTICE '=== SEED COMPLETADO EXITOSAMENTE ===';
END;
$$;