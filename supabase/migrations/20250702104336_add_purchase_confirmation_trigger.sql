-- Función para enviar email de confirmación de compra cuando orden es pagada
CREATE OR REPLACE FUNCTION send_purchase_confirmation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo proceder si el status cambió a 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Llamar a la edge function de forma asíncrona
    PERFORM
      net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/send-purchase-confirmation',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'order_id', NEW.id
        ),
        timeout_milliseconds := 5000
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta después de UPDATE en la tabla orders
DROP TRIGGER IF EXISTS trigger_send_purchase_confirmation ON orders;
CREATE TRIGGER trigger_send_purchase_confirmation
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION send_purchase_confirmation_email();

-- Comentario para documentar el trigger
COMMENT ON TRIGGER trigger_send_purchase_confirmation ON orders IS 
'Envía email de confirmación automáticamente cuando una orden cambia a status paid';