#!/bin/bash

# Script para crear imágenes WebP de prueba
# Requiere: imagemagick

# Directorio de imágenes
IMAGE_DIR="supabase/storage/fallback-images"

# Verificar si el directorio existe
if [ ! -d "$IMAGE_DIR" ]; then
  echo "Error: El directorio $IMAGE_DIR no existe."
  exit 1
fi

# Crear imágenes WebP de prueba
create_test_image() {
  local style="$1"
  local output_file="$IMAGE_DIR/$style.webp"
  
  echo "Creando imagen para estilo: $style"
  
  # Crear una imagen de 800x800 con el nombre del estilo
  convert -size 800x800 xc:white \
    -fill "#$(openssl rand -hex 3)" -draw "rectangle 0,0 800,800" \
    -fill black -gravity center -pointsize 40 -annotate 0 "$style" \
    -define webp:lossless=false -define webp:method=6 -quality 85 \
    "$output_file"
  
  echo "Imagen creada: $output_file ($(du -h "$output_file" | cut -f1))"
}

# Crear imágenes para cada estilo
create_test_image "acuarela-digital"
create_test_image "dibujado-a-mano"
create_test_image "recortes-de-papel"
create_test_image "kawaii"

echo "Imágenes WebP creadas correctamente."

