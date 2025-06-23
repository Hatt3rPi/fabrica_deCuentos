# Reset Automático de Scroll en Wizard

## 📋 Issues Resueltos
- UX: Usuario queda en scroll intermedio al navegar entre pasos del wizard
- Nueva pantalla no aparece desde el inicio automáticamente

## 🎯 Objetivo
Mejorar la navegación entre pasos del wizard haciendo que cada nuevo paso "nazca" desde el top automáticamente, sin scroll intermedio que confunda al usuario.

## 📁 Archivos Modificados
- `src/components/Wizard/Wizard.tsx` - Agregado useEffect para reset de scroll automático

## 🔧 Cambios Técnicos

### Antes
```jsx
// No había reset de scroll al cambiar pasos
// Usuario podía quedar en medio de la pantalla
```

### Después  
```jsx
// Reset scroll to top when step changes (improves UX navigation)
useEffect(() => {
  window.scrollTo(0, 0);
}, [currentStep]);
```

### Descripción del Cambio
Se agregó un `useEffect` que ejecuta `window.scrollTo(0, 0)` cada vez que cambia `currentStep`. Esto asegura que:

- Cada nuevo paso del wizard se muestra desde el inicio
- No hay scroll intermedio que oculte contenido importante
- La nueva pantalla "nace" desde su vista superior de forma natural
- Reset inmediato sin animaciones que interfieran

## 🧪 Testing

### Manual
- [x] Navegación hacia adelante: Verificar scroll al top en cada paso
- [x] Navegación hacia atrás: Verificar scroll al top al retroceder
- [x] Contenido largo: Verificar reset incluso con pasos de mucho contenido

### Automatizado
- [x] Servidor de desarrollo inicia correctamente
- [x] No hay regresiones en funcionalidad de navegación
- [x] useEffect no interfiere con otros efectos del wizard

## 🚀 Deployment

### Requisitos
- [x] Cambio solo afecta frontend
- [x] Compatible con todos los navegadores modernos
- [x] No requiere configuración adicional

### Pasos
1. Deploy automático vía pipeline existente
2. Verificación en ambiente de producción

## 📊 Monitoreo

### Métricas a Observar
- UX: Mejorar satisfacción de usuario en navegación del wizard
- Usabilidad: Reducir casos de contenido "perdido" fuera de vista

### Posibles Regresiones
- Verificar que scroll automático no interfiera con modales
- Confirmar que funciona correctamente en dispositivos móviles

## 🔗 Referencias
- Commit: `3acae47` - feat: Agregar reset automático de scroll al cambiar pasos en wizard
- Archivo modificado: `src/components/Wizard/Wizard.tsx:30-32`
- Implementación: `useEffect(() => { window.scrollTo(0, 0); }, [currentStep]);`