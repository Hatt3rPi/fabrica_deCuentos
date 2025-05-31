Épica: WIZARD - [1] CREACIÓN DE PERSONAJE
Categoría: improvement/performance
Notas para devs: 
- Requiere revisión de la implementación actual en `CharacterSelectionModal.tsx`
- Considerar impacto en pruebas E2E existentes
- Coordinar con equipo de backend para implementación de caché y colas

Archivos afectados:
- `src/components/Modal/CharacterSelectionModal.tsx` (modificación)
- `supabase/functions/` (nuevo - para funciones serverless)
- `docker-compose.yml` (modificación - para servicios adicionales)
- `cypress/e2e/flows/2_modal_personajes.cy.js` (actualización de pruebas)

🧠 Contexto:
El flujo actual de asociación de personajes a historias tiene limitaciones de escalabilidad que pueden afectar el rendimiento cuando el sistema maneje cientos de solicitudes por minuto. Se requiere implementar mejoras para garantizar la consistencia de datos y la capacidad de respuesta del sistema bajo carga.

📐 Objetivo:
Rediseñar el flujo de asociación de personajes para que sea más robusto, escalable y capaz de manejar altos volúmenes de solicitudes sin comprometer la experiencia del usuario final.

✅ CRITERIOS DE ÉXITO:
- [ ] La función `linkCharacter` maneja correctamente hasta 1000 RPM (solicitudes por minuto)
- [ ] Tiempo de respuesta promedio < 500ms para el percentil 95
- [ ] 0% de pérdida de datos durante picos de tráfico
- [ ] Sistema capaz de recuperarse automáticamente de fallas temporales
- [ ] Pruebas de carga que validen el rendimiento esperado
- [ ] Documentación actualizada para el equipo de desarrollo

❌ CRITERIOS DE FALLA:
- [ ] Pérdida de asociaciones entre personajes e historias
- [ ] Tiempos de respuesta superiores a 2 segundos en condiciones normales
- [ ] Errores no manejados que afecten la experiencia del usuario
- [ ] Degradación del rendimiento en el resto de la aplicación

🧪 ESCENARIOS DE PRUEBA:
1. **Caso Básico**
   - Usuario asocia un personaje a una historia existente
   - Verificar que la asociación se guarda correctamente
   - Verificar que los contadores se actualizan

2. **Alta Carga**
   - Simular 1000 usuarios asociando personajes simultáneamente
   - Verificar que todas las asociaciones se procesen correctamente
   - Monitorear uso de recursos

3. **Recuperación de Errores**
   - Simular caída de base de datos durante la operación
   - Verificar que el sistema reintente la operación
   - Validar consistencia de datos post-recuperación

🔧 IMPLEMENTACIÓN RECOMENDADA:

1. **Manejo de Errores y Reintentos**
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 segundo inicial

async function linkCharacterWithRetry(characterId: string, storyId?: string) {
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await linkCharacter(characterId, storyId);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  throw lastError;
}
```

2. **Caché de Historias Recientes**
```typescript
const storyCache = new LRUCache<string, Story>({
  max: 100, // Últimas 100 historias
  ttl: 1000 * 60 * 5, // 5 minutos
});

async function getRecentStory(userId: string, storyId?: string) {
  if (storyId) {
    const cached = storyCache.get(storyId);
    if (cached) return cached;
  }
  
  // Lógica para obtener la historia...
}
```

3. **Métricas y Monitoreo**
- Agregar métricas para:
  - Tiempo de respuesta
  - Tasa de éxito/error
  - Uso de caché
  - Tiempo de reintento

📊 MONITOREO Y ALERTAS:
- Configurar alertas para:
  - Tasa de error > 1%
  - Latencia p95 > 1s
  - Tasa de aciertos de caché < 80%

🔍 PRUEBAS DE CARGA:
1. Prueba de resistencia con 1000 RPM durante 10 minutos
2. Prueba de estrés para identificar el punto de quiebre
3. Prueba de recuperación después de fallos

📅 PLAN DE IMPLEMENTACIÓN:
1. [ ] Fase 1: Implementar manejo de errores y reintentos
2. [ ] Fase 2: Agregar caché de historias recientes
3. [ ] Fase 4: Implementar sistema de colas
4. [ ] Fase 5: Configurar métricas y alertas
5. [ ] Fase 6: Realizar pruebas de carga
6. [ ] Fase 7: Despliegue progresivo

📝 NOTAS ADICIONALES:
- Considerar migrar a un sistema de colas distribuido para mayor escalabilidad
- Evaluar uso de Redis para caché distribuido
- Documentar patrones de reintento y manejo de errores para el equipo
