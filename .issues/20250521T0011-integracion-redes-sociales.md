# Integración con Redes Sociales

Épica: WIZARD - [3] VISUALIZACIÓN  
Categoría: Feature  


## Notas para devs
Implementar funcionalidad para compartir personajes generados en redes sociales, incluyendo una previsualización atractiva.

## Archivos afectados
- `src/components/ShareButton/ShareButton.tsx` (nuevo)
- `src/hooks/useSocialShare.ts` (nuevo)
- `src/services/socialShareService.ts` (nuevo)
- `public/og-templates/` (carpeta para plantillas de Open Graph)
- `src/pages/CharacterView/CharacterView.tsx` (modificar)

## 🧠 Contexto
Los usuarios quieren compartir fácilmente sus creaciones en redes sociales. Necesitamos proporcionar una forma intuitiva de generar enlaces compartibles con vistas previas atractivas que muestren los personajes generados.

## 📐 Objetivo
Implementar un sistema de compartición que permita a los usuarios compartir sus personajes en redes sociales con una vista previa personalizada que incluya la imagen del personaje y detalles relevantes.

## ✅ Criterios de Éxito

### Funcionalidad Básica
- [ ] Botón de compartir visible en la vista de detalle del personaje
- [ ] Menú desplegable con opciones de redes sociales
- [ ] Soporte para compartir en al menos: Facebook, Twitter, Instagram y WhatsApp
- [ ] Generación de enlaces con parámetros UTM para seguimiento

### Vista Previa
- [ ] Imagen del personaje en alta calidad
- [ ] Nombre del personaje en el título
- [ ] Descripción breve generada automáticamente
- [ ] Logo de la aplicación en la esquina
- [ ] Soporte para formato de tarjeta enriquecida (Open Graph)

### Experiencia de Usuario
- [ ] Feedback visual al hacer clic en compartir
- [ ] Copiar enlace al portapapeles
- [ ] Adaptación a dispositivos móviles
- [ ] Accesibilidad (teclado, lectores de pantalla)

### Rendimiento
- [ ] Carga perezosa de los scripts de redes sociales
- [ ] Tiempo de carga de la vista previa < 1s
- [ ] Peso de imagen optimizado para compartir (< 500KB)

## ❌ Criterios de Falla

### Problemas de Implementación
- [ ] Imágenes de vista previa rotas o de baja calidad
- [ ] Enlaces que no se abren en apps nativas en dispositivos móviles
- [ ] Falta de metaetiquetas Open Graph o Twitter Cards
- [ ] Tiempo de carga excesivo de la vista previa

### Problemas de UX
- [ ] Falta de feedback al usuario durante el proceso
- [ ] Interfaz confusa o difícil de usar
- [ ] Inconsistencias visuales entre navegadores
- [ ] Problemas de diseño en móviles

## 🧪 Casos de Prueba

### 1. Compartir en Facebook
- [ ] Verificar que la imagen se muestra correctamente
- [ ] Comprobar que el título y descripción son correctos
- [ ] Verificar que el enlace lleva a la página correcta
- [ ] Probar con diferentes tamaños de imagen

### 2. Compartir en Twitter
- [ ] Verificar que el tweet incluye la imagen
- [ ] Comprobar que el texto incluye hashtags relevantes
- [ ] Verificar la tarjeta de vista previa
- [ ] Probar con diferentes longitudes de texto

### 3. Compartir en WhatsApp
- [ ] Verificar que se abre la app con el mensaje
- [ ] Comprobar que la vista previa se muestra
- [ ] Probar en diferentes dispositivos móviles
- [ ] Verificar el comportamiento en WhatsApp Web

### 4. Compartir en Instagram
- [ ] Verificar que la imagen se puede compartir en historias
- [ ] Comprobar que los enlaces funcionan correctamente
- [ ] Verificar la calidad de la imagen compartida

### 5. Dispositivos Móviles
- [ ] Verificar que los enlaces abren apps nativas
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Verificar el rendimiento en conexiones lentas
- [ ] Probar en iOS y Android

## 📊 Métricas de Éxito
- Aumento del 30% en compartidos en redes sociales
- Tasa de clics en enlaces compartidos > 15%
- Tiempo promedio de generación de vista previa < 800ms
- 0 reportes de errores relacionados con el compartir

## 🔄 Dependencias
- [ ] LAC-23: Imágenes genéricas por estilo (para fallback)
- [ ] Configuración de metaetiquetas en _document.tsx
- [ ] Servicio de generación de URLs de compartir

## 📅 Plan de Implementación
1. Configuración de metaetiquetas Open Graph
2. Desarrollo del componente ShareButton
3. Integración con APIs de redes sociales
4. Pruebas en diferentes plataformas
5. Despliegue y monitoreo

## 📝 Notas Adicionales
- Considerar limitaciones de cada red social
- Implementar analytics para rastrear compartidos
- Documentar proceso para añadir nuevas redes sociales
- Crear guía de estilo para vistas previas
