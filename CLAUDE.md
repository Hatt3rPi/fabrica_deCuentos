# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## 🚨 REGLAS CRÍTICAS - NUNCA HACER

### ⛔ PROHIBIDO ABSOLUTAMENTE:
- **NUNCA reiniciar Supabase local** (`npx supabase stop`, `npx supabase start`) sin autorización explícita del usuario
- **NUNCA ejecutar comandos destructivos** en bases de datos (DROP, DELETE, TRUNCATE, etc.)
- **NUNCA eliminar volúmenes de Docker** o datos persistentes (`docker volume prune`, `docker volume rm`)
- **NUNCA modificar servicios** que puedan afectar datos persistentes sin consultar primero

### ✅ PROCEDIMIENTO OBLIGATORIO:
- **SIEMPRE preguntar e informar riesgos antes** de cualquier acción que pueda afectar datos o persistencia
- **SIEMPRE usar métodos de solo lectura** para debugging (logs, SELECT queries, inspección de archivos)
- **SIEMPRE considerar alternativas** menos destructivas antes de proponer acciones que afecten servicios

### 🔍 COMANDOS PROHIBIDOS SIN AUTORIZACIÓN EXPLÍCITA:
```bash
# ESTOS COMANDOS REQUIEREN AUTORIZACIÓN PREVIA:
npx supabase stop
npx supabase start  
docker volume prune
docker volume rm
docker system prune
# Cualquier SQL con: DROP, DELETE, TRUNCATE
# Cualquier comando que afecte persistencia de datos
```

## Comandos de Desarrollo Comunes

### Desarrollo
- `npm run dev` - Iniciar servidor de desarrollo con Vite
- `npm run build` - Construir bundle de producción
- `npm run lint` - Ejecutar ESLint
- `npm run preview` - Previsualizar build de producción

### Testing
- `npm run test` - Ejecutar pruebas unitarias con Vitest en modo watch (TDD)
- `npm run test:run` - Ejecutar todas las pruebas unitarias una vez
- `npm run cypress:open` - Abrir interfaz gráfica de Cypress para testing interactivo
- `npx cypress run --spec "cypress/e2e/fas_creacion_personaje.cy.js"` - Ejecutar ÚNICA prueba e2e validada


### Supabase
- `npm run supabase:start` - Iniciar entorno de desarrollo local de Supabase
- `npm run supabase:pull` - Extraer esquema de base de datos y funciones del remoto

## Vista General de la Arquitectura

**La CuenterIA** es una plataforma basada en React para crear cuentos infantiles personalizados con ilustraciones generadas por IA. La aplicación usa un flujo tipo asistente para guiar a los usuarios a través de la creación de personajes, diseño de historias y generación de libros.

### Componentes Clave de la Arquitectura

1. **Sistema de Flujo Wizard**: Gestión centralizada de estado para el proceso de creación de historias de múltiples pasos
   - `WizardContext` - Gestiona el estado del wizard y flujo de UI
   - `useWizardFlowStore` - Store de Zustand para validación y progresión de pasos
   - Progresión secuencial de pasos con requisitos de validación
   - Funcionalidad de autoguardado con respaldo en localStorage

2. **Gestión de Personajes**: 
   - Creación de personajes con miniaturas generadas por IA
   - Biblioteca de personajes reutilizable entre historias
   - La validación requiere nombre, descripción y miniatura generada

3. **Integración con Supabase**:
   - Autenticación vía Supabase Auth
   - Base de datos PostgreSQL con políticas RLS
   - Edge Functions para generación de IA (historia, imágenes, variaciones)
   - Actualizaciones en tiempo real para analíticas de admin

4. **Pipeline de Generación de IA**:
   - Múltiples proveedores (OpenAI, Flux, Stable Diffusion)
   - Edge functions en directorio `supabase/functions/`
   - Seguimiento de métricas para uso de prompts y rendimiento

### Patrones Importantes

