# 📱 CharacterForm

Formulario para crear y editar personajes en la plataforma.

## 📋 Descripción

El `CharacterForm` es un componente React que permite crear y editar personajes, incluyendo la carga de imágenes y la generación de thumbnails mediante IA.

## 🔧 Props

```typescript
interface CharacterFormProps {
  id?: string; // ID del personaje a editar
}
```

## 🎨 Estilos

- Diseño responsive
- Estados de carga
- Estados de error
- Feedback visual

## 📊 Estado

- Estado de carga
- Estado de análisis
- Estado de generación
- Manejo de errores

## 🔄 Funcionalidades

1. **Formulario**
   - Campos de texto
   - Carga de imágenes
   - Generación de thumbnails
   - Validación de datos

2. **Integración con IA**
   - Análisis de personaje
   - Generación de imágenes
   - Manejo de respuestas

3. **Gestión de Estado**
   - Autosave
   - Recuperación de estado
   - Manejo de sesiones

## 🔗 Dependencias

### Consumidores

- `CharactersGrid`: Acceso al formulario
- `CharacterCard`: Redirección al formulario

### Dependencias

1. **Contextos**
   - `AuthContext`: Gestión de autenticación
   - `CharacterStore`: Estado global

2. **Librerías**
   - `React Router DOM`: Navegación
   - `React Dropzone`: Carga de archivos
   - `Lucide Icons`: Iconos
   - `Supabase`: Base de datos

## 🎯 Casos de Uso

### 1. Creación de Personaje

#### Criterios de Éxito
- ✅ Validación de campos
- ✅ Carga de imagen
- ✅ Generación de thumbnail
- ✅ Guardado en base de datos

#### Criterios de Fallo
- ❌ Datos inválidos
- ❌ Límite de solicitudes
- ❌ Error en carga
- ❌ Sesión expirada

### 2. Edición de Personaje

#### Criterios de Éxito
- ✅ Carga de datos existentes
- ✅ Actualización de campos
- ✅ Actualización de imagen
- ✅ Guardado en base de datos

#### Criterios de Fallo
- ❌ Personaje no encontrado
- ❌ Datos inválidos
- ❌ Error en base de datos
- ❌ Sesión expirada

### 3. Generación de Thumbnail

#### Criterios de Éxito
- ✅ Selección de imagen
- ✅ Generación de thumbnail
- ✅ Actualización de estado
- ✅ Guardado en base de datos

#### Criterios de Fallo
- ❌ Imagen no válida
- ❌ Error en generación
- ❌ Límite de solicitudes
- ❌ Error en base de datos

### 4. Análisis de Personaje

#### Criterios de Éxito
- ✅ Análisis de datos
- ✅ Generación de características
- ✅ Actualización de estado
- ✅ Guardado en base de datos

#### Criterios de Fallo
- ❌ Datos insuficientes
- ❌ Límite de solicitudes
- ❌ Error en análisis
- ❌ Error en base de datos

## 🛠️ Contextos

- Utiliza `AuthContext` para permisos
- Se integra con `CharacterStore` para estado
- Usa `Supabase` para base de datos
- Implementa `useCharacterAutosave` para persistencia

## 🐛 Consideraciones

- Manejo de estados de carga
- Validación de datos
- Gestión de errores
- Control de sesiones
- Límites de peticiones
- Autosave en local storage
