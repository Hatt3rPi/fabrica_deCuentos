# ComponentName

## 📋 Descripción
Descripción general del componente, su propósito y lugar en la aplicación.

## 🔧 Props Interface
```typescript
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  onAction: (param: Type) => void;
}
```

## 🎯 Estados
```typescript
const [state1, setState1] = useState<Type>(initialValue);
const [state2, setState2] = useState<Type>(initialValue);
```

## 🔗 Hooks Utilizados
- `useHookName()` - Descripción del propósito
- `useAnotherHook()` - Descripción del propósito

## 🌐 Integración con Contextos
- `useContextName()` - Qué consume del contexto
- `useAnotherContext()` - Qué consume del contexto

## ⚡ Funcionalidades

### Funcionalidad Principal
1. **Acción 1**: Descripción de qué hace
2. **Acción 2**: Descripción de qué hace
3. **Acción 3**: Descripción de qué hace

### Funcionalidades Secundarias
- **Feature A**: Descripción
- **Feature B**: Descripción

## 🎨 Variantes/Estados Visuales
- **Estado 1**: Cuándo se muestra y cómo
- **Estado 2**: Cuándo se muestra y cómo
- **Estado de Loading**: Comportamiento durante carga
- **Estado de Error**: Manejo de errores

## 🔄 Ciclo de Vida
1. **Mount**: Qué sucede al montarse
2. **Updates**: Qué desencadena re-renders
3. **Unmount**: Limpieza al desmontarse

## 🧪 Testing

### Selectores para Tests
```typescript
// Selectores data-testid utilizados
'component-name-container'
'component-name-action-button'
'component-name-input'
```

### Casos de Prueba
- [ ] Renderizado inicial correcto
- [ ] Interacciones del usuario
- [ ] Estados de loading y error
- [ ] Integración con contextos

## 📊 Performance

### Optimizaciones
- `React.memo()` - Si aplica y por qué
- `useMemo()` / `useCallback()` - Para qué valores/funciones
- Lazy loading - Si implementa carga diferida

### Consideraciones
- Renderizados evitados
- Dependencias costosas
- Impacto en bundle size

## 🔗 Componentes Relacionados
- `RelatedComponent1` - Relación y propósito
- `RelatedComponent2` - Relación y propósito

## 📝 Notas de Implementación
- Decisiones técnicas importantes
- Limitaciones conocidas
- TODOs futuros