#!/bin/bash

# Script para descargar imágenes de ejemplo para los estilos visuales
# Estas imágenes son solo ejemplos y deberán ser reemplazadas con imágenes finales

# Crear directorio si no existe
mkdir -p supabase/storage/fallback-images/

# Descargar imágenes de ejemplo (usando placeholders de ejemplo)
# En un entorno real, estas URLs deberían ser reemplazadas con imágenes reales

# Acuarela Digital
curl -o supabase/storage/fallback-images/acuarela-digital.webp https://placehold.co/800x800/pastel/white?text=Acuarela+Digital

# Dibujado a mano
curl -o supabase/storage/fallback-images/dibujado-a-mano.webp https://placehold.co/800x800/pastel/white?text=Dibujado+a+Mano

# Recortes de papel
curl -o supabase/storage/fallback-images/recortes-de-papel.webp https://placehold.co/800x800/pastel/white?text=Recortes+de+Papel

# Kawaii
curl -o supabase/storage/fallback-images/kawaii.webp https://placehold.co/800x800/pastel/white?text=Kawaii

echo "Imágenes de ejemplo descargadas en supabase/storage/fallback-images/"
echo "IMPORTANTE: Estas son solo imágenes de ejemplo y deben ser reemplazadas con imágenes finales que cumplan con los requisitos del proyecto."

