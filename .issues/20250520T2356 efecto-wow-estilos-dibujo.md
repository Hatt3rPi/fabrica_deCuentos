Épica: WIZARD - [1] CREACIÓN DE PERSONAJE
Categoría: Feature
Identificador: LAC-20
Notas para devs: Implementar generación paralela de variantes de personajes en diferentes estilos visuales durante el proceso de creación. Este es el issue principal que coordina LAC-22, LAC-23 y LAC-24.

Archivos afectados:
- src/components/Character/CharacterForm.tsx (modificar)
- src/hooks/useCharacterGeneration.ts (modificar/extender)
- src/stores/characterStore.ts (modificar)
- src/services/characterService.ts (nuevo)
- src/workers/characterGenerator.worker.ts (nuevo)
- src/types/character.ts (extender)
- src/constants/visualStyles.ts (nuevo)

🧠 Contexto:
Se requiere implementar un sistema que genere automáticamente variantes de personajes en diferentes estilos visuales durante el proceso de creación. Las generaciones deben ocurrir en paralelo para no bloquear la interfaz de usuario y mejorar la experiencia del usuario.

📐 Objetivo:
Implementar un sistema de generación paralela de variantes de personajes en 4 estilos visuales diferentes, asegurando que estén disponibles para etapas posteriores del flujo.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

- [ ] Sin errores en consola
- [ ] Interfaz completamente responsiva (mobile/desktop)
- [ ] Generación en paralelo de 4 estilos visuales:
  - [ ] Acuarela Digital (paleta pasteles vibrantes)
  - [ ] Dibujado a mano (paleta pasteles vibrantes)
  - [ ] Recortes de papel (paleta pasteles vibrantes)
  - [ ] Kawaii (paleta pasteles vibrantes)
- [ ] Manejo de estados de generación
- [ ] Feedback visual del progreso
- [ ] Almacenamiento en base de datos y storage
- [ ] Sistema de reintentos automáticos
- [ ] Manejo de errores robusto
- [ ] Tipado TypeScript completo
- [ ] Documentación del flujo
- [ ] Pruebas unitarias
- [ ] Optimización de rendimiento

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

- [ ] Bloqueo de la interfaz durante la generación
- [ ] Pérdida de datos por cierre inesperado
- [ ] Generación incompleta de estilos
- [ ] Inconsistencias entre base de datos y storage
- [ ] Errores no manejados
- [ ] Consumo excesivo de recursos
- [ ] Tiempos de espera excesivos
- [ ] Inconsistencias visuales
- [ ] Problemas de memoria
- [ ] Pérdida de progreso

🧪 CASOS DE PRUEBA:

1. Creación de personaje con imagen:
   - [ ] Verificar generación de 4 variantes
   - [ ] Confirmar paleta de colores
   - [ ] Verificar almacenamiento

2. Creación de personaje solo con descripción:
   - [ ] Verificar generación desde texto
   - [ ] Confirmar coherencia con descripción
   - [ ] Verificar manejo de errores

3. Recuperación de generación interrumpida:
   - [ ] Cerrar durante generación
   - [ ] Recuperar progreso al volver
   - [ ] Verificar integridad de datos

4. Rendimiento:
   - [ ] Medir tiempo de generación
   - [ ] Verificar uso de memoria
   - [ ] Probar en dispositivos móviles

ARQUITECTURA PROPUESTA:

1. **Servicio de Generación**:
   ```typescript
   interface GenerationResult {
     style: VisualStyle;
     imageUrl: string;
     thumbnailUrl: string;
     status: 'pending' | 'generating' | 'completed' | 'error';
     error?: string;
   }
   
   interface CharacterGenerationState {
     characterId: string;
     styles: Record<VisualStyle, GenerationResult>;
     isGenerating: boolean;
     lastUpdated: string;
   }
   ```

2. **Flujo de Generación**:
   - Iniciar generación en paralelo
   - Actualizar estados individualmente
   - Manejar errores por estilo
   - Persistir progreso

3. **Optimizaciones**:
   - Web Workers para generación
   - Cola de prioridades
   - Caché de resultados
   - Limpieza de recursos

INSTRUCCIONES DE IMPLEMENTACIÓN:

1. Configurar Web Workers:
   - Crear worker para generación
   - Implementar cola de tareas
   - Manejar comunicación con el hilo principal

2. Actualizar store de personajes:
   - Agregar estados de generación
   - Implementar acciones para controlar generación
   - Manejar persistencia

3. Integrar con UI:
   - Mostrar progreso
   - Manejar errores
   - Permitir reintentos

4. Implementar servicio de generación:
   - Llamadas a API
   - Procesamiento de imágenes
   - Almacenamiento

5. Manejo de errores:
   - Reintentos automáticos
   - Notificaciones
   - Recuperación de estado

EXTRAS:
- Monitoreo de rendimiento
- Métricas de generación
- Sistema de logs
- Documentación técnica
- Pruebas E2E
- Optimización de imágenes
- Sistema de caché

RELACIONES:
- Depende de: LAC-23 (imágenes genéricas)
- Relacionado con: LAC-22 (visualización)
- Relacionado con: LAC-24 (almacenamiento)
