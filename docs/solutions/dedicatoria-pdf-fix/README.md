# Fix: Dedicatoria Siempre Aparece en PDF (Issue #267)

## 📋 Issue Resuelto
- **Issue #267**: Dedicatoria no aparece en PDF cuando usuario elige incluirla pero no escribe texto

## 🎯 Objetivo
Asegurar que la dedicatoria aparezca en el PDF generado cuando el usuario ha elegido incluirla, respetando exactamente lo que el usuario configuró sin agregar contenido por defecto.

## 🔍 Problema Identificado

### Antes
- La Edge Function `story-export` solo mostraba dedicatoria si existía `dedicatoria_text`
- Ignoraba el campo `dedicatoria_chosen` (decisión del usuario)
- **Resultado**: Usuario elegía "SÍ" pero no aparecía si no escribía texto

### Flujo Problemático
1. Usuario elige "SÍ quiero dedicatoria"
2. Usuario no escribe texto personalizado (o solo sube imagen)
3. PDF generado NO incluye página de dedicatoria
4. Se pierde la decisión del usuario

## 🛠️ Solución Implementada

### 1. Corregir Lógica de Generación (Edge Function)
**Archivo**: `/supabase/functions/story-export/index.ts`

#### Antes
```typescript
if (!story.dedicatoria_text) {
  return ''; // No mostrar página si no hay texto
}
```

#### Después
```typescript
if (!story.dedicatoria_chosen) {
  return ''; // No mostrar página si usuario no eligió tener dedicatoria
}

// Manejar diferentes casos de contenido
if (!story.dedicatoria_text && !story.dedicatoria_image_url) {
  // Página de dedicatoria vacía pero estilizada
  return generarPaginaVacia();
}
```

### 2. Corregir Carga en WizardContext
**Archivo**: `/src/context/WizardContext.tsx`

#### Antes
```typescript
dedicatoria: s.dedicatoria_text ? {
  text: s.dedicatoria_text,
  // ...
} : undefined
```

#### Después
```typescript
dedicatoria: (s.dedicatoria_chosen || s.dedicatoria_text || s.dedicatoria_image_url) ? {
  text: s.dedicatoria_text || '',
  // ...
} : undefined
```

## 📊 Casos de Uso Soportados

| Escenario | Acción Usuario | Resultado PDF |
|-----------|----------------|---------------|
| 1 | Elige "SÍ" + escribe texto | ✅ Página con texto personalizado |
| 2 | Elige "SÍ" + solo sube imagen | ✅ Página solo con imagen |
| 3 | Elige "SÍ" + texto + imagen | ✅ Página con ambos elementos |
| 4 | Elige "SÍ" + no hace nada | ✅ Página de dedicatoria reservada (vacía estilizada) |
| 5 | Elige "NO" | ✅ Sin página de dedicatoria |
| 6 | No elige nada | ✅ Sin página de dedicatoria |

## 🔧 Detalles Técnicos

### Campo Clave: `dedicatoria_chosen`
- **Tipo**: `boolean | null`
- **Valores**:
  - `true`: Usuario eligió incluir dedicatoria
  - `false`: Usuario eligió NO incluir dedicatoria  
  - `null`: Usuario no ha decidido

### Mapeo de Campos
- **Frontend**: `storySettings.dedicatoria.text` ↔ **BD**: `dedicatoria_text`
- **Frontend**: `storySettings.dedicatoria.imageUrl` ↔ **BD**: `dedicatoria_image_url`
- **Frontend**: Elección en DedicatoriaChoiceStep ↔ **BD**: `dedicatoria_chosen`

### Layouts Soportados
- `imagen-arriba`, `imagen-abajo`, `imagen-izquierda`, `imagen-derecha`
- Alineaciones: `centro`, `izquierda`, `derecha`
- Tamaños de imagen: `pequena`, `mediana`, `grande`

## 🧪 Testing

### Manual
- [x] **Caso 1**: Crear historia → elegir "SÍ" → escribir texto → exportar PDF → verificar dedicatoria aparece
- [x] **Caso 2**: Crear historia → elegir "SÍ" → solo subir imagen → exportar PDF → verificar solo imagen
- [x] **Caso 3**: Crear historia → elegir "SÍ" → no hacer nada → exportar PDF → verificar página reservada
- [x] **Caso 4**: Crear historia → elegir "NO" → exportar PDF → verificar sin dedicatoria

### Automatizado
```bash
npm run cypress:run # Tests existentes deben pasar
```

## 📁 Archivos Modificados
1. `/supabase/functions/story-export/index.ts` - Función `generateDedicatoriaPage()`
2. `/src/context/WizardContext.tsx` - Lógica de carga de dedicatoria

## ⚡ Beneficios

### Para el Usuario
- ✅ Su decisión de incluir dedicatoria siempre se respeta
- ✅ Flexibilidad total: texto, imagen, ambos, o página reservada
- ✅ No hay contenido impuesto automáticamente

### Para el Desarrollo
- ✅ Lógica centralizada en `dedicatoria_chosen`
- ✅ Consistencia entre wizard y PDF generado
- ✅ Mejor logging para debugging
- ✅ Código más mantenible

## 🔗 Referencias
- Issue #267: Configuración de dedicatoria y aparición en PDF
- Edge Function `story-export`: Generación de PDF
- Wizard flow: Pasos de dedicatoria

## 📝 Commit
```
fix: Dedicatoria siempre aparece en PDF cuando usuario la elige
- Edge Function: Usar dedicatoria_chosen en lugar de dedicatoria_text
- Soporte para dedicatorias solo con imagen, solo con texto, o vacías
- WizardContext: Cargar dedicatoria basado en elección del usuario
```

## 🔄 Seguimiento

**Status**: ✅ Completado  
**Fecha**: 2025-01-26  
**Testing**: Manual completado, automatizado pendiente  
**Deploy**: Listo para merge