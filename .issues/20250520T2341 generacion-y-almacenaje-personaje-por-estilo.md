Épica: WIZARD - [1] CREACIÓN DE PERSONAJE
Categoría: Feature, Improvement
Notas para devs: Se requiere implementar un sistema robusto de generación y almacenamiento de variantes de personajes por estilo visual. El sistema debe asegurar la persistencia de datos incluso ante cierres inesperados del navegador.

Archivos afectados:
- src/components/Character/CharacterForm.tsx
- src/hooks/useCharacterGeneration.ts
- src/hooks/useCharacterAutosave.ts
- src/stores/characterStore.ts
- src/types/character.ts
- src/types/illustration.ts
- src/context/WizardContext.tsx
- supabase/functions/generate-illustration/index.ts

🧠 Contexto:
Actualmente el sistema genera una miniatura principal para cada personaje, pero no existe un sistema consistente para generar y almacenar variantes del personaje en diferentes estilos visuales. Esto es crucial para la etapa posterior de diseño del cuento.

Los estilos visuales requeridos son:
1. Acuarela Digital
2. Dibujado a mano
3. Recortes de papel
4. Kawaii

Cada estilo debe usar una paleta de colores pasteles vibrantes.

📐 Objetivo:
Implementar un sistema robusto de generación y almacenamiento de variantes de personajes que:
- Genere automáticamente variantes en los 4 estilos visuales especificados
- Almacene todas las variantes en la base de datos y en el storage
- Mantenga la consistencia de los datos incluso ante cierres inesperados
- Proporcione feedback visual durante el proceso de generación
- Sea compatible con el sistema de autosave existente

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

- [ ] Sistema de generación de variantes por estilo implementado
- [ ] Persistencia de datos en base de datos y storage
- [ ] Sistema de autosave compatible con las nuevas variantes
- [ ] Manejo de errores robusto
- [ ] Feedback visual durante la generación
- [ ] Componente responsivo para mobile y desktop
- [ ] Sin errores en consola
- [ ] Todos los estilos visuales generados correctamente
- [ ] Paleta de colores pasteles vibrantes aplicada en todos los estilos
- [ ] Sistema de reintentos implementado
- [ ] Logs de generación y almacenamiento

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

- [ ] Pérdida de datos durante la generación
- [ ] Fallo en el almacenamiento de variantes
- [ ] Inconsistencia en los datos entre base de datos y storage
- [ ] Fallo en el sistema de autosave
- [ ] Fallo en el manejo de errores
- [ ] Fallo en la persistencia de datos ante cierres inesperados

🧪 QA / Casos de prueba esperados:

1. Generación de variantes
   - [ ] Generar miniatura principal → deben generarse las 4 variantes
   - [ ] Verificar que todas las variantes se almacenan correctamente
   - [ ] Verificar que se mantiene la paleta de colores pasteles
   - [ ] Verificar que se mantiene la consistencia en los estilos

2. Persistencia de datos
   - [ ] Generar variantes y cerrar navegador → datos deben persistir
   - [ ] Generar variantes y navegar a otra página → datos deben persistir
   - [ ] Generar variantes y refrescar página → datos deben persistir
   - [ ] Verificar que los datos se mantienen en la base de datos
   - [ ] Verificar que los datos se mantienen en el storage

3. Manejo de errores
   - [ ] Falla en la generación de una variante → otras variantes deben seguir generándose
   - [ ] Falla en el almacenamiento → debe haber reintentos
   - [ ] Falla en la conexión → debe haber backup local
   - [ ] Verificar logs de errores

4. Rendimiento
   - [ ] Medir tiempo de generación de todas las variantes
   - [ ] Verificar uso de memoria durante la generación
   - [ ] Verificar impacto en el rendimiento del navegador
   - [ ] Verificar consistencia en diferentes dispositivos

EXTRAS:

- Se recomienda implementar un sistema de caché para las variantes generadas
- Se sugiere agregar logs detallados de la generación y almacenamiento
- Se recomienda implementar un sistema de limpieza de variantes no utilizadas
- Se sugiere crear un dashboard para monitorear el estado de las generaciones
- Se recomienda documentar el proceso de generación de variantes
- Se sugiere agregar métricas de rendimiento y uso de recursos
- Se recomienda implementar un sistema de notificaciones para errores críticos
