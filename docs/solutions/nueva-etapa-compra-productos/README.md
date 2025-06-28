# Nueva Etapa de Compra y Selección de Productos

## 📋 Issues Creados
- Issue #279: [auto][prioridad alta] Implementar etapa de selección de productos
- Issue #280: [auto][prioridad alta] Implementar etapa de pago simbólico
- Issue #281: [auto][prioridad media] Separar generación PDF de descarga en ExportStep
- Issue #282: [auto][prioridad media] Crear sistema de gestión de precios para productos

## 🎯 Objetivo
Agregar nuevas etapas al wizard de creación de cuentos que permitan al usuario:
1. **Seleccionar producto**: Elegir entre Libro Digital (disponible) y Libro Físico (próximamente)
2. **Procesar pago**: Realizar pago simbólico por el producto seleccionado
3. **Descargar**: Acceder al PDF solo después del pago exitoso

Esta solución prepara la arquitectura para monetización real manteniendo excelente UX/UI.

## 🔄 Flujo Propuesto

### Flujo Actual del Wizard
```
characters → story → design → preview → dedicatoria-choice → dedicatoria → export
```

### Nuevo Flujo del Wizard
```
characters → story → design → preview → dedicatoria-choice → dedicatoria → product-selection → payment → export
```

## 📁 Archivos Planificados

### Nuevos Componentes
- `src/components/Wizard/steps/ProductSelectionStep.tsx` - Selección de productos con precios
- `src/components/Wizard/steps/PaymentStep.tsx` - Interfaz de pago simbólico
- `src/components/Admin/PriceEditModal.tsx` - Modal para editar precios
- `src/pages/Admin/PriceManager.tsx` - Gestión completa de precios

### Nuevos Servicios
- `src/services/productService.ts` - Gestión de productos disponibles
- `src/services/paymentService.ts` - Procesamiento de pagos simbólicos
- `src/services/priceService.ts` - Gestión centralizada de precios

### Nuevos Types
- `src/types/product.ts` - Interfaces para productos y selección
- `src/types/payment.ts` - Interfaces para datos de pago y transacciones

### Hooks Opcionales
- `src/hooks/usePrices.ts` - Hook para obtener precios dinámicos
- `src/hooks/usePayment.ts` - Hook para gestión de estados de pago

## 🔧 Cambios Técnicos Principales

### 1. Actualización de WizardContext.tsx
```typescript
// Antes
export type WizardStep = 'characters' | 'story' | 'design' | 'preview' | 'dedicatoria-choice' | 'dedicatoria' | 'export';

// Después
export type WizardStep = 'characters' | 'story' | 'design' | 'preview' | 'dedicatoria-choice' | 'dedicatoria' | 'product-selection' | 'payment' | 'export';
```

### 2. Actualización de EstadoFlujo
```typescript
// Antes
export interface EstadoFlujo {
  personajes: { estado: EtapaEstado; personajesAsignados: number; };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
  dedicatoriaChoice: EtapaEstado;
  dedicatoria: EtapaEstado;
}

// Después
export interface EstadoFlujo {
  personajes: { estado: EtapaEstado; personajesAsignados: number; };
  cuento: EtapaEstado;
  diseno: EtapaEstado;
  vistaPrevia: EtapaEstado;
  dedicatoriaChoice: EtapaEstado;
  dedicatoria: EtapaEstado;
  productSelection: EtapaEstado;
  payment: EtapaEstado;
}
```

### 3. Separación de ExportStep
```typescript
// Antes - ExportStep genera PDF automáticamente
useEffect(() => {
  if (!completionResult && !isCompleting) {
    completeStory(saveToLibrary);
  }
}, []);

// Después - ExportStep solo muestra descarga
useEffect(() => {
  // Verificar si hay PDF disponible post-pago
  // Mostrar opciones de descarga apropiadas
}, []);
```

## 🗄️ Estructura de Base de Datos

### Nuevas Tablas
```sql
-- Tipos de productos disponibles
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Precios con versionado y vigencia
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID REFERENCES product_types(id),
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CLP',
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_to TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Historial de cambios de precios para auditoría
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID REFERENCES product_types(id),
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  currency VARCHAR(3),
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Integración con Sistema Existente
- Utiliza tabla `fulfillment_history` existente para tracking de transacciones
- Conecta con función `update_fulfillment_status()` existente
- Aprovecha sistema de roles admin existente

## 🎨 Consideraciones UX/UI

### ProductSelectionStep
- **Cards de productos** con diseño limpio y claro
- **Precios prominentes** en formato CLP con separadores
- **Estado "Próximamente"** para productos no disponibles
- **Selección visual clara** del producto elegido

### PaymentStep
- **Resumen del producto** en la parte superior
- **Formulario simple** con campos esenciales (mock)
- **Estados de loading** durante procesamiento
- **Confirmación celebratoria** tras pago exitoso

### ExportStep Modificado
- **Solo descarga** para historias con pago completado
- **Retrocompatibilidad** para historias existentes
- **Mensajes claros** sobre estado del PDF

## 🧪 Testing Requerido

### Flujo Completo Nuevo
1. Completar wizard hasta dedicatoria
2. Seleccionar producto en product-selection
3. Procesar pago en payment step
4. Verificar descarga disponible en export
5. Confirmar actualización de fulfillment_status

### Retrocompatibilidad
1. Historias existentes mantienen funcionalidad de descarga
2. Navegación hacia atrás preserva selecciones
3. Estados de wizard se persisten correctamente

### Tests Automatizados
- Ejecutar `npm run cypress:run` para verificar no regresiones
- Crear tests específicos para nuevas etapas
- Validar persistencia de estados en localStorage

## 🚀 Orden de Implementación

### Fase 1: Fundamentos
1. **Issue #282**: Sistema de gestión de precios (prerequisito)
2. **Issue #279**: Etapa de selección de productos

### Fase 2: Procesamiento
3. **Issue #280**: Etapa de pago simbólico
4. **Issue #281**: Separar generación PDF de descarga

### Fase 3: Integración y Testing
5. Testing completo del flujo integrado
6. Retrocompatibilidad y edge cases
7. Performance y optimización

## 📊 Beneficios Esperados

### Para Usuarios
- **Claridad** en el proceso de compra
- **Transparencia** en precios y productos
- **Experiencia fluida** desde creación hasta descarga
- **Preparación** para productos físicos futuros

### Para el Negocio
- **Monetización** clara y directa
- **Flexibilidad** en precios sin cambios de código
- **Preparación** para escalabilidad
- **Métricas** de conversión en cada etapa

### Para Desarrollo
- **Arquitectura extensible** para nuevos productos
- **Separación de responsabilidades** clara
- **Mantenibilidad** mejorada
- **Testing** más granular

## 🔗 Referencias
- Issue #279: https://github.com/Customware-cl/Lacuenteria/issues/279
- Issue #280: https://github.com/Customware-cl/Lacuenteria/issues/280
- Issue #281: https://github.com/Customware-cl/Lacuenteria/issues/281
- Issue #282: https://github.com/Customware-cl/Lacuenteria/issues/282
- Sistema de fulfillment existente: `supabase/migrations/20250627110807_add_fulfillment_tracking.sql`