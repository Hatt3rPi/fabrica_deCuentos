# Lista de Comandos Prohibidos Sin Autorización

## ⛔ COMANDOS ABSOLUTAMENTE PROHIBIDOS

### Supabase - Gestión de Servicios
```bash
# NUNCA ejecutar sin autorización explícita
npx supabase stop
npx supabase start
npx supabase restart
```

### Supabase - Base de Datos
```bash
# NUNCA ejecutar - Eliminan/resetean datos
supabase db reset
supabase migration reset
supabase db dump --schema-only  # Solo con autorización
```

### Docker - Gestión de Volúmenes
```bash
# NUNCA ejecutar - Eliminan datos persistentes
docker-compose down -v
docker volume rm supabase_*
docker volume prune
docker system prune -a
```

### Sistema de Archivos
```bash
# NUNCA ejecutar en directorios del proyecto
rm -rf ./*
rm -rf supabase/
rm -rf node_modules/  # Usar npm install en su lugar
truncate -s 0 archivo.log
```

### Base de Datos SQL
```sql
-- NUNCA ejecutar sin autorización
DROP TABLE *;
DROP SCHEMA *;
DELETE FROM auth.users;
TRUNCATE auth.*;
ALTER TABLE * DROP COLUMN *;
```

## ⚠️ COMANDOS DE ALTO RIESGO

### Requieren Autorización Explícita del Usuario

#### Supabase - Migraciones
```bash
# Preguntar antes de ejecutar
supabase migration new nombre_migracion
supabase db push
supabase migration up
supabase migration down
```

#### NPM/Node - Limpieza
```bash
# Preguntar antes de ejecutar
npm cache clean --force
rm package-lock.json
rm -rf node_modules/
```

#### Git - Operaciones Destructivas
```bash
# Preguntar antes de ejecutar
git reset --hard HEAD
git clean -fd
git rebase --abort
git branch -D nombre_rama
```

#### Archivos de Configuración
```bash
# Preguntar antes de modificar
> .env.local  # Sobrescribir archivo
rm .env*
cp .env.example .env  # Solo si se confirma
```

## 🔍 PATRONES DE COMANDO PELIGROSOS

### Palabras Clave de Alerta
Cualquier comando que contenga:
- `rm -rf`
- `truncate`
- `delete`
- `drop`
- `reset`
- `clean`
- `purge`
- `prune`
- `down -v` (docker-compose)

### Operadores Peligrosos
- `> archivo` (sobrescribir completamente)
- `|& rm` (pipe a rm)
- `xargs rm` (eliminar múltiples archivos)

## ✅ ALTERNATIVAS SEGURAS

### En lugar de comandos destructivos:

#### Para problemas de autenticación:
```bash
# ❌ NO: npx supabase restart
# ✅ SÍ: Verificar logs y reiniciar frontend
npm run dev
# O revisar configuración
cat .env.local
```

#### Para problemas de dependencias:
```bash
# ❌ NO: rm -rf node_modules/
# ✅ SÍ: Reinstalar limpiamente
npm ci
# O actualizar
npm update
```

#### Para problemas de base de datos:
```bash
# ❌ NO: supabase db reset
# ✅ SÍ: Consultar estado
supabase status
supabase migration list
```

#### Para limpieza de archivos:
```bash
# ❌ NO: rm -rf logs/
# ✅ SÍ: Rotar logs
mv app.log app.log.old
touch app.log
```

## 🚨 CASOS DE EMERGENCIA

### Si el usuario insiste en comando destructivo:

1. **Confirmar comprensión de consecuencias**
   ```
   "Este comando eliminará [especificar qué]. ¿Confirmas que:
   - Entiendes que se perderán datos
   - No hay otra alternativa
   - Tienes backup si es necesario?"
   ```

2. **Proponer alternativas**
   ```
   "Antes de ejecutar este comando destructivo, ¿probamos:
   - [alternativa 1]
   - [alternativa 2]
   - [alternativa 3]"
   ```

3. **Documentar la decisión**
   ```
   "Ejecutando [comando] bajo autorización explícita del usuario.
   Consecuencias: [listar]
   Alternativas consideradas: [listar]"
   ```

## 📚 REFERENCIAS

- [Checklist de Seguridad](./command-safety-checklist.md)
- [Procedimientos de Troubleshooting](./troubleshooting-procedures.md)
- [Backup y Recuperación](./backup-recovery.md)

---

**Fecha de creación**: 2025-07-07  
**Aplicación**: Obligatoria para Claude Code  
**Violación**: Considerada error crítico de procedimiento