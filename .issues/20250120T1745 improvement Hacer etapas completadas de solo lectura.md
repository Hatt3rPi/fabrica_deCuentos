Épica: WIZARD - [2] DISEÑO DE HISTORIA
Categoría: improvement/wizard-readonly-stages
Notas para devs: El trigger SQL ya previene cambios de estado, pero la UI permite editar etapas completadas. Necesitamos hacer que las etapas marcadas como "completado" sean de solo lectura en la interfaz.

Archivos afectados:
- /home/customware/lacuenteria/Lacuenteria/src/pages/StoryCreationWizard.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Wizard/CharacterStep.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Wizard/StoryStep.tsx
- /home/customware/lacuenteria/Lacuenteria/src/components/Wizard/DesignStep.tsx
- /home/customware/lacuenteria/Lacuenteria/src/context/WizardContext.tsx

🧠 Contexto:
Actualmente el sistema permite navegar entre etapas del wizard libremente. Si bien el trigger SQL previene cambios de estado inválidos (de "completado" a "borrador"), la interfaz de usuario aún permite editar campos en etapas ya completadas. Esto puede causar confusión cuando el usuario intenta guardar cambios que serán rechazados por el trigger.

📐 Objetivo:
Hacer que las etapas marcadas como "completado" en el wizardFlowStore sean de solo lectura en la interfaz, mostrando claramente al usuario que no puede modificar información de pasos anteriores ya completados.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- Las etapas completadas muestran todos los campos deshabilitados o en modo solo lectura
- Se muestra un indicador visual claro de que la etapa está completada (badge, icono, etc.)
- El usuario puede navegar y revisar información de etapas completadas
- Si el usuario necesita cambiar algo, debe mostrar un mensaje explicativo
- Los botones de acción (agregar personaje, generar cuento, etc.) están deshabilitados en etapas completadas

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- El usuario puede editar campos en etapas completadas
- No hay indicación visual de que una etapa está bloqueada
- Se pierden datos al intentar editar una etapa completada
- La navegación entre etapas se bloquea completamente
- El usuario queda atrapado sin poder avanzar

🧪 QA / Casos de prueba esperados:
- Completar etapa de personajes → volver atrás → todos los campos deben estar deshabilitados
- Intentar agregar/editar personaje en etapa completada → debe mostrar mensaje explicativo
- Completar generación de cuento → volver → campos de configuración deshabilitados
- Verificar que se puede navegar libremente para revisar información
- Confirmar que los indicadores visuales son claros y consistentes

EXTRAS:
- Agregar un método `isStageEditable(stage)` en WizardContext que verifique el estado
- Considerar agregar un botón "Desbloquear etapa" que requiera confirmación y reinicie todo el flujo desde ese punto
- Mostrar tooltip explicativo cuando el usuario intenta interactuar con elementos deshabilitados
- El mensaje podría ser: "Esta etapa ya está completada. Para modificarla, deberás reiniciar el proceso desde este punto."
