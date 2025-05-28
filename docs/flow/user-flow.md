# 📊 Flujo de Usuario de La CuenterIA

## 📝 Flujo Principal

1. **Autenticación**
   - Usuario accede a la aplicación
   - Se redirige a la pantalla de inicio de sesión
   - Inicia sesión con credenciales
   - Se redirige al dashboard

2. **Nuevo Cuento y Personajes**
   - Usuario presiona **Nuevo cuento** en el dashboard
   - Se abre el asistente (wizard) y un modal para seleccionar personajes
   - Puede crear personajes desde el modal
   - Selecciona hasta 3 personajes para el cuento

3. **Diseño de Historia**
   - Selecciona tema y estilo
   - Define estructura del cuento
   - Personaliza mensajes y diálogos
   - Ajusta formato visual

4. **Visualización y Exportación**
   - Previsualiza el cuento en formato libro
   - Realiza ajustes finales
   - Genera imágenes finales
   - Exporta a PDF

## 🔍 Detalles del Flujo

### Autenticación

1. **Inicio de Sesión**
   - Formulario de login
   - Validación de credenciales
   - Gestión de sesión

2. **Registro**
   - Formulario de registro
   - Validación de datos
   - Creación de cuenta

### Creación de Personajes

1. **Selección en el Wizard**
   - Al entrar al asistente se muestra un modal con los personajes existentes
   - Permite crear nuevos personajes directamente allí
   - Límite de 3 personajes por cuento

2. **Formulario de Personaje**
   - Nombre y características
   - Personalización visual
   - Generación de imagen
   - Validación de datos

3. **Galería dentro del Wizard**
   - Visualización en cuadrícula
   - Gestión de selección y eliminación

### Diseño de Historia

1. **Configuración Inicial**
   - Selección de edad objetivo
   - Elección de estilo literario
   - Definición de mensaje central

2. **Estructura del Cuento**
   - Número de páginas
   - Distribución de contenido
   - Organización visual

3. **Personalización**
   - Ajuste de paleta de colores
   - Selección de estilo visual
   - Configuración de formato

### Visualización y Exportación

1. **Previsualización**
   - Vista tipo libro
   - Navegación por páginas
   - Ajustes de diseño

2. **Generación Final**
   - Regeneración de imágenes
   - Optimización de formato
   - Generación de PDF

3. **Exportación**
   - Descarga de archivo
   - Opciones de formato
   - Gestión de versiones

## 🔄 Estados y Transiciones

- **Estado Inicial**: Login
- **Estado Principal**: Dashboard
- **Estado de Creación**: Formularios
- **Estado de Previsualización**: Vista libro
- **Estado Final**: Exportación

## 🛠️ Consideraciones Técnicas

- Validación en cada paso
- Manejo de errores
- Optimización de rendimiento
- Seguridad en datos
- Responsive design
