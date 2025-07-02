-- Función para enviar email de confirmación de compra cuando orden es pagada
CREATE OR REPLACE FUNCTION send_purchase_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  http_response RECORD;
  log_context JSONB;
BEGIN
  -- Solo proceder si el status cambió a 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    
    -- Preparar contexto de logging
    log_context := jsonb_build_object(
      'order_id', NEW.id,
      'user_id', NEW.user_id,
      'total_amount', NEW.total_amount,
      'payment_method', NEW.payment_method,
      'trigger_timestamp', NOW()
    );
    
    -- Log inicio de operación
    RAISE LOG '[PURCHASE_CONFIRMATION_TRIGGER] Starting email notification for order %', NEW.id
      USING DETAIL = log_context::text;
    
    BEGIN
      -- Llamar a la edge function de forma asíncrona
      SELECT * INTO http_response FROM
        net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/send-purchase-confirmation',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
          ),
          body := jsonb_build_object(
            'order_id', NEW.id,
            'triggered_by', 'order_status_change'
          ),
          timeout_milliseconds := 10000  -- Incrementar timeout a 10s
        );
      
      -- Log éxito de llamada HTTP
      RAISE LOG '[PURCHASE_CONFIRMATION_TRIGGER] HTTP call completed for order %', NEW.id
        USING DETAIL = jsonb_build_object(
          'order_id', NEW.id,
          'http_status', http_response.status,
          'response_body', http_response.content::text
        )::text;
        
      -- Verificar si la respuesta fue exitosa
      IF http_response.status NOT BETWEEN 200 AND 299 THEN
        RAISE WARNING '[PURCHASE_CONFIRMATION_TRIGGER] HTTP call failed for order % with status %', 
          NEW.id, http_response.status
          USING DETAIL = jsonb_build_object(
            'order_id', NEW.id,
            'http_status', http_response.status,
            'error_response', http_response.content
          )::text;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error pero no fallar el trigger principal
        RAISE WARNING '[PURCHASE_CONFIRMATION_TRIGGER] Failed to send email notification for order %: % %', 
          NEW.id, SQLSTATE, SQLERRM
          USING DETAIL = jsonb_build_object(
            'order_id', NEW.id,
            'error_code', SQLSTATE,
            'error_message', SQLERRM,
            'trigger_context', log_context
          )::text;
    END;
    
  ELSE
    -- Log cuando trigger no procesa (para debugging)
    RAISE DEBUG '[PURCHASE_CONFIRMATION_TRIGGER] Skipping order % - status change from % to %', 
      NEW.id, COALESCE(OLD.status, 'NULL'), NEW.status;
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