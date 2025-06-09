# 📱 OptimizedImage

Componente utilitario para mostrar imágenes optimizadas.

## 📋 Descripción

`OptimizedImage` genera automáticamente una URL optimizada a partir de una ruta de imagen almacenada en Supabase. Permite definir el ancho, la calidad y el formato final.

## 🔧 Props

```typescript
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  path: string;
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}
```

## 🔄 Funcionalidades

1. Convierte rutas relativas de Supabase en URLs públicas válidas.
2. Agrega parámetros de tamaño, calidad y formato para mejorar la carga.
3. Puede usarse en cualquier parte de la aplicación en lugar de `<img>` estándar.

## 📝 Uso

```tsx
<OptimizedImage path="storage/fallback-images/miniatura_acuarela.png" width={256} quality={80} format="webp" alt="Ejemplo" />
```
