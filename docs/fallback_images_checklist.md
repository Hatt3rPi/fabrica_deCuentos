# Lista de Verificación para Imágenes de Respaldo

Utiliza esta lista de verificación para asegurarte de que las imágenes de respaldo cumplan con todos los requisitos antes de subirlas a Supabase Storage.

## Antes de Subir

### Acuarela Digital

- [ ] Dimensiones: 800x800 píxeles
- [ ] Formato: WebP
- [ ] Peso: ≤ 500KB
- [ ] Paleta: Pasteles vibrantes
- [ ] Estilo: Bordes suaves, mezcla de colores, aspecto húmedo
- [ ] Contenido: Apropiado para todos los públicos
- [ ] Nombre de archivo: `acuarela-digital.webp`

### Dibujado a mano

- [ ] Dimensiones: 800x800 píxeles
- [ ] Formato: WebP
- [ ] Peso: ≤ 500KB
- [ ] Paleta: Pasteles vibrantes
- [ ] Estilo: Trazos visibles, textura de lápiz o pluma
- [ ] Contenido: Apropiado para todos los públicos
- [ ] Nombre de archivo: `dibujado-a-mano.webp`

### Recortes de papel

- [ ] Dimensiones: 800x800 píxeles
- [ ] Formato: WebP
- [ ] Peso: ≤ 500KB
- [ ] Paleta: Pasteles vibrantes
- [ ] Estilo: Aspecto de capas, sombras suaves, textura de papel
- [ ] Contenido: Apropiado para todos los públicos
- [ ] Nombre de archivo: `recortes-de-papel.webp`

### Kawaii

- [ ] Dimensiones: 800x800 píxeles
- [ ] Formato: WebP
- [ ] Peso: ≤ 500KB
- [ ] Paleta: Pasteles vibrantes
- [ ] Estilo: Ojos grandes, formas redondeadas, aspecto adorable
- [ ] Contenido: Apropiado para todos los públicos
- [ ] Nombre de archivo: `kawaii.webp`

## Verificación Automática

- [ ] Ejecutar `scripts/verify_fallback_images.sh` sin errores
- [ ] Verificar que GitHub Actions pase sin errores

## Después de Subir

- [ ] Verificar que las imágenes sean accesibles públicamente
- [ ] Confirmar que las imágenes mantienen su calidad
- [ ] Actualizar las URLs públicas en `supabase/storage/fallback-images/README.md`
- [ ] Verificar que las imágenes se muestren correctamente en el componente `FallbackImagesViewer`
- [ ] Comunicar al equipo que las imágenes están listas para su uso

## Notas Adicionales

- Las imágenes deben ser genéricas pero representativas de cada estilo visual
- Evitar imágenes con marcas de agua o derechos de autor
- Asegurarse de que las imágenes sean visualmente atractivas
- Mantener coherencia visual entre los diferentes estilos

