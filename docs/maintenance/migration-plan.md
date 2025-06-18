# Plan de Migración de Documentación

## 📋 Archivos a Migrar/Limpiar

### ✅ Ya Migrados al Sistema Centralizado
- Content de correcciones preview → `/docs/solutions/preview-corrections/`
- Content de story completion → `/docs/solutions/story-completion/`

### 🔄 Archivos a Revisar para Migración Futura

#### Root Level - Documentación Técnica:
```bash
# Verificar si tienen contenido técnico valioso antes de remover
ls -la *.md | grep -v README.md | grep -v CLAUDE.md | grep -v CHANGELOG.md
```

#### Archivos que DEBEN mantenerse en Root:
- `README.md` - Descripción principal del proyecto
- `CLAUDE.md` - Guías para Claude Code (actualizado con nuevo protocolo)
- `CHANGELOG.md` - Historial de cambios del proyecto

#### Archivos que pueden ser migrados:
- `STORAGE.md` → `/docs/tech/storage-configuration.md`
- `TESTING_OVERVIEW.md` → `/docs/maintenance/testing-overview.md`
- `AGENTS.md` → `/docs/maintenance/agents-guide.md` (si es relevante)

### 📝 Comandos de Limpieza (Para ejecutar después de migración)

```bash
# 1. Verificar contenido antes de eliminar
cat ARCHIVO.md

# 2. Si ya está migrado o es redundante, eliminar
rm ARCHIVO_AISLADO.md

# 3. Actualizar referencias en otros archivos
grep -r "ARCHIVO_AISLADO.md" . --exclude-dir=node_modules
```

### 🎯 Criterios para Mantener vs Migrar

#### Mantener en Root:
- Documentación de entrada al proyecto (README)
- Configuración de herramientas (CLAUDE.md)
- Historial del proyecto (CHANGELOG)
- Configuración de build/deployment (.gitignore, package.json, etc.)

#### Migrar a /docs:
- Soluciones específicas implementadas
- Documentación técnica detallada
- Guías operacionales
- Documentación de componentes
- Procedimientos de mantenimiento

## 🔧 Proceso de Migración Seguro

### 1. Antes de Eliminar
```bash
# Verificar que el contenido esté realmente migrado
grep -n "contenido_clave" docs/solutions/*/README.md
```

### 2. Crear Backup
```bash
mkdir docs/backup-migration/
cp *.md docs/backup-migration/ 2>/dev/null || true
```

### 3. Eliminar Gradualmente
```bash
# Solo después de verificar migración completa
rm ARCHIVO_VERIFICADO.md
```

### 4. Verificar Referencias
```bash
# Buscar referencias rotas después de eliminación
grep -r "ARCHIVO_ELIMINADO.md" . --exclude-dir=node_modules --exclude-dir=docs/backup-migration
```

## 📊 Estado Actual del Sistema

### ✅ Sistema Centralizado Implementado
- Templates estandarizados en `/docs/templates/`
- Estructura organizada en `/docs/solutions/`, `/docs/tech/`, etc.
- Protocolo documentado en `CLAUDE.md`
- Migración inicial de soluciones principales completada

### 🎯 Próximos Pasos
1. Revisar archivos específicos en root case-by-case
2. Migrar contenido valioso a ubicaciones apropiadas
3. Eliminar redundancias gradualmente
4. Verificar que no se rompan referencias
5. Documentar cambios en CHANGELOG.md

## 🔗 Referencias
- [Sistema de Documentación](../solutions/README.md)
- [Templates Disponibles](../templates/)
- [Guías de CLAUDE.md](../../CLAUDE.md#documentation-practices)