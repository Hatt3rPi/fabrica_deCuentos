# Guía de Integración de Servidores MCP en Claude Code

## 📋 Issues Resueltos
- Configuración incorrecta de servidores MCP en Claude Code
- Falta de sincronización entre configuración de Claude Code y settings.local.json

## 🎯 Objetivo
Proporcionar una guía clara y completa para integrar nuevos servidores MCP en Claude Code, asegurando la configuración correcta y la sincronización entre los diferentes archivos de configuración.

## 📁 Archivos Involucrados
- `~/.config/claude/config.json` - Configuración principal de Claude Code (gestionada automáticamente)
- `settings.local.json` - Configuración local del proyecto (manual)
- `.env` o `.env.local` - Variables de entorno necesarias para los servidores MCP

## 🔧 Problema Identificado

### Descripción del Problema
Claude Code mantiene su propia configuración MCP en `~/.config/claude/config.json`, separada del archivo `settings.local.json` del proyecto. Esto puede causar:
- Inconsistencias entre configuraciones
- Servidores MCP que no funcionan correctamente
- Dificultades para depurar problemas de integración

### Diferencias Clave
- **Claude Desktop**: Lee configuración de `~/Library/Application Support/Claude/settings.json` (macOS) o equivalente
- **Claude Code**: Gestiona configuración en `~/.config/claude/config.json` y requiere comandos CLI específicos

## 📝 Pasos para Agregar un Servidor MCP

### 1. Configuración Básica (Sin Variables de Entorno)
```bash
# Agregar servidor MCP simple
claude mcp add <nombre-servidor> <comando>

# Ejemplo: servidor de filesystem
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem /path/to/directory
```

### 2. Configuración con Variables de Entorno
Para servidores que requieren configuración adicional, usar `claude mcp add-json`:

```bash
# Crear archivo JSON temporal con la configuración
cat > mcp-config.json << 'EOF'
{
  "command": "node",
  "args": ["/path/to/server.js"],
  "env": {
    "API_KEY": "tu-api-key",
    "API_URL": "https://api.ejemplo.com"
  }
}
EOF

# Agregar servidor con configuración JSON
claude mcp add-json <nombre-servidor> mcp-config.json

# Limpiar archivo temporal
rm mcp-config.json
```

### 3. Ejemplo Completo: Integración de Sentry

```bash
# 1. Crear configuración JSON para Sentry
cat > sentry-mcp-config.json << 'EOF'
{
  "command": "npx",
  "args": ["-y", "@sentry/mcp-server"],
  "env": {
    "SENTRY_ORG": "customware",
    "SENTRY_PROJECT": "customware-qa",
    "SENTRY_API_KEY": "tu-sentry-api-key"
  }
}
EOF

# 2. Agregar servidor MCP
claude mcp add-json sentry sentry-mcp-config.json

# 3. Verificar configuración
claude mcp get sentry

# 4. Limpiar archivo temporal
rm sentry-mcp-config.json
```

### 4. Actualizar settings.local.json (Mantener Consistencia)
```json
{
  "mcpServers": {
    "sentry": {
      "provider": "MCP",
      "capabilities": ["issues", "metrics"],
      "permissions": {
        "sentry": {
          "enabled": true,
          "allowCreate": true,
          "allowRead": true,
          "allowUpdate": true
        }
      }
    }
  }
}
```

## 🛠️ Comandos Útiles para Depuración

### Listar Servidores Configurados
```bash
claude mcp list
# Muestra todos los servidores MCP configurados en Claude Code
```

### Ver Detalles de un Servidor
```bash
claude mcp get <nombre-servidor>
# Muestra la configuración completa del servidor incluyendo variables de entorno
```

### Eliminar un Servidor
```bash
claude mcp remove <nombre-servidor>
# Elimina el servidor de la configuración de Claude Code
```

### Verificar Configuración Actual
```bash
# Ver archivo de configuración completo
cat ~/.config/claude/config.json | jq .mcpServers

# Verificar que el servidor está corriendo (en Claude Code)
# El servidor debería aparecer en las herramientas disponibles con prefijo "mcp__"
```

## 🧪 Testing

### Manual
- [ ] Verificar que el servidor aparece en `claude mcp list`
- [ ] Confirmar que las herramientas MCP aparecen con prefijo `mcp__` en Claude Code
- [ ] Probar funcionalidad básica del servidor MCP
- [ ] Verificar que las variables de entorno se cargan correctamente

### Verificación de Integración
```bash
# 1. Listar herramientas disponibles en Claude Code
# Las herramientas MCP deberían aparecer con formato: mcp__<servidor>__<herramienta>

# 2. Probar herramienta específica
# Ejemplo para Sentry: usar mcp__sentry__get_issues en una conversación
```

## 🚀 Mejores Prácticas

### 1. Variables de Entorno Sensibles
- Nunca hardcodear credenciales en la configuración
- Usar archivos `.env` locales para desarrollo
- Documentar qué variables son necesarias

### 2. Sincronización de Configuraciones
- Mantener `settings.local.json` actualizado para referencia del equipo
- Documentar la configuración en README del proyecto
- Incluir ejemplos de configuración sin credenciales

### 3. Documentación del Servidor
- Crear entrada en `/docs/tech/` para cada servidor MCP complejo
- Incluir casos de uso y ejemplos
- Documentar limitaciones conocidas

## 📊 Monitoreo

### Verificaciones Post-Integración
- Logs de Claude Code para errores de inicialización
- Verificar consumo de recursos del servidor MCP
- Monitorear rate limits si aplica

### Posibles Problemas
- **Servidor no aparece**: Verificar sintaxis de configuración JSON
- **Errores de autenticación**: Confirmar variables de entorno
- **Herramientas no disponibles**: Reiniciar Claude Code después de cambios

## 🔗 Referencias
- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Claude Code CLI Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- Configuración local del proyecto: `settings.local.json`
- Variables de entorno: `.env.example`

## 📌 Notas Importantes

### Diferencias Claude Desktop vs Claude Code
- **Claude Desktop**: Configuración GUI en ajustes de la aplicación
- **Claude Code**: Configuración CLI con comandos `claude mcp`
- **Archivos de configuración**: Ubicaciones diferentes según plataforma
- **Gestión de procesos**: Claude Code gestiona automáticamente el ciclo de vida de los servidores MCP

### Troubleshooting Común
1. **"Server not found"**: Verificar que el paquete npm existe y es accesible
2. **"Permission denied"**: Verificar permisos de ejecución en scripts locales
3. **"Environment variable not set"**: Confirmar que todas las variables requeridas están definidas
4. **Herramientas no aparecen**: Esperar unos segundos o reiniciar Claude Code