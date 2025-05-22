Épica: WIZARD - [3] VISUALIZACIÓN
Categoría: Improvement
Identificador: LAC-23
Notas para devs: Se requiere crear manualmente 4 imágenes genéricas (una por cada estilo visual) que funcionen como respaldo cuando falle la generación de variantes personalizadas. Esta es una tarea de una sola vez, no se requiere implementar un sistema de generación automática.

Archivos afectados:
- supabase/storage/fallback-images/ (carpeta para almacenar las imágenes)

🧠 Contexto:
Actualmente, cuando falla la generación de variantes de estilo visual para un personaje, no hay una imagen de respaldo genérica del estilo correspondiente. Se requiere crear manualmente 4 imágenes (una por cada estilo) que serán usadas como respaldo.

Estilos visuales:
1. Acuarela Digital
2. Dibujado a mano
3. Recortes de papel
4. Kawaii

Cada imagen debe ser genérica pero representativa del estilo y usar una paleta de colores pasteles vibrantes.

📐 Objetivo:
Crear manualmente 4 imágenes genéricas (una por cada estilo visual) y subirlas al storage de Supabase para su uso como respaldo cuando falle la generación de variantes personalizadas.

✅ CRITERIOS DE ÉXITO (lo que sí debe ocurrir):

- [ ] Crear 4 imágenes genéricas (una por cada estilo visual)
- [ ] Imágenes con dimensiones adecuadas (recomendado: 800x800px)
- [ ] Formato de imagen optimizado (WebP o PNG con compresión)
- [ ] Subir las imágenes a Supabase Storage en la carpeta `fallback-images/`
- [ ] Verificar que las imágenes sean accesibles públicamente
- [ ] Documentar las URLs de las imágenes en el README.md del proyecto
- [ ] Comunicar al equipo que las imágenes están listas para su uso

❌ CRITERIOS DE FALLA (lo que no debe ocurrir):

- [ ] Imágenes con marcas de agua o derechos de autor
- [ ] Imágenes con baja resolución o calidad
- [ ] Errores por imágenes no encontradas
- [ ] Inconsistencias visuales entre los estilos
- [ ] Exceder el tamaño máximo recomendado por imagen (máx. 500KB)

🧪 VERIFICACIÓN REQUERIDA:

1. Antes de subir:
   - [ ] Verificar que las imágenes sean únicas para cada estilo
   - [ ] Confirmar que las imágenes sean visualmente atractivas
   - [ ] Asegurar que las imágenes sean apropiadas para todos los públicos

2. Después de subir:
   - [ ] Verificar que las imágenes se puedan visualizar desde la URL pública
   - [ ] Confirmar que las imágenes mantienen su calidad
   - [ ] Verificar que los nombres de los archivos sigan el patrón: `estilo-[nombre].webp` (ej: `acuarela-digital.webp`)

INSTRUCCIONES ADICIONALES:

1. Características de las imágenes:
   - Formato: WebP (preferido) o PNG
   - Tamaño: 800x800 píxeles
   - Peso máximo: 500KB por imagen
   - Paleta de colores: pasteles vibrantes
   - Estilo: Coherente con cada categoría visual

2. Proceso de carga:
   - Subir manualmente las imágenes a Supabase Storage
   - Verificar permisos de acceso público
   - Documentar las URLs en el README.md

3. Comunicación:
   - Notificar al equipo cuando las imágenes estén listas
   - Especificar cómo referenciar las imágenes en el código
