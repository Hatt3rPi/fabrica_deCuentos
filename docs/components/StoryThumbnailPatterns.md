# Story Thumbnail Patterns

## 📋 Descripción
Patrones consistentes para mostrar imágenes de portada de historias en diferentes contextos de La CuenterIA. Esta guía estandariza el uso de thumbnails para mantener consistencia visual y una mejor experiencia de usuario.

## 🎨 Patrones Disponibles

### 1. Card Pattern (StoryCard.tsx)
**Uso**: Tarjetas principales de historia en dashboards y listados
```tsx
<div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
  {imageUrl ? (
    <img 
      src={imageUrl} 
      alt={story.title} 
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
      <BookOpen className="w-10 h-10 text-gray-400" />
    </div>
  )}
</div>
```
- **Dimensiones**: Aspect ratio 16:9 (video)
- **Fallback**: BookOpen icon (w-10 h-10)
- **Características**: Hover effect con scale

### 2. List Item Pattern (CartItem.tsx, CheckoutModal.tsx)
**Uso**: Items de carrito, listas compactas, modal de checkout
```tsx
<div className="flex-shrink-0">
  {item.storyThumbnail ? (
    <img
      src={item.storyThumbnail}
      alt={`Portada de ${item.storyTitle}`}
      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
    />
  ) : (
    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
      <BookOpen className="w-8 h-8 text-purple-600" />
    </div>
  )}
</div>
```
- **Dimensiones**: 64x64px (w-16 h-16)
- **Fallback**: BookOpen icon (w-8 h-8) con gradient purple
- **Características**: Border y rounded corners

### 3. Compact Pattern (MyPurchases.tsx)
**Uso**: Listados compactos de compras, historial
```tsx
<div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
  {item.story?.cover_url ? (
    <img
      src={item.story.cover_url}
      alt={item.story.title || 'Historia sin título'}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <BookOpen className="w-8 h-8 text-gray-400" />
    </div>
  )}
</div>
```
- **Dimensiones**: 80x80px (w-20 h-20)
- **Fallback**: BookOpen icon (w-8 h-8) simple
- **Características**: Overflow hidden, sin border

## 🔧 Cuándo Usar Cada Patrón

### Card Pattern
- ✅ StoryCard principal
- ✅ Featured stories
- ✅ Gallery views
- ❌ Listas compactas
- ❌ Items de carrito

### List Item Pattern 
- ✅ CartItem component
- ✅ CheckoutModal items
- ✅ Listas de selección
- ❌ Tarjetas principales
- ❌ Headers grandes

### Compact Pattern
- ✅ MyPurchases page
- ✅ Historial de compras
- ✅ Mini previews
- ❌ Elementos principales
- ❌ Call-to-action cards

## 🎯 Consistencias Clave

### Fallback Icon
- **Siempre usar**: `BookOpen` de lucide-react
- **Nunca usar**: Package, Image, o otros iconos genéricos
- **Colores**: Purple theme para contextos activos, gray para neutros

### Object Fit
- **Siempre usar**: `object-cover` para mantener aspect ratio
- **Evitar**: `object-contain` que puede dejar espacios vacíos

### Alt Text
- **Formato**: `"Portada de ${storyTitle}"` para contexto
- **Fallback**: `"Historia sin título"` si no hay título

## 🔄 Migración de Componentes Existentes

### ❌ Patrón Inconsistente (Antes)
```tsx
// CheckoutModal.tsx - INCORRECTO
<div className="w-12 h-12 bg-purple-100 rounded-lg">
  {item.storyThumbnail ? (
    <img className="w-full h-full object-cover rounded-lg" />
  ) : (
    <Package className="w-6 h-6 text-purple-600" />
  )}
</div>
```

### ✅ Patrón Correcto (Después)
```tsx
// CheckoutModal.tsx - CORRECTO
<div className="flex-shrink-0">
  {item.storyThumbnail ? (
    <img className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
  ) : (
    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
      <BookOpen className="w-8 h-8 text-purple-600" />
    </div>
  )}
</div>
```

## 📝 Notas de Implementación

### Consideraciones de Performance
- Usar `loading="lazy"` en imágenes fuera del viewport inicial
- Implementar `onError` handlers para fallback graceful
- Considerar WebP format para mejor compresión

### Accesibilidad
- Alt text descriptivo siempre presente
- Contraste adecuado en fallback icons
- Focus states para elementos interactivos

### Responsive Design
- Patrones se adaptan bien en mobile
- Considerar dimensiones menores en breakpoints xs
- Mantener proporciones en todos los tamaños

## 🔗 Archivos Relacionados
- `/src/components/StoryCard.tsx` - Card Pattern implementation
- `/src/components/Cart/CartItem.tsx` - List Item Pattern implementation  
- `/src/components/Cart/CheckoutModal.tsx` - List Item Pattern usage
- `/src/pages/MyPurchases.tsx` - Compact Pattern implementation