-- Sistema de gestión de precios y productos para La CuenterIA
-- Migración para habilitar monetización con pago simbólico por libros digitales
-- Diseñado para trabajar con sistema de fulfillment existente

-- 1. Tabla de tipos de productos base
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) DEFAULT 'digital', -- digital, physical, premium
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, discontinued
  metadata JSONB DEFAULT '{}', -- campos flexibles para futura extensión
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentarios explicativos
COMMENT ON TABLE product_types IS 'Tipos de productos disponibles (libro digital, libro físico, premium, etc.)';
COMMENT ON COLUMN product_types.category IS 'Categoría del producto: digital, physical, premium';
COMMENT ON COLUMN product_types.metadata IS 'Datos adicionales como características, limitaciones, etc.';

-- 2. Tabla de precios con versionado temporal
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID REFERENCES product_types(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'CLP',
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_to TIMESTAMP WITH TIME ZONE, -- NULL = indefinido
  discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (price * (100 - discount_percentage) / 100) STORED,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT -- razón del cambio de precio
);

-- Comentarios explicativos
COMMENT ON TABLE product_prices IS 'Historial de precios con versionado temporal para gestión dinámica';
COMMENT ON COLUMN product_prices.final_price IS 'Precio final calculado automáticamente aplicando descuento';
COMMENT ON COLUMN product_prices.valid_from IS 'Fecha desde cuándo es válido este precio';
COMMENT ON COLUMN product_prices.valid_to IS 'Fecha hasta cuándo es válido (NULL = indefinido)';

