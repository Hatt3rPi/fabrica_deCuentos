# 📝 Implementar variante _multi para mensajes de carga con múltiples personajes

## 📌 Contexto
Se necesita soportar mensajes de carga específicos para cuando se están procesando múltiples personajes en las diferentes etapas del flujo de creación de cuentos.

## 🎯 Objetivo
Implementar la variante `_multi` para los mensajes de carga, permitiendo mensajes personalizados cuando hay múltiples personajes involucrados. 
ejemplo, Personajes: Paco,

## 📋 Especificaciones Técnicas

### 1. Formato de Nombres de Personajes
Los nombres de los personajes deben formatearse según la cantidad:
- **1 personaje**: `"Luna"`
- **2 personajes**: `"Luna y Sol"`
- **3 o más personajes**: `"Luna, Sol y Estrella"`

### 2. Estructura de Tipos
```typescript
type Etapa = 
  | 'personajes' 
  | 'cuento_fase1' | 'cuento_fase1_multi'
  | 'cuento_fase2' | 'cuento_fase2_multi'
  | 'vista_previa' | 'vista_previa_multi';
```

### 3. Uso en Mensajes
Los placeholders en los mensajes deben usar el formato `{personajes}` que será reemplazado automáticamente con la lista formateada.

Ejemplo de mensajes en `loaderMessages.ts`:
```typescript
{
  id: 'm.1',
  text: 'Preparando la historia de {personajes}...',
  etapa: ['cuento_fase1_multi']
}
```

### 4. Contexto Requerido
Cuando se usen mensajes multi, el contexto debe incluir:
- `personajes`: Array con los nombres de los personajes
- `current`: Índice actual (opcional)
- `total`: Total de personajes (opcional)

## ✅ Tareas Pendientes

### 1. Actualización de Mensajes
- [ ] Agregar mensajes específicos para cada etapa con sufijo `_multi`
- [ ] Traducir mensajes a todos los idiomas soportados
- [ ] Validar placeholders en mensajes multi

### 2. Integración con Componentes
- [ ] Actualizar `OverlayLoader` para detectar automáticamente variante `_multi`
- [ ] Implementar lógica de progreso (current/total)
- [ ] Manejar transiciones entre mensajes multi y estándar

### 3. Testing
- [ ] Pruebas unitarias para `getLoaderMessages` con variante `_multi`
- [ ] Pruebas de integración con múltiples personajes
- [ ] Validar accesibilidad en modo multi

### 4. Documentación
- [ ] Actualizar documentación de mensajes
- [ ] Agregar ejemplos de uso con múltiples personajes
- [ ] Documentar convención de nomenclatura `_multi`

## 📝 Notas de Implementación

### Uso Básico
```typescript
// Para un solo personaje
getLoaderMessages('personajes', { personaje: 'Luna' });

// Para múltiples personajes
getLoaderMessages('personajes', { 
  personajes: ['Luna', 'Sol', 'Estrella'] 
});
```