- **Context Providers**: La app usa providers anidados (Auth, Admin, Wizard, Story)
- **Enrutamiento de Páginas**: React Router con rutas protegidas y transiciones animadas
- **Gestión de Estado**: Mezcla de Context API y stores de Zustand
- **Autoguardado**: Crítico para persistencia del flujo wizard con estrategia dual localStorage/Supabase

## Guías de Desarrollo

### Requisitos de Testing
- Mantener atributos `data-testid` usados por las pruebas de Cypress
- Ejecutar `npm run cypress:run` antes de crear PRs
- Las pruebas usan clave de rol de servicio para limpieza de base de datos entre ejecuciones

### Edge Functions
- Ubicadas en `supabase/functions/` con utilidades compartidas en `_shared/`
- Todas las funciones requieren verificación JWT excepto `send-reset-email`
- Usar helper `metrics.ts` para seguimiento de uso de prompts

### Reglas del Flujo Wizard
1. Progresión secuencial - no se pueden saltar pasos
2. El paso anterior debe completarse antes de avanzar
3. Editar pasos anteriores restablece pasos subsecuentes a borrador
4. Autoguardado funciona continuamente con contexto de ID de historia
5. Limpieza controlada por flag `skipCleanup` para edición de personajes

### Características de Admin
- `/admin/flujo` - Monitoreo en tiempo real de llamadas activas a funciones de IA
- Dashboard de analíticas rastrea uso de prompts y costos
- La actividad puede habilitarse/deshabilitarse por edge function

## Configuración del Entorno

Variables de entorno requeridas:
```bash
VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anon
VITE_SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-rol-de-servicio (para pruebas)
```

Credenciales de demo:
- Email: tester@lacuenteria.cl
- Password: test123

## Mejores Prácticas de Claude Code

### 🔴 FLUJO TDD OBLIGATORIO PARA CLAUDE
1. **ANTES de escribir código**: Crear test que falle
2. **DURANTE desarrollo**: Mantener `npm run test` en watch
3. **CADA cambio**: Verificar que tests siguen pasando
4. **ANTES de commit**: Ejecutar suite completa de tests

### Gestión de Tareas TDD
- **Siempre usar herramientas TodoWrite/TodoRead** para tareas complejas (3+ pasos)
- **Primera tarea siempre**: "Escribir test que falle para [funcionalidad]"
- **Segunda tarea**: "Implementar código mínimo para hacer pasar el test"
- **Tercera tarea**: "Refactorizar manteniendo tests verdes"
- Marcar todos como `in_progress` ANTES de comenzar el trabajo
- Completar todos INMEDIATAMENTE después de finalizar cada tarea
- Tener solo UNA tarea `in_progress` a la vez

### Operaciones de Base de Datos
- **Usar funciones RPC para operaciones complejas** (ej., `link_character_to_story`)
- Manejar duplicados con patrón `ON CONFLICT DO NOTHING`
- Siempre verificar permisos de usuario en funciones de base de datos
- Usar `supabase.rpc()` para operaciones de base de datos más seguras que inserts directos

### Manejo de Errores y Condiciones de Carrera
- Agregar estados de carga para prevenir múltiples solicitudes simultáneas
- Implementar manejo adecuado de errores con mensajes amigables al usuario
- Usar bloques `try/catch/finally` para operaciones asíncronas
- Registrar errores con contexto para depuración

### Estrategia de Testing y TDD

#### 🔴 METODOLOGÍA TDD OBLIGATORIA
1. **RED**: Escribir prueba que falle primero
2. **GREEN**: Escribir código mínimo para que pase
3. **REFACTOR**: Mejorar el código manteniendo las pruebas pasando
4. **REPEAT**: Repetir ciclo para cada nueva funcionalidad

#### 📋 CHECKLIST TDD PARA CADA FEATURE:
- [ ] Escribir prueba unitaria que falle (`npm run test`)
- [ ] Implementar código mínimo para que pase
- [ ] Refactorizar manteniendo pruebas verdes
- [ ] Agregar casos edge en las pruebas
- [ ] Verificar con prueba e2e validada: `npx cypress run --spec "cypress/e2e/fas_creacion_personaje.cy.js"`

#### 🧪 PIRÁMIDE DE TESTING:
1. **Unitarias (70%)**: Vitest - Lógica de negocio, hooks, servicios
2. **Integración (20%)**: Componentes con contexto
3. **E2E (10%)**: Solo flujo crítico validado (creación personaje)

#### 📝 CONVENCIONES DE NAMING:
- Tests unitarios: `[component/hook/service].test.ts`
- Tests e2e: `[feature].cy.js`
- Describe: "Componente/Hook/Service - Comportamiento"
- It: "debe [acción esperada] cuando [condición]"

#### 🎯 ÁREAS PRIORITARIAS PARA TDD:
- Hooks personalizados (useAutosave, useWizardFlow)
- Servicios críticos (storyService, characterService)
- Stores de Zustand (wizardFlowStore)
- Validaciones de formularios
- Lógica de negocio del flujo wizard

### Calidad de Código
- **Ejecutar linting antes de commits**: `npm run lint`
- Seguir patrones y convenciones de código existentes
- Usar tipos de TypeScript consistentemente
- Mantener funciones enfocadas y de un solo propósito

### Gestión de Estado
- **Separar responsabilidades**: auto-save (contenido) vs estado de wizard (flujo)
- Usar persistencia directa para cambios críticos de estado
- Implementar estrategias de respaldo (localStorage + base de datos)
- Limpiar estado apropiadamente al desmontar componente

### Flujo de Trabajo Git
- **NUNCA hacer cambios directamente a la rama main**
- Siempre crear ramas feature/fix para cualquier cambio
- Usar mensajes de commit descriptivos siguiendo el patrón establecido
- Incluir contexto sobre POR QUÉ se hicieron los cambios
- Probar funcionalidad antes de hacer commit
- Crear PRs para todos los cambios, incluso documentación

### Prioridad de Comandos de Desarrollo TDD
1. **Antes de comenzar**: `npm run dev` (verificar que la app funciona)
2. **Desarrollo TDD**: `npm run test` (modo watch para ciclo RED-GREEN-REFACTOR)
3. **Durante desarrollo**: `npm run lint` (verificar calidad de código)
4. **Antes de commit**: 
   - `npm run test:run` (verificar todas las unitarias)
   - `npx cypress run --spec "cypress/e2e/fas_creacion_personaje.cy.js"` (única e2e validada)
5. **Para cambios de base de datos**: `npm run supabase:pull` (sincronizar esquema)

### Errores Comunes a Evitar
- No saltarse reglas de validación del flujo wizard
- No mezclar auto-save con persistencia de estado del wizard
- No crear commits sin ejecutar pruebas
- No usar inserts directos de base de datos para operaciones complejas
- No olvidar manejar condiciones de carrera en interacciones de UI
- **NUNCA hacer commit directamente a main** - siempre usar ramas y PRs

### Organización de Archivos
- Colocar nuevos archivos de prueba en directorios apropiados
- Hacer respaldo de pruebas antiguas antes de cambios mayores
- Mantener funciones de base de datos en `supabase/migrations/`
- Usar nombres de archivos claros y descriptivos
- Documentar nuevos patrones en este archivo

### Guías de Generación de Issues
- Cuando crees issues, genéralos en español y en el título pon [auto][prioridad alta/media/baja]

### Prácticas de Documentación
- **NUNCA crear archivos de documentación aislados en root** (ej: SOLUTION.md, FIX.md, etc.)
- **SIEMPRE usar sistema centralizado** en `/docs/` con templates estandarizados
- Siempre documenta los cambios en CHANGELOG.md y en el readme que corresponda

#### Sistema de Documentación Centralizado

**Para Soluciones Implementadas:**
```
"Documenta esta solución en /docs/solutions/[nombre-solucion]/ siguiendo el template establecido."
```

**Para Componentes:**
```
"Actualiza la documentación del componente [ComponentName] en /docs/components/[ComponentName].md siguiendo el template establecido."
```

**Para Edge Functions:**
```
"Documenta la Edge Function [function-name] en /docs/tech/[function-name].md siguiendo el template establecido."
```