-- 3. Tabla de órdenes (carrito + individual story orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_type VARCHAR(20) DEFAULT 'cart', -- cart, individual, subscription
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded, expired
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CLP',
  payment_method VARCHAR(50), -- flow, transbank, manual, etc.
  payment_data JSONB DEFAULT '{}', -- transaction_id, gateway_response, etc.
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentarios explicativos  
COMMENT ON TABLE orders IS 'Órdenes de compra que pueden contener múltiples historias';
COMMENT ON COLUMN orders.order_type IS 'Tipo de orden: cart (carrito), individual (historia única), subscription (futuro)';
COMMENT ON COLUMN orders.expires_at IS 'Las órdenes expiran en 24h si no se pagan';
COMMENT ON COLUMN orders.payment_data IS 'Datos específicos del proveedor de pago (transaction_id, etc.)';

-- 4. Tabla de items de orden (relación orden -> historias)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  product_type_id UUID REFERENCES product_types(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentarios explicativos
COMMENT ON TABLE order_items IS 'Items individuales dentro de una orden (historias específicas)';
COMMENT ON COLUMN order_items.unit_price IS 'Precio unitario al momento de la compra (snapshot)';
COMMENT ON COLUMN order_items.total_price IS 'Precio total del item (unit_price * quantity - discount)';

-- 5. Función para obtener precio actual de un producto
CREATE OR REPLACE FUNCTION get_current_price(p_product_type_id UUID)
RETURNS TABLE(price DECIMAL, final_price DECIMAL, currency VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT pp.price, pp.final_price, pp.currency
  FROM product_prices pp
  WHERE pp.product_type_id = p_product_type_id
    AND pp.valid_from <= now()
    AND (pp.valid_to IS NULL OR pp.valid_to > now())
  ORDER BY pp.valid_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para crear orden automática cuando story se completa (integración con fulfillment)
CREATE OR REPLACE FUNCTION auto_create_order_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_product_type_id UUID;
  v_price_info RECORD;
  v_order_id UUID;
BEGIN
  -- Solo procesar cambios de draft a completed
  IF OLD.status = 'draft' AND NEW.status = 'completed' THEN
    
    -- Obtener producto tipo por defecto (libro digital)
    SELECT id INTO v_product_type_id 
    FROM product_types 
    WHERE name = 'Libro Digital' AND status = 'active'
    LIMIT 1;
    
    -- Si existe sistema de precios, crear orden automática
    IF v_product_type_id IS NOT NULL THEN
      -- Obtener precio actual
      SELECT * INTO v_price_info FROM get_current_price(v_product_type_id);
      
      IF v_price_info IS NOT NULL THEN
        -- Crear orden automática
        INSERT INTO orders (user_id, order_type, total_amount, currency, status)
        VALUES (NEW.user_id, 'individual', v_price_info.final_price, v_price_info.currency, 'paid')
        RETURNING id INTO v_order_id;
        
        -- Crear item de la orden
        INSERT INTO order_items (order_id, story_id, product_type_id, quantity, unit_price, total_price)
        VALUES (v_order_id, NEW.id, v_product_type_id, 1, v_price_info.final_price, v_price_info.final_price);
        
        -- Marcar orden como pagada inmediatamente (fase de transición)
        UPDATE orders SET paid_at = now() WHERE id = v_order_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para auto-crear órdenes (se ejecuta DESPUÉS del trigger de fulfillment)
DROP TRIGGER IF EXISTS trigger_auto_create_order ON stories;
CREATE TRIGGER trigger_auto_create_order
  AFTER UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_order_on_completion();

-- 7. Función para procesar pago de orden
CREATE OR REPLACE FUNCTION process_order_payment(
  p_order_id UUID,
  p_payment_method VARCHAR(50),
  p_payment_data JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_order_record RECORD;
  v_result JSONB;
BEGIN
  -- Verificar que la orden existe y está pendiente
  SELECT * INTO v_order_record FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orden no encontrada');
  END IF;
  
  IF v_order_record.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orden ya procesada');
  END IF;
  
  IF v_order_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orden expirada');
  END IF;
  
  -- Actualizar orden como pagada
  UPDATE orders 
  SET status = 'paid',
      payment_method = p_payment_method,
      payment_data = p_payment_data,
      paid_at = now(),
      updated_at = now()
  WHERE id = p_order_id;
  
  -- Activar fulfillment para todas las historias de la orden
  UPDATE stories 
  SET fulfillment_status = 'pendiente'
  WHERE id IN (
    SELECT story_id FROM order_items WHERE order_id = p_order_id
  ) AND fulfillment_status IS NULL;
  
  RETURN jsonb_build_object(
    'success', true, 
    'order_id', p_order_id,
    'total_amount', v_order_record.total_amount
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_prices_active ON product_prices(product_type_id, valid_from DESC)
WHERE valid_to IS NULL OR valid_to > now();

CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_expires ON orders(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_story ON order_items(story_id);

-- 9. Políticas RLS

-- Product Types - Solo admins pueden gestionar
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active product types" ON product_types
  FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY "Only admins can manage product types" ON product_types
  FOR ALL TO authenticated
  USING (has_permission('products.manage'))
  WITH CHECK (has_permission('products.manage'));

-- Product Prices - Solo admins pueden gestionar  
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view current prices" ON product_prices
  FOR SELECT TO authenticated
  USING (valid_from <= now() AND (valid_to IS NULL OR valid_to > now()));

CREATE POLICY "Only admins can manage prices" ON product_prices
  FOR ALL TO authenticated
  USING (has_permission('products.manage'))
  WITH CHECK (has_permission('products.manage'));

-- Orders - Usuarios ven sus órdenes, admins ven todo
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending orders" ON orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT TO authenticated
  USING (has_permission('orders.view'));

CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL TO authenticated
  USING (has_permission('orders.manage'))
  WITH CHECK (has_permission('orders.manage'));

-- Order Items - Misma lógica que orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create order items for own orders" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid() AND status = 'pending')
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT TO authenticated
  USING (has_permission('orders.view'));

CREATE POLICY "Admins can manage order items" ON order_items
  FOR ALL TO authenticated
  USING (has_permission('orders.manage'))
  WITH CHECK (has_permission('orders.manage'));

-- 10. Crear vista para facilitar consultas de órdenes con items
CREATE OR REPLACE VIEW orders_with_items AS
SELECT 
  o.id,
  o.user_id,
  o.order_type,
  o.status,
  o.subtotal,
  o.discount_amount,
  o.tax_amount,
  o.total_amount,
  o.currency,
  o.payment_method,
  o.paid_at,
  o.created_at,
  o.updated_at,
  au.email as user_email,
  COALESCE(up.contact_person, split_part(au.email, '@', 1)) as user_name,
  (
    SELECT json_agg(json_build_object(
      'story_id', oi.story_id,
      'story_title', s.title,
      'product_type', pt.name,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price
    ))
    FROM order_items oi
    LEFT JOIN stories s ON oi.story_id = s.id
    LEFT JOIN product_types pt ON oi.product_type_id = pt.id
    WHERE oi.order_id = o.id
  ) as items
FROM orders o
LEFT JOIN auth.users au ON o.user_id = au.id  
LEFT JOIN user_profiles up ON o.user_id = up.user_id;

GRANT SELECT ON orders_with_items TO authenticated;

-- 11. Datos iniciales (productos base)
INSERT INTO product_types (name, description, category, status) VALUES
('Libro Digital', 'Cuento personalizado en formato PDF descargable', 'digital', 'active'),
('Libro Físico', 'Cuento personalizado impreso y enviado a domicilio', 'physical', 'inactive'),
('Cuento Premium', 'Cuento con ilustraciones adicionales y contenido extendido', 'premium', 'inactive')
ON CONFLICT (name) DO NOTHING;

-- Precio inicial para libro digital (pago simbólico)
INSERT INTO product_prices (product_type_id, price, currency, notes, created_at)
SELECT 
  pt.id,
  1990.00, -- $1990 CLP (pago simbólico)
  'CLP',
  'Precio de lanzamiento para libro digital personalizado',
  now()
FROM product_types pt 
WHERE pt.name = 'Libro Digital'
AND NOT EXISTS (
  SELECT 1 FROM product_prices pp WHERE pp.product_type_id = pt.id
);

-- 12. Grants finales
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_price(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_order_payment(UUID, VARCHAR, JSONB) TO authenticated;