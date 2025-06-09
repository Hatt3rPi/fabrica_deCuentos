Épica: WIZARD - [2] DISEÑO DE HISTORIA
Categoría: feature/wizard-trigger-integration
Notas para devs: Este branch ya contiene la migración SQL y la integración básica. Se necesita validar que el trigger funcione correctamente y manejar los errores de validación en el frontend.

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/supabase/migrations/20250627000000_wizard_state_flow.sql (existente)
- /home/customware/lacuenteria/Lacuenteria/src/services/storyService.ts
- /home/customware/lacuenteria/Lacuenteria/src/context/WizardContext.tsx
- /home/customware/lacuenteria/Lacuenteria/src/stores/wizardFlowStore.ts
- /home/customware/lacuenteria/Lacuenteria/src/components/UI/Toast.tsx (nuevo)

🧠 Contexto:
El branch actual implementa un sistema de validación a nivel de base de datos para el flujo del wizard mediante un trigger SQL. Este trigger previene transiciones inválidas entre etapas (por ejemplo, no se puede iniciar "diseño" sin completar "cuento"). La integración ya está parcialmente implementada pero falta manejar los errores de validación en el frontend.

📐 Objetivo:
Asegurar que el trigger de validación funcione correctamente cuando el usuario hace click en "Siguiente" durante el flujo de creación de cuentos, mostrando mensajes de error claros si se intenta una transición inválida.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- El trigger valida correctamente las transiciones de estado en la BD
- Los errores de validación del trigger se capturan en el frontend
- Se muestra un toast/notificación clara al usuario si intenta una transición inválida
- El flujo normal sigue funcionando sin interrupciones cuando las transiciones son válidas
- Los logs de estado incluyen información sobre validaciones fallidas

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- Errores silenciosos sin feedback al usuario
- El wizard se queda bloqueado después de un error de validación
- Se pierden datos del usuario por errores de validación
- El trigger permite transiciones inválidas
- Mensajes de error técnicos incomprensibles para el usuario

🧪 QA / Casos de prueba esperados:
- Crear nuevo cuento → avanzar normalmente por todas las etapas → debe funcionar sin errores
- Intentar saltar de "personajes" a "diseño" manipulando el estado → debe mostrar error "No se puede iniciar diseño sin completar cuento"
- Intentar retroceder el estado de "completado" a "no_iniciada" → debe mostrar error "Estado de [etapa] invalido"
- Verificar que los errores del trigger lleguen al frontend con mensajes claros
- Confirmar que después de un error, el usuario puede corregir y continuar

EXTRAS:
- Implementar un componente Toast reutilizable para mostrar notificaciones
- Agregar traducción de mensajes de error del trigger (están en español en la BD)
- Considerar agregar un estado de loading mientras se valida la transición
- Los mensajes de error del trigger son: "Estado de personajes invalido", "Estado de cuento invalido", "Estado de diseño invalido", "Estado de vista previa invalido", "No se puede iniciar cuento sin completar personajes", "No se puede iniciar diseño sin completar cuento", "No se puede iniciar vista previa sin completar diseño"
