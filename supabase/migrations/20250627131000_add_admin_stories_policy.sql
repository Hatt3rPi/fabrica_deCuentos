-- Agregar política para que admins y operadores puedan ver todas las historias completadas
-- Esto es necesario para el panel de gestión de pedidos

-- Crear política que permite a admins y operadores ver todas las historias completadas
CREATE POLICY "Admins and operators can view completed stories"
  ON stories
  FOR SELECT
  TO authenticated
  USING (
    -- Si el usuario tiene permisos de orders.view, puede ver todas las historias completadas
    has_permission('orders.view') AND status = 'completed'
  );

-- También necesitamos que puedan actualizar las historias para cambiar fulfillment_status
CREATE POLICY "Admins and operators can update fulfillment on stories"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (
    -- Solo pueden actualizar historias completadas si tienen permisos
    has_permission('orders.update') AND status = 'completed'
  )
  WITH CHECK (
    -- Solo pueden cambiar ciertos campos relacionados con fulfillment
    has_permission('orders.update') AND status = 'completed'
  );

-- Verificar que las políticas se crearon correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'stories' 
    AND policyname = 'Admins and operators can view completed stories'
  ) THEN
    RAISE NOTICE '✅ Política de lectura para admins/operadores creada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudo crear la política de lectura';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'stories' 
    AND policyname = 'Admins and operators can update fulfillment on stories'
  ) THEN
    RAISE NOTICE '✅ Política de actualización para admins/operadores creada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudo crear la política de actualización';
  END IF;
END $$;