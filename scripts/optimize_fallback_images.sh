#!/bin/bash

# Script para optimizar las imágenes de respaldo
# Requiere: imagemagick, webp

# Verificar si las herramientas necesarias están instaladas
command -v convert >/dev/null 2>&1 || { echo "Error: ImageMagick no está instalado. Instálalo con 'apt-get install imagemagick' o 'brew install imagemagick'."; exit 1; }
command -v cwebp >/dev/null 2>&1 || { echo "Error: WebP no está instalado. Instálalo con 'apt-get install webp' o 'brew install webp'."; exit 1; }

# Directorio de imágenes
IMAGE_DIR="supabase/storage/fallback-images"

# Verificar si el directorio existe
if [ ! -d "$IMAGE_DIR" ]; then
  echo "Error: El directorio $IMAGE_DIR no existe."
  exit 1
fi

# Función para optimizar una imagen
optimize_image() {
  local input_file="$1"
  local output_file="${input_file%.*}.webp"
  local temp_file="${input_file%.*}_temp.png"
  
  echo "Procesando: $input_file"
  
  # Redimensionar a 800x800 si es necesario y convertir a PNG temporal
  convert "$input_file" -resize 800x800^ -gravity center -extent 800x800 "$temp_file"
  
  # Convertir a WebP con alta calidad pero optimizado para web
  cwebp -q 85 -m 6 -mt -af "$temp_file" -o "$output_file"
  
  # Verificar tamaño
  local size=$(du -k "$output_file" | cut -f1)
  if [ "$size" -gt 500 ]; then
    echo "Advertencia: $output_file excede los 500KB (${size}KB). Optimizando más..."
    # Reducir calidad para cumplir con el límite de tamaño
    cwebp -q 75 -m 6 -mt -af "$temp_file" -o "$output_file"
    
    # Verificar nuevamente
    size=$(du -k "$output_file" | cut -f1)
    if [ "$size" -gt 500 ]; then
      echo "Advertencia: $output_file aún excede los 500KB (${size}KB) después de la optimización."
    fi
  fi
  
  # Eliminar archivo temporal
  rm "$temp_file"
  
  echo "Imagen optimizada: $output_file ($(du -h "$output_file" | cut -f1))"
}

# Procesar todas las imágenes en el directorio (excepto README.md)
for file in "$IMAGE_DIR"/*; do
  if [[ -f "$file" && "$file" != *README.md ]]; then
    optimize_image "$file"
  fi
done

echo "Optimización completada. Todas las imágenes están en formato WebP y optimizadas para web."

