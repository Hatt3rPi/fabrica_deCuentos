-- Migration: Agregar columnas de fulfillment tracking a orders
-- Fecha: 2025-07-01

-- Agregar columnas de fulfillment a la tabla orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

-- Agregar columnas de PDF a la tabla stories si no existen
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_stories_pdf_url ON public.stories(pdf_url) WHERE pdf_url IS NOT NULL;

-- Función para obtener órdenes con fulfillment pendiente
CREATE OR REPLACE FUNCTION get_pending_fulfillment_orders()
RETURNS TABLE (
  order_id UUID,
  user_id UUID,
  user_email TEXT,
  total_amount DECIMAL(10,2),
  paid_at TIMESTAMPTZ,
  story_ids TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.user_id,
    au.email as user_email,
    o.total_amount,
    o.paid_at,
    ARRAY_AGG(oi.story_id) as story_ids
  FROM orders o
  JOIN auth.users au ON o.user_id = au.id
  JOIN order_items oi ON o.id = oi.order_id
  WHERE o.status = 'paid' 
    AND (o.fulfillment_status IS NULL OR o.fulfillment_status = 'pending')
  GROUP BY o.id, o.user_id, au.email, o.total_amount, o.paid_at
  ORDER BY o.paid_at ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pending_fulfillment_orders() TO authenticated;

-- Comentarios
COMMENT ON COLUMN orders.fulfillment_status IS 'Estado del cumplimiento de la orden (generación de PDFs)';
COMMENT ON COLUMN orders.fulfilled_at IS 'Timestamp cuando se completó el fulfillment';
COMMENT ON COLUMN stories.pdf_url IS 'URL del PDF generado para la historia';
COMMENT ON COLUMN stories.pdf_generated_at IS 'Timestamp cuando se generó el PDF';