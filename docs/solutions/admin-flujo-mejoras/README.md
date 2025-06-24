# Mejoras al Panel Admin/Flujo - Etapas Diseño y Vista Previa

## 📋 Issues Resueltos
- Issue #255: [auto][prioridad alta] Agregar etapas Diseño y Vista Previa a admin/flujo con contador de usuarios activos

## 🎯 Objetivo
Mejorar el panel de administración /admin/flujo para incluir todas las etapas del flujo de creación de cuentos, agregando las etapas faltantes de Diseño y Vista Previa, además de implementar un contador de usuarios activos para mejor monitoreo del sistema.

## 📁 Archivos Modificados
- `src/pages/Admin/Flujo.tsx` - Agregadas nuevas etapas al CONFIG, implementado contador de usuarios activos
- `src/constants/edgeFunctionColors.ts` - Agregados colores para las nuevas edge functions

## 🔧 Cambios Técnicos

### 1. Nuevas Etapas en CONFIG

#### Antes
```typescript
const CONFIG = {
  personajes: [...],
  historia: [...]
};
```

#### Después  
```typescript
const CONFIG = {
  personajes: [...],
  historia: [...],
  diseño: [
    { key: 'generar_ilustracion', label: 'Generar ilustración', fn: 'generate-illustration' },
    { key: 'generar_paginas', label: 'Generar páginas', fn: 'generate-image-pages' },
  ],
  'vista previa': [
    { key: 'generar_pdf', label: 'Generar PDF', fn: 'story-export' },
  ],
};
```

### 2. Contador de Usuarios Activos

Se agregó un nuevo estado y función para contar usuarios únicos:

```typescript
const [activeUsers, setActiveUsers] = useState<number>(0);

const loadActiveUsers = async () => {
  const sinceMs = Date.now() - 60 * 60 * 1000; // Last 60 minutes
  const sinceIso = new Date(sinceMs).toISOString();
  const activities = Object.values(CONFIG).flat().map((a) => a.key);
  
  const { data } = await supabase
    .from('prompt_metrics')
    .select('user_id')
    .in('actividad', activities)
    .gte('timestamp', sinceIso);
  
  // Count unique users
  const uniqueUsers = new Set((data || []).map((row: any) => row.user_id));
  setActiveUsers(uniqueUsers.size);
};
```

### 3. UI del Contador

```tsx
<div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white shadow-lg">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold">Usuarios Activos</h2>
      <p className="text-purple-100 text-sm">Últimos 60 minutos</p>
    </div>
    <div className="text-3xl font-bold">{activeUsers}</div>
  </div>
</div>
```

### 4. Colores para Edge Functions

```typescript
'generate-illustration': { base: 'bg-indigo-100 text-indigo-800', active: 'bg-indigo-600 text-white' },
'story-export': { base: 'bg-red-100 text-red-800', active: 'bg-red-600 text-white' }
```

## 🔍 Edge Functions Identificadas

### Etapa Diseño
1. **generate-illustration**: Genera ilustraciones individuales para las páginas del cuento
2. **generate-image-pages**: Genera imágenes para páginas con múltiples personajes

### Etapa Vista Previa
1. **story-export**: Genera el PDF final del cuento y marca como completado

## 🧪 Testing

### Manual
- [x] Verificar que aparecen las nuevas etapas en admin/flujo
- [x] Confirmar que el contador de usuarios activos se muestra correctamente
- [x] Probar que los toggles funcionan para las nuevas etapas
- [x] Verificar que las métricas se cargan para las nuevas edge functions
- [x] Confirmar que los colores se aplican correctamente
- [x] Verificar que el contador se actualiza cada 10 segundos

### Automatizado
- [x] `npm run lint` - Verificar que no hay nuevos errores de linting
- [x] `npm run dev` - Verificar que la aplicación inicia correctamente

## 🚀 Deployment

### Requisitos
- [x] Las edge functions deben estar desplegadas en Supabase
- [x] La tabla `prompt_metrics` debe tener datos para mostrar métricas
- [x] Los permisos de admin deben estar configurados correctamente

### Pasos
1. Hacer merge del PR a main
2. El despliegue es automático via GitHub Actions
3. Verificar en producción que las nuevas etapas aparecen en /admin/flujo

## 📊 Monitoreo

### Métricas a Observar
- **Usuarios Activos**: Número de usuarios únicos ejecutando edge functions en los últimos 60 minutos
- **Actividad por Etapa**: Total de llamadas y tasa de error para cada edge function
- **Estado de Toggles**: Verificar que los toggles reflejan correctamente el estado habilitado/deshabilitado

### Sistema de Control de Edge Functions
Cuando se deshabilita una edge function mediante el toggle:
1. La edge function verifica el estado con `isActivityEnabled()`
2. Si está deshabilitada, retorna error 403
3. El frontend maneja el error apropiadamente (ej: fallback para PDF)

## 🔗 Referencias
- PR: https://github.com/Customware-cl/Lacuenteria/pull/258
- Issue #255: Agregar etapas Diseño y Vista Previa a admin/flujo
- Documentación de Edge Functions: `/docs/tech/`