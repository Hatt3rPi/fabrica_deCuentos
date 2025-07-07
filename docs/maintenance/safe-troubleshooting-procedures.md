# Procedimientos Seguros de Troubleshooting

## 🛡️ PRINCIPIOS FUNDAMENTALES

### Regla de Oro
**SIEMPRE intentar soluciones no destructivas ANTES que comandos que puedan eliminar datos**

### Jerarquía de Intervención
1. **Lectura/Diagnóstico** - Sin riesgo
2. **Configuración** - Riesgo bajo
3. **Reinicio de aplicación** - Riesgo medio
4. **Reinicio de servicios** - Riesgo alto (requiere autorización)
5. **Reset/Eliminación** - Riesgo crítico (requiere autorización explícita)

## 🔍 DIAGNÓSTICO INICIAL (SIEMPRE SEGURO)

### Paso 1: Recopilación de Información
```bash
# Estado del sistema
npm run dev  # ¿La app responde?
git status   # ¿Hay cambios pendientes?
git log -3   # ¿Commits recientes problemáticos?

# Estado de Supabase
supabase status  # ¿Servicios corriendo?
supabase migration list  # ¿Migraciones aplicadas?
```

### Paso 2: Revisión de Logs
```bash
# Logs de aplicación
# Revisar consola del navegador
# Revisar terminal donde corre npm run dev

# Logs de Supabase (si están disponibles)
docker logs supabase_db
docker logs supabase_kong
```

### Paso 3: Verificación de Configuración
```bash
# Variables de entorno
cat .env.local
cat .env

# Dependencias
npm list --depth=0
```

## 🚨 PROCEDIMIENTOS POR TIPO DE PROBLEMA

### Problemas de Autenticación/Login

#### Síntomas:
- Error 404 en auth
- "Invalid refresh token"
- Usuario no puede hacer login
- Sesión expira inmediatamente

#### Soluciones Seguras (en orden):
1. **Verificar configuración auth**
   ```bash
   # Verificar variables de entorno
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **Limpiar almacenamiento local del navegador**
   ```javascript
   // En DevTools del navegador
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Reiniciar solo frontend**
   ```bash
   # Detener npm run dev y reiniciar
   npm run dev
   ```

4. **⚠️ Último recurso - Preguntar al usuario**
   ```
   "Los pasos anteriores no resolvieron el problema de auth.
   ¿Autorizas reiniciar Supabase local? Esto puede eliminar datos de desarrollo."
   ```

### Problemas de Base de Datos

#### Síntomas:
- Errores de conexión DB
- Tablas no encontradas
- Políticas RLS bloqueando queries
- Migraciones fallidas

#### Soluciones Seguras (en orden):
1. **Verificar estado de migraciones**
   ```bash
   supabase migration list
   supabase status
   ```

2. **Revisar permisos/políticas**
   ```sql
   -- En Supabase Studio o CLI
   SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';
   ```

3. **Intentar aplicar migraciones pendientes**
   ```bash
   # Solo si hay migraciones pendientes detectadas
   supabase migration up
   ```

4. **⚠️ Último recurso - Preguntar al usuario**
   ```
   "Las migraciones tienen conflictos que requieren reset de DB.
   ¿Autorizas hacer supabase db reset? Esto eliminará TODOS los datos."
   ```

### Problemas de Storage/Archivos

#### Síntomas:
- Imágenes no cargan
- URLs devuelven 404
- Problemas de CORS
- Bucket permissions

#### Soluciones Seguras (en orden):
1. **Verificar URLs y configuración**
   ```bash
   # Verificar estructura de buckets en Supabase Studio
   # Comprobar políticas de bucket
   ```

2. **Revisar archivos específicos**
   ```bash
   # Listar archivos en bucket
   supabase storage ls bucket-name
   ```

3. **Normalizar URLs (para desarrollo local)**
   ```typescript
   // Usar utility existente
   const normalizedUrl = normalizeStorageUrl(originalUrl);
   ```

4. **Re-subir archivos individuales si es necesario**
   ```bash
   # Solo archivos específicos, no limpieza masiva
   ```

### Problemas de Edge Functions

#### Síntomas:
- Functions no responden
- Errores 500 en functions
- Timeouts en llamadas
- Problemas de permisos

#### Soluciones Seguras (en orden):
1. **Verificar logs de function**
   ```bash
   # Logs específicos de la función
   supabase functions logs function-name
   ```

2. **Verificar deployment status**
   ```bash
   supabase functions list
   ```

3. **Re-deploy función específica**
   ```bash
   # Solo la función problemática
   supabase functions deploy function-name
   ```

4. **Verificar permisos y variables de entorno**
   ```bash
   # Revisar secrets de functions
   supabase functions env list
   ```

### Problemas de Dependencias/NPM

#### Síntomas:
- Módulos no encontrados
- Versiones incompatibles
- Build failures
- Type errors

#### Soluciones Seguras (en orden):
1. **Reinstalar dependencias limpiamente**
   ```bash
   # Método seguro - no borra manualmente
   npm ci
   ```

2. **Verificar compatibilidad de versiones**
   ```bash
   npm outdated
   npm audit
   ```

3. **⚠️ Si es necesario - Limpiar cache**
   ```bash
   # Preguntar antes
   npm cache clean --force
   ```

4. **⚠️ Último recurso - node_modules**
   ```
   "¿Autorizas eliminar node_modules para reinstalación completa?
   (Se puede tardar varios minutos en reinstalar)"
   ```

## 📋 CHECKLIST DE TROUBLESHOOTING

### Antes de cualquier comando potencialmente destructivo:

- [ ] ¿He intentado todas las soluciones de lectura/diagnóstico?
- [ ] ¿He verificado configuración y logs?
- [ ] ¿He intentado reiniciar solo la aplicación frontend?
- [ ] ¿Existe una alternativa específica menos destructiva?
- [ ] ¿El usuario entiende exactamente qué se va a hacer?
- [ ] ¿El usuario autorizó explícitamente esta acción?

### Documentación requerida para acciones destructivas:

- [ ] Problema específico identificado
- [ ] Soluciones no destructivas intentadas
- [ ] Razón por la cual no funcionaron
- [ ] Autorización explícita del usuario
- [ ] Consecuencias esperadas documentadas

## 🔄 PROCEDIMIENTO DE ESCALACIÓN

### Nivel 1: Auto-resolución Segura
- Diagnóstico y lectura
- Configuración básica
- Reinicio de frontend

### Nivel 2: Consulta al Usuario
- Reinicio de servicios
- Cambios en configuración crítica
- Re-deploy de functions

### Nivel 3: Autorización Explícita Requerida
- Reset de base de datos
- Eliminación de archivos/directorios
- Comandos con `rm`, `delete`, `drop`, `truncate`

### Nivel 4: Rechazo/Derivación
- Comandos que comprometen seguridad
- Operaciones sin rollback posible
- Solicitudes vagas o ambiguas sobre "limpiar todo"

## 📚 REFERENCIAS RÁPIDAS

### Comandos Siempre Seguros:
- `git status`, `git log`
- `npm run dev`, `npm run build`, `npm run lint`
- `supabase status`, `supabase migration list`
- Herramientas de lectura: `Read`, `Glob`, `Grep`

### Comandos que Requieren Autorización:
- `npx supabase stop/start`
- `supabase db reset`
- `rm -rf cualquier-cosa`
- `docker-compose down -v`

### Frases de Alerta del Usuario:
- "Limpia todo"
- "Reinicia desde cero"
- "Borra y empezar de nuevo"
- "Reset completo"

→ **ESTAS FRASES REQUIEREN CLARIFICACIÓN ESPECÍFICA**

---

**Fecha de creación**: 2025-07-07  
**Propósito**: Guía operacional para troubleshooting sin pérdida de datos  
**Nivel de cumplimiento**: Obligatorio