#### Templates Disponibles:
- `/docs/templates/solution.md` - Para documentar soluciones implementadas
- `/docs/templates/component.md` - Para documentar componentes React  
- `/docs/templates/edge-function.md` - Para documentar Edge Functions

#### Estructura de Documentación:
```
docs/
├── solutions/          # Soluciones implementadas (NO archivos aislados)
├── components/         # Documentación de componentes React
├── tech/              # Documentación técnica (Edge Functions, arquitectura)
├── maintenance/       # Guías operacionales y troubleshooting
└── templates/         # Templates estandarizados
```

### Migraciones de Supabase
- Las Migrations de supabase deben tener el siguiente formato aaaaMMddhhmmss_

### Integración de Servidor MCP
- **Claude Code mantiene su propia configuración MCP** separada de settings.local.json
- Para agregar servidores MCP usar: `claude mcp add` o `claude mcp add-json` para configuraciones complejas
- Siempre incluir variables de entorno si son necesarias
- Actualizar también settings.local.json y permisos para mantener consistencia
- Ver guía completa en `/docs/maintenance/mcp-integration-guide.md`

## 🧪 GUÍAS TDD ESPECÍFICAS POR STACK

### React Components + TypeScript
```typescript
// 1. RED - Test que falla
describe('CharacterCard - Renderizado', () => {
  it('debe mostrar nombre del personaje cuando se proporciona', () => {
    render(<CharacterCard name="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

// 2. GREEN - Implementación mínima
export const CharacterCard = ({ name }: { name: string }) => (
  <div>{name}</div>
);

// 3. REFACTOR - Mejorar sin romper tests
```

### Custom Hooks con Vitest
```typescript
// 1. RED - Test del comportamiento esperado
describe('useAutosave - Funcionalidad básica', () => {
  it('debe guardar automáticamente después del delay', async () => {
    const mockSave = vi.fn();
    const { result } = renderHook(() => useAutosave(testData, mockSave));
    
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
  });
});

// 2. GREEN - Hook mínimo que pase
// 3. REFACTOR - Optimizar implementación
```

### Supabase Edge Functions
```typescript
// 1. RED - Test de la función
describe('generateStory Edge Function', () => {
  it('debe retornar historia válida con personajes', async () => {
    const result = await generateStory({ characters: [testChar] });
    expect(result.story).toBeDefined();
    expect(result.pages).toBeGreaterThan(0);
  });
});

// Usar mocks para external APIs en tests unitarios
```

### Zustand Stores
```typescript
// 1. RED - Test del comportamiento del store
describe('wizardFlowStore - Estados', () => {
  it('debe actualizar estado de personajes correctamente', () => {
    const { result } = renderHook(() => useWizardFlowStore());
    
    act(() => {
      result.current.setPersonajesCompletado(2);
    });
    
    expect(result.current.personajes.estado).toBe('completado');
  });
});
```

### Cypress E2E (Solo para flujo crítico validado)
```javascript
// Solo usar para cypress/e2e/fas_creacion_personaje.cy.js
describe('Creación de Personaje - Flujo Completo', () => {
  it('debe completar creación exitosamente', () => {
    cy.visit('/');
    cy.get('[data-testid="crear-personaje"]').click();
    // ... resto del flujo validado
  });
});
```

### Patrones TDD para La CuenterIA

#### Testing de Context Providers
- Mock de AuthContext para pruebas unitarias
- Testing de WizardContext con estados predefinidos
- Verificar propagación correcta de datos

#### Testing de Autoguardado
- Mocks de localStorage y Supabase
- Testing de reintentos y recuperación
- Verificar persistencia en diferentes escenarios

#### Testing de Validaciones Wizard
- Estados de progresión secuencial
- Validación de requisitos por paso
- Manejo de errores y rollback

### 🚨 REGLAS TDD ESPECÍFICAS DEL PROYECTO

1. **NUNCA escribir componente sin test primero**
2. **SIEMPRE mockear Supabase en tests unitarios**
3. **OBLIGATORIO usar data-testid para selectores**
4. **VERIFICAR con única e2e validada antes de commit**
5. **MANTENER tests independientes y determinísticos**