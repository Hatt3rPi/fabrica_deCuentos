# Configuración de Browserless.io para Puppeteer

## 🚀 Pasos para obtener token gratuito

### 1. Registrarse en Browserless.io
```bash
# Visitar: https://account.browserless.io/signup/email
# Seleccionar plan gratuito
# Completar registro con email
```

### 2. Obtener API Token
```bash
# Después del registro:
# 1. Ir al dashboard de la cuenta
# 2. Buscar sección "API Keys" o "Tokens"
# 3. Copiar el token de acceso
```

### 3. Configurar variable de entorno

#### Para desarrollo local:
```bash
# En .env.local
BROWSERLESS_TOKEN=tu_token_aqui
```

#### Para producción en Supabase:
```bash
# En Supabase Dashboard > Project Settings > Environment Variables
# Agregar nueva variable:
# Nombre: BROWSERLESS_TOKEN
# Valor: tu_token_browserless
```

### 4. Verificar configuración
```typescript
// En la Edge Function
const browserlessToken = Deno.env.get('BROWSERLESS_TOKEN');
if (!browserlessToken) {
  throw new Error('BROWSERLESS_TOKEN no configurado');
}
```

## 📋 Límites del plan gratuito
- Verificar en dashboard después del registro
- Típicamente incluye:
  - Número limitado de sesiones por mes
  - Timeout por sesión
  - Concurrent sessions limitadas

## 🔄 Próximos pasos
1. **Registrarse** en Browserless.io
2. **Obtener token** del dashboard
3. **Configurar** variable de entorno en Supabase
4. **Desplegar** función actualizada
5. **Testing** de generación de PDF

## 🔗 Enlaces útiles
- Registro: https://account.browserless.io/signup/email
- Documentación: https://docs.browserless.io/
- Dashboard: https://account.browserless.io/