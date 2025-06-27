# [auto][prioridad alta] Sistema Completo de Sign In: Correo + Google + Control Admin

**Épica:** Autenticación y Control de Acceso  
**Categoría:** feature  
**Prioridad:** Alta  
**Estimación:** 10-12 horas  

### Archivos afectados:
- `src/context/AuthContext.tsx` - Agregar método signInWithGoogle()
- `src/components/Auth/LoginForm.tsx` - Botón "Continuar con Google"
- `src/types/auth.ts` (nuevo) - Interfaces para configuración
- `src/pages/Admin/Flujo.tsx` - Nueva sección "Autenticación"
- `src/components/Admin/AuthControlPanel.tsx` (nuevo) - Panel de control admin
- `src/hooks/useAuthConfig.ts` (nuevo) - Hook para configuración de auth
- `supabase/migrations/[timestamp]_auth_settings.sql` (nuevo) - Tabla para configuración
- `docs/solutions/sistema-auth-completo/README.md` (nuevo) - Documentación

### 🧠 Contexto:
Actualmente el sistema solo soporta autenticación por correo/contraseña. Se necesita implementar:
1. **Google OAuth** para facilitar el acceso a usuarios
2. **Control administrativo** desde `/admin/flujo` para habilitar/deshabilitar métodos de sign in
3. **Período de marcha blanca** que permita controlar ingresos completamente

El flujo actual funciona pero es limitado para escalabilidad y control operacional.

### 📐 Objetivo:
Crear un sistema de autenticación robusto que permita a los usuarios acceder fácilmente (correo + Google) mientras los administradores mantienen control total sobre qué métodos están disponibles en cada momento, especialmente durante períodos de marcha blanca o mantenimiento.

### ✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):
- [ ] El botón "Continuar con Google" aparece en LoginForm con diseño consistente
- [ ] Google OAuth funciona correctamente y redirige a /home tras autenticación exitosa
- [ ] AuthContext incluye método signInWithGoogle() funcional
- [ ] Admin puede activar/desactivar autenticación por correo desde /admin/flujo
- [ ] Admin puede activar/desactivar autenticación por Google desde /admin/flujo  
- [ ] Cambios de configuración se aplican en tiempo real sin recargar página
- [ ] UI mantiene consistencia con tema de libro del proyecto existente
- [ ] Estados de carga y errores apropiados para ambos métodos
- [ ] Base de datos persiste configuración de autenticación correctamente

### ❌ CRITERIOS DE FALLA (lo que no debe ocurrir):
- [ ] Google OAuth no debe romper la autenticación por correo existente
- [ ] El diseño no debe desviarse del estilo visual actual del proyecto
- [ ] No debe permitir acceso cuando ambos métodos estén deshabilitados (excepto admins)
- [ ] No debe mostrar métodos deshabilitados a usuarios finales
- [ ] No debe perder configuración al reiniciar la aplicación

### 🧪 QA / Casos de prueba esperados:
- [ ] **Flujo Google OAuth:** Click "Continuar con Google" → popup Google → autenticación → redirección /home
- [ ] **Control Admin:** Acceder /admin/flujo → toggle "Google Sign In" OFF → verificar botón desaparece en login
- [ ] **Control Admin:** Toggle "Email Sign In" OFF → verificar formulario email desaparece en login  
- [ ] **Marcha Blanca:** Deshabilitar ambos métodos → usuarios ven mensaje "acceso temporalmente restringido"
- [ ] **Persistencia:** Configurar toggles → recargar admin → verificar configuración persiste
- [ ] **Error Handling:** Simular error Google OAuth → mostrar mensaje error apropiado
- [ ] **Responsive:** Verificar diseño funciona correctamente en mobile y desktop

### Notas para devs:
- **Google OAuth:** Configurar en Supabase Dashboard con redirectTo apropiado
- **RLS Policies:** Solo admins pueden modificar auth_settings table
- **UI Consistency:** Mantener BackgroundCarousel y tema de libro existente
- **Real-time Updates:** Usar similar patrón a control de edge functions en /admin/flujo
- **Fallback Admin:** Siempre permitir acceso a emails configurados como admin, incluso con auth deshabilitado

### EXTRAS:
- Usar icons de Google oficiales para consistencia visual  
- Implementar whitelist de emails admin para acceso de emergencia
- Considerar analytics de métodos de sign in más utilizados
- Documentar proceso de configuración Google OAuth en Supabase
- Agregar logs de actividad cuando admin cambia configuración de auth