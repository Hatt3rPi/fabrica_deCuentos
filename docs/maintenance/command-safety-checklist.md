# Checklist de Seguridad para Comandos

## Verificación Obligatoria Antes de Ejecutar Comandos

### 🔍 CHECKLIST PRE-ACCIÓN
Antes de ejecutar cualquier comando, verificar:

1. **¿El comando puede afectar datos existentes?**
   - ¿Modifica, elimina o resetea datos de base de datos?
   - ¿Afecta archivos de configuración críticos?
   - ¿Modifica volúmenes de Docker?

2. **¿El comando puede eliminar o resetear algo?**
   - ¿Contiene palabras clave como `rm`, `delete`, `drop`, `truncate`, `reset`?
   - ¿Reinicia servicios que pueden perder datos?
   - ¿Limpia caché o storage?

3. **¿Tengo autorización EXPLÍCITA del usuario?**
   - ¿El usuario pidió específicamente esta acción?
   - ¿El usuario entiende las consecuencias?
   - ¿Hay una instrucción clara en el contexto?

4. **¿Existe una alternativa menos destructiva?**
   - ¿Puedo resolver el problema sin afectar datos?
   - ¿Hay una forma de debugging no destructiva?
   - ¿Puedo hacer backup antes?

### ⛔ REGLA FUNDAMENTAL
**Si la respuesta a 1 o 2 es SÍ y a 3 es NO → NO EJECUTAR**

### 🚨 COMANDOS DE ALTO RIESGO
Estos comandos SIEMPRE requieren autorización explícita:

#### Supabase
- `npx supabase stop`
- `npx supabase start`
- `npx supabase restart`
- `supabase db reset`
- `supabase migration reset`

#### Docker
- `docker-compose down -v`
- `docker volume rm`
- `docker system prune`

#### Sistema de archivos
- Cualquier comando con `rm -rf`
- `truncate`
- `> archivo` (sobrescribir)

#### Base de datos
- `DROP TABLE`
- `DELETE FROM`
- `TRUNCATE`
- `ALTER TABLE ... DROP`

### 🛡️ PROCEDIMIENTOS SEGUROS

#### Para problemas de autenticación:
1. ✅ Verificar logs de error
2. ✅ Revisar variables de entorno
3. ✅ Reiniciar solo frontend (`npm run dev`)
4. ⚠️ Como último recurso: preguntar sobre reinicio de Supabase

#### Para problemas de base de datos:
1. ✅ Consultar logs de Supabase
2. ✅ Verificar migraciones pendientes
3. ✅ Revisar políticas RLS
4. ⚠️ Como último recurso: preguntar sobre reset

#### Para problemas de storage:
1. ✅ Verificar permisos de buckets
2. ✅ Revisar URLs de acceso
3. ✅ Comprobar configuración CORS
4. ⚠️ Como último recurso: preguntar sobre limpieza

### 📝 FRASES CLAVE DE ALERTA
Si el usuario dice:
- "Reinicia todo"
- "Limpia la base de datos"
- "Borra y empezar de nuevo"
- "Reset completo"

**→ PREGUNTAR ESPECÍFICAMENTE qué quiere resetear y confirmar que entiende las consecuencias**

### ✅ COMANDOS SIEMPRE SEGUROS
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `git status`
- `git log`
- Lectura de archivos (Read, Glob, Grep)
- Consultas SELECT a base de datos

---

**Fecha de creación**: 2025-07-07  
**Propósito**: Prevenir eliminación accidental de datos de desarrollo  
**Aplicación**: Obligatoria para todos los comandos de Claude Code