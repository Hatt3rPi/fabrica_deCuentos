#!/bin/bash

# Script para verificar que las imágenes de respaldo cumplan con los criterios especificados
# Requiere: imagemagick

# Verificar si las herramientas necesarias están instaladas
command -v identify >/dev/null 2>&1 || { echo "Error: ImageMagick no está instalado. Instálalo con 'apt-get install imagemagick' o 'brew install imagemagick'."; exit 1; }

# Directorio de imágenes
IMAGE_DIR="supabase/storage/fallback-images"

# Verificar si el directorio existe
if [ ! -d "$IMAGE_DIR" ]; then
  echo "Error: El directorio $IMAGE_DIR no existe."
  exit 1
fi

# Estilos visuales esperados
declare -a STYLES=("acuarela-digital" "dibujado-a-mano" "recortes-de-papel" "kawaii")

# Contador de errores
ERRORS=0

# Verificar la existencia de todas las imágenes de estilo
echo "Verificando la existencia de todas las imágenes de estilo..."
for style in "${STYLES[@]}"; do
  if [ ! -f "$IMAGE_DIR/$style.webp" ]; then
    echo "❌ Error: Falta la imagen para el estilo '$style'."
    ERRORS=$((ERRORS+1))
  else
    echo "✅ Imagen para el estilo '$style' encontrada."
  fi
done

# Verificar dimensiones y formato de cada imagen
echo -e "\nVerificando dimensiones y formato de cada imagen..."
for style in "${STYLES[@]}"; do
  file="$IMAGE_DIR/$style.webp"
  if [ -f "$file" ]; then
    # Obtener dimensiones
    dimensions=$(identify -format "%wx%h" "$file")
    if [ "$dimensions" != "800x800" ]; then
      echo "❌ Error: La imagen '$file' no tiene las dimensiones requeridas (800x800). Dimensiones actuales: $dimensions"
      ERRORS=$((ERRORS+1))
    else
      echo "✅ Dimensiones correctas para '$file': $dimensions"
    fi
    
    # Verificar formato
    format=$(identify -format "%m" "$file")
    if [ "$format" != "WEBP" ]; then
      echo "❌ Error: La imagen '$file' no está en formato WebP. Formato actual: $format"
      ERRORS=$((ERRORS+1))
    else
      echo "✅ Formato correcto para '$file': $format"
    fi
    
    # Verificar tamaño
    size=$(du -k "$file" | cut -f1)
    if [ "$size" -gt 500 ]; then
      echo "❌ Error: La imagen '$file' excede el tamaño máximo recomendado (500KB). Tamaño actual: ${size}KB"
      ERRORS=$((ERRORS+1))
    else
      echo "✅ Tamaño correcto para '$file': ${size}KB"
    fi
  fi
done

# Resumen final
echo -e "\n--- RESUMEN DE VERIFICACIÓN ---"
if [ $ERRORS -eq 0 ]; then
  echo "✅ Todas las imágenes cumplen con los criterios especificados."
  echo "✅ Dimensiones: 800x800 píxeles"
  echo "✅ Formato: WebP"
  echo "✅ Tamaño máximo: 500KB por imagen"
  echo "✅ Nombres de archivo correctos"
  echo -e "\nLas imágenes están listas para ser subidas a Supabase Storage."
else
  echo "❌ Se encontraron $ERRORS errores. Por favor, corrige los problemas antes de subir las imágenes a Supabase Storage."
fi

exit $ERRORS

