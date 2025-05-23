#!/bin/bash

# Hook de pre-commit para verificar las imágenes de respaldo
# Para instalar este hook, ejecuta:
# cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
# chmod +x .git/hooks/pre-commit

# Verificar si se han modificado imágenes en la carpeta de imágenes de respaldo
IMAGES_CHANGED=$(git diff --cached --name-only | grep "supabase/storage/fallback-images/.*\.\(webp\|png\)$")

if [ -n "$IMAGES_CHANGED" ]; then
  echo "Verificando imágenes de respaldo..."
  
  # Verificar si el script de verificación existe
  if [ ! -f "scripts/verify_fallback_images.sh" ]; then
    echo "Error: No se encontró el script de verificación de imágenes."
    exit 1
  fi
  
  # Ejecutar el script de verificación
  bash scripts/verify_fallback_images.sh
  
  # Verificar el resultado
  if [ $? -ne 0 ]; then
    echo "Error: Las imágenes de respaldo no cumplen con los requisitos."
    echo "Por favor, ejecuta scripts/optimize_fallback_images.sh para optimizarlas."
    exit 1
  fi
  
  echo "Imágenes de respaldo verificadas correctamente."
fi

# Continuar con el commit
exit 0

