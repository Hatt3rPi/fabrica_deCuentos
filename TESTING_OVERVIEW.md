# 🧪 Estructura de Testing - La CuenteriAI

## 📁 Organización de Tests

### Tests Actuales (Activos)
- **`complete_story_flow.cy.js`** - ⭐ **NUEVO FLUJO PRINCIPAL**
  - Flujo completo desde login hasta generación de historia
  - Incluye limpieza, creación de personaje, y generación de cuento
  - Test de persistencia de progreso

### Tests de Respaldo (Backup)
- **`cypress/e2e/backup/`** - Tests anteriores respaldados
  - `wizard_*.cy.js` - Tests específicos de wizard state
  - `verify_*.cy.js` - Tests de verificación

### Edge Functions y Utilitarios
- **`edge_function_test.cy.js`** - Test de limpieza de datos
- **`cypress/e2e/flows/3_creacion_personaje.cy.js`** - Flujo específico de personajes

## 🚀 Comandos de Testing

### Ejecutar Nuevo Flujo Principal
```bash
# Usando npm script
npm run test:complete-flow

# Usando script directo
node run-complete-flow-test.js

# Usando cypress directamente
npx cypress run --spec "cypress/e2e/complete_story_flow.cy.js"
```

### Testing Interactivo
```bash
# Abrir Cypress GUI
npm run cypress:open

# Seleccionar complete_story_flow.cy.js
```

### Otros Tests
```bash
# Todos los tests E2E
npm run test:e2e

# Tests unitarios
npm run test
```

## 📋 Nuevo Flujo de Testing

### `complete_story_flow.cy.js`

#### **Test Principal: "Debe completar el flujo desde limpieza hasta generación de historia"**

**Pasos cubiertos:**

1. **🧹 Limpieza de Datos**
   - Ejecuta `edge_function_test.cy.js` para limpiar datos del usuario
   - Verifica resultado de limpieza

2. **🔐 Login → Home → Nuevo Cuento**
   - Login con credenciales de prueba
   - Navegación a home
   - Apertura de modal de nuevo cuento

3. **👤 Creación de Personaje**
   - Mismo flujo que `3_creacion_personaje.cy.js`
   - Formulario completo con imagen y miniatura
   - Guardado del personaje (regresa a modal de selección)
   - Selección del personaje creado
   - Cierre del modal con "Continuar"

4. **📖 Navegación a Etapa Cuento**
   - Verificación que modal se cerró y estamos en wizard
   - Espera de 500ms antes de avanzar
   - Click en "Siguiente" para avanzar desde personajes a cuento
   - Verificación de llegada a etapa cuento

5. **✍️ Generación de Historia**
   - Entrada de temática del cuento
   - Click en "Generar la Historia"
   - Espera de generación (hasta 3 minutos)

6. **📚 Verificación de Cuento Completo**
   - Aparición de "📖 Cuento completo (X párrafos)"
   - Contenido en textarea readonly
   - Verificación que contiene nombre del personaje
   - Botón "Continuar" habilitado

7. **✅ Verificaciones Finales**
   - Avance a etapa de diseño
   - Confirmación de flujo completo

#### **Test Secundario: "Debe mantener el progreso al recargar la página"**
- Verificación de persistencia del wizard state
- Recarga de página y mantenimiento de estado

## 📊 Datos de Prueba

### `cypress/fixtures/test-data.json`
```json
{
  "user": {
    "email": "tester@lacuenteria.cl",
    "password": "test123"
  },
  "character": {
    "name": "Sheldon el tester",
    "age": "5 años",
    "description": "Joven genio que se encarga de probar la aplicación"
  },
  "story": {
    "theme": "Una aventura mágica en un bosque encantado donde Sheldon descubre poderes especiales para resolver problemas matemáticos y ayuda a los animales del bosque con sus conocimientos científicos."
  }
}
```

## ⚙️ Configuración

### Variables de Entorno Requeridas
- `TEST_USER_EMAIL` - Email del usuario de prueba
- `CLEANUP_API_KEY` - Key para edge function de limpieza  
- `VITE_SUPABASE_URL` - URL de Supabase
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - Service role key

### Timeouts Importantes
- **Generación de miniatura**: 120 segundos (2 minutos)
- **Generación de historia**: 180 segundos (3 minutos)
- **Navegación general**: 10 segundos

### Selectores Importantes
- **Miniatura generada**: `img[alt="Miniatura"]` (no tiene data-testid)
- **Cuento completo**: `cy.contains('Tu cuento completo').parent().find('textarea[readonly]')`
- **Botón continuar**: `cy.contains('button', 'Continuar')`

## 🎯 Objetivos del Nuevo Testing

### ✅ Lo que verifica:
1. **Flujo completo funcional** desde inicio a fin
2. **Persistencia de wizard_state** entre etapas
3. **Generación de contenido AI** (thumbnails y stories)
4. **UI responsiva** y estados correctos
5. **Limpieza de datos** entre tests

### 🔧 Lo que testea específicamente:
- **Fix de wizard_state synchronization** implementado
- **Routing correcto** del WizardProvider
- **Auto-save vs wizard state service** separation
- **Persistencia inmediata** en acciones críticas

## 📈 Próximos Pasos

1. **Ejecutar y validar** el nuevo flujo
2. **Ajustar timeouts** según performance real
3. **Agregar más casos edge** si es necesario
4. **Documentar resultados** de testing en producción