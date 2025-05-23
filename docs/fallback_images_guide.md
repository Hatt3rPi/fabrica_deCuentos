# Guía para Generar y Almacenar Imágenes Genéricas por Estilo

Esta guía detalla el proceso para crear, optimizar y subir las imágenes genéricas de respaldo para cada estilo visual.

## Requisitos

- 4 imágenes genéricas (una por cada estilo visual)
- Dimensiones: 800x800 píxeles
- Formato: WebP (preferido) o PNG
- Peso máximo: 500KB por imagen
- Paleta de colores: Pasteles vibrantes
- Estilo: Coherente con cada categoría visual

## Estilos Visuales

1. **Acuarela Digital**
   - Características: Bordes suaves, mezcla de colores, aspecto húmedo
   - Paleta: Pasteles vibrantes
   - Nombre de archivo: `acuarela-digital.webp`

2. **Dibujado a mano**
   - Características: Trazos visibles, textura de lápiz o pluma
   - Paleta: Pasteles vibrantes
   - Nombre de archivo: `dibujado-a-mano.webp`

3. **Recortes de papel**
   - Características: Aspecto de capas, sombras suaves, textura de papel
   - Paleta: Pasteles vibrantes
   - Nombre de archivo: `recortes-de-papel.webp`

4. **Kawaii**
   - Características: Ojos grandes, formas redondeadas, aspecto adorable
   - Paleta: Pasteles vibrantes
   - Nombre de archivo: `kawaii.webp`

## Proceso Paso a Paso

### 1. Generación de Imágenes

Existen varias opciones para generar las imágenes:

#### Opción A: Usar Servicios de IA para Generación de Imágenes

Puedes utilizar servicios como:
- DALL-E
- Midjourney
- Stable Diffusion

Prompts sugeridos para cada estilo:

**Acuarela Digital:**
```
Una ilustración genérica en estilo acuarela digital con colores pasteles vibrantes, fondo abstracto, 800x800 píxeles, sin texto, sin marca de agua, adecuada para todos los públicos.
```

**Dibujado a mano:**
```
Una ilustración genérica dibujada a mano con lápices de colores pasteles vibrantes, trazos visibles, fondo simple, 800x800 píxeles, sin texto, sin marca de agua, adecuada para todos los públicos.
```

**Recortes de papel:**
```
Una ilustración genérica en estilo de recortes de papel con capas superpuestas, colores pasteles vibrantes, sombras suaves, 800x800 píxeles, sin texto, sin marca de agua, adecuada para todos los públicos.
```

**Kawaii:**
```
Una ilustración genérica en estilo kawaii con personajes adorables, ojos grandes, formas redondeadas, colores pasteles vibrantes, 800x800 píxeles, sin texto, sin marca de agua, adecuada para todos los públicos.
```

#### Opción B: Usar Bancos de Imágenes Libres de Derechos

Puedes buscar en sitios como:
- Unsplash
- Pexels
- Freepik (sección gratuita)

Asegúrate de verificar las licencias y que las imágenes no tengan marcas de agua o derechos de autor.

#### Opción C: Crear Manualmente

Si tienes habilidades de diseño, puedes crear las imágenes manualmente usando:
- Adobe Photoshop
- Adobe Illustrator
- Procreate
- GIMP
- Krita

### 2. Optimización de Imágenes

Una vez que tengas las imágenes, debes optimizarlas para asegurar que cumplan con los requisitos:

1. Coloca las imágenes en la carpeta `supabase/storage/fallback-images/`
2. Ejecuta el script de optimización:
   ```bash
   chmod +x scripts/optimize_fallback_images.sh
   ./scripts/optimize_fallback_images.sh
   ```
3. Verifica que las imágenes cumplan con los requisitos:
   ```bash
   chmod +x scripts/verify_fallback_images.sh
   ./scripts/verify_fallback_images.sh
   ```

### 3. Subida a Supabase Storage

1. Accede al panel de administración de Supabase
2. Navega a la sección "Storage"
3. Crea un bucket llamado "fallback-images" si no existe
4. Configura los permisos para que las imágenes sean accesibles públicamente:
   - En la pestaña "Policies", crea una nueva política
   - Selecciona "SELECT" para permitir la lectura pública
   - Define la política como `true` para permitir acceso a todos
5. Sube las imágenes optimizadas al bucket
6. Obtén las URLs públicas de cada imagen:
   - Haz clic en cada imagen
   - Copia la URL pública
   - Actualiza el archivo `supabase/storage/fallback-images/README.md` con las URLs

### 4. Documentación en el README del Proyecto

Actualiza el README principal del proyecto con la información de las imágenes de respaldo:

```markdown
## Imágenes de Respaldo por Estilo

El proyecto utiliza imágenes genéricas de respaldo para cada estilo visual cuando falla la generación de variantes personalizadas:

- Acuarela Digital: [URL_PUBLICA_ACUARELA_DIGITAL]
- Dibujado a mano: [URL_PUBLICA_DIBUJADO_A_MANO]
- Recortes de papel: [URL_PUBLICA_RECORTES_DE_PAPEL]
- Kawaii: [URL_PUBLICA_KAWAII]

Estas imágenes se encuentran en Supabase Storage en la carpeta `fallback-images/`.
```

### 5. Comunicación al Equipo

Una vez completado el proceso, comunica al equipo que las imágenes están listas:

1. Envía un mensaje en el canal de comunicación del equipo
2. Incluye las URLs de las imágenes
3. Explica cómo referenciar las imágenes en el código (ver ejemplo en el README de la carpeta)

## Verificación Final

Antes de dar por completada la tarea, verifica:

- [ ] Las 4 imágenes están creadas y optimizadas
- [ ] Las imágenes cumplen con las dimensiones (800x800px)
- [ ] El formato es WebP o PNG optimizado
- [ ] El peso de cada imagen no excede los 500KB
- [ ] Las imágenes son visualmente atractivas y coherentes con cada estilo
- [ ] Las imágenes son apropiadas para todos los públicos
- [ ] Las imágenes están subidas a Supabase Storage
- [ ] Las URLs públicas están documentadas
- [ ] El equipo ha sido notificado

## Solución de Problemas

### Imagen demasiado grande

Si una imagen excede los 500KB después de la optimización:

1. Intenta reducir la calidad de la imagen:
   ```bash
   cwebp -q 75 -m 6 imagen.png -o imagen.webp
   ```

2. Simplifica la imagen (menos detalles, menos colores)

3. Utiliza herramientas online como TinyPNG o Squoosh

### Formato incorrecto

Si necesitas convertir entre formatos:

```bash
# De PNG a WebP
cwebp -q 85 imagen.png -o imagen.webp

# De JPG a WebP
cwebp -q 85 imagen.jpg -o imagen.webp
```

### Dimensiones incorrectas

Para redimensionar una imagen a 800x800:

```bash
convert imagen.png -resize 800x800^ -gravity center -extent 800x800 imagen_resized.png
```

