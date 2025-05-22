Épica: WIZARD - [1] CREACIÓN DE PERSONAJE
Categoría: Improvement
Notas para devs: Se requiere unificar las vistas de personajes existentes en el sistema. Actualmente hay dos componentes separados que manejan la misma funcionalidad: CharacterForm.tsx y CharactersStep.tsx. Se debe mantener la funcionalidad de CharacterForm.tsx pero con la interfaz visual de CharactersStep.tsx.

Archivos afectados:
- src/components/Character/CharacterForm.tsx
- src/components/Wizard/steps/CharactersStep.tsx
- src/components/Character/CharactersGrid.tsx
- src/components/Character/CharacterCard.tsx
- src/stores/characterStore.ts
- src/context/WizardContext.tsx
- src/App.tsx

🧠 Contexto:
Actualmente existen dos vistas diferentes para mostrar los personajes:
1. **CharacterForm.tsx**: Vista que se muestra inmediatamente después de guardar un personaje
2. **CharactersStep.tsx**: Vista que se accede desde Home → tarjeta de cuento → botón "Continuar"

La vista actual de CharactersStep.tsx es más moderna y consistente con el resto de la aplicación, utilizando:
- Grid layout con animaciones
- Tarjetas de personaje con miniaturas
- Botones de acción consistentes
- Manejo de errores mejorado
- Sistema de carga y generación de thumbnails más robusto

📐 Objetivo:
Unificar la experiencia de visualización de personajes manteniendo la funcionalidad completa:
- Mantener la funcionalidad de CharacterForm.tsx (generación de thumbnails, análisis de personajes)
- Adoptar la interfaz visual de CharactersStep.tsx
- Simplificar el flujo de navegación
- Mejorar la consistencia visual

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

- [ ] Redirección exitosa post creación de personajes a la nueva vista unificada
- [ ] Mantenimiento de todas las funcionalidades existentes (generación de thumbnails, análisis)
- [ ] Interfaz visual consistente con CharactersStep.tsx
- [ ] Sistema de manejo de errores preservado
- [ ] Animaciones y transiciones mantenidas
- [ ] Barra de progreso superior siempre visible
- [ ] Componente responsivo para mobile y desktop
- [ ] Sin errores en consola
- [ ] Mantenimiento del estado del wizard
- [ ] Preservación de todos los hooks y store existentes

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

- [ ] No se debe romper el flujo de navegación entre formularios
- [ ] No se debe perder la funcionalidad de generación de thumbnails
- [ ] No se debe afectar el sistema de autosave
- [ ] No se debe cambiar el sistema de gestión de estados
- [ ] No se debe afectar el manejo de errores
- [ ] No se debe romper la consistencia visual
- [ ] No se debe afectar el rendimiento

🧪 QA / Casos de prueba esperados:

1. Flujo de creación de personajes
   - [ ] Crear personaje nuevo → guardar → redirección a vista unificada
   - [ ] Verificar que el personaje aparece en la grid
   - [ ] Verificar que se mantiene la funcionalidad de edición
   - [ ] Verificar que se mantiene la funcionalidad de eliminación

2. Navegación
   - [ ] Home → continuar con historia → redirección a vista unificada
   - [ ] Verificar que se mantiene el estado del wizard
   - [ ] Verificar que la barra de progreso se muestra correctamente
   - [ ] Verificar que se mantiene el orden de los personajes

3. Funcionalidades específicas
   - [ ] Generación de thumbnails
   - [ ] Análisis de personajes
   - [ ] Subida de imágenes
   - [ ] Manejo de errores
   - [ ] Sistema de autosave

4. Responsividad
   - [ ] Verificar en mobile
   - [ ] Verificar en desktop
   - [ ] Verificar en diferentes tamaños de pantalla
   - [ ] Verificar que las animaciones funcionan correctamente

EXTRAS:

- Se recomienda mantener el sistema de autosave existente
- Se sugiere mantener la estructura de store actual
- Se recomienda mantener los hooks de manejo de errores
- Se sugiere documentar los cambios realizados
- Se recomienda crear un script de migración para los tests
- Se sugiere actualizar la documentación de la aplicación
