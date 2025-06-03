Épica: WIZARD - [3] VISUALIZACIÓN
Categoría: feature/mejora-flujo-generacion
Notas para devs:
- Asegurar consistencia entre las tablas story_pages y stories
- Mantener la integridad referencial
- Optimizar consultas para el home

Archivos afectados:
- `supabase/functions/generate-cover/index.ts` (modificar)
- `src/pages/Home.tsx` (modificar)
- `src/components/StoryCard.tsx` (modificar posiblemente)
- `src/contexts/StoryContext.tsx` (modificar)
- `src/types/supabase.ts` (verificar tipos)

🧠 Contexto:
Actualmente, al generar una historia, necesitamos asegurar que la portada y las páginas se almacenen correctamente en la base de datos, y que la interfaz de usuario refleje estos cambios de manera consistente.

📐 Objetivo:
Implementar un flujo completo donde:
1. La portada generada se almacene correctamente en story_pages
2. El home muestre la portada de cada historia
3. La navegación se habilite correctamente después de generar la portada

✅ CRITERIOS DE ÉXITO:
1. La tabla story_pages debe contener:
   - Una entrada con page_number = 0 para la portada
   - El título de la historia en el campo text
   - La URL de la imagen generada
   - El prompt utilizado para generar la portada
2. El home debe mostrar la imagen de portada en cada tarjeta de historia
3. El botón "Siguiente" se debe habilitar automáticamente después de generar la portada
4. Todas las páginas deben tener su respectivo prompt almacenado

❌ CRITERIOS DE FALLA:
1. La portada no se guarda en story_pages
2. La imagen no se muestra en el home
3. El botón "Siguiente" no se habilita
4. Pérdida de datos durante el proceso de guardado
5. Inconsistencias entre las tablas stories y story_pages

🧪 QA / Casos de prueba esperados:
1. Generar una nueva historia
   - Verificar que se cree la entrada en story_pages con page_number = 0
   - Confirmar que la URL de la imagen se guarde correctamente
   - Verificar que el prompt se almacene correctamente
2. Navegar al home
   - Confirmar que la tarjeta de la historia muestre la portada generada
3. Flujo de navegación
   - Verificar que el botón "Siguiente" se habilite después de generar la portada
   - Confirmar que la navegación al paso de diseño funcione correctamente

EXTRAS:
- Considerar agregar un indicador de carga mientras se genera la portada
- Validar que los permisos de la tabla story_pages sean los correctos
- Considerar agregar índices para mejorar el rendimiento de las consultas
