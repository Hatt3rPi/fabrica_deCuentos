# 📱 CharacterForm Component

Formulario modal para crear y editar personajes dentro del asistente de creación de historias.

## 📋 Descripción

El `CharacterForm` es un componente React diseñado para ser utilizado dentro de un modal en el componente `CharactersStep`. Permite a los usuarios definir las características de sus personajes, incluyendo nombre, edad, descripción, cargar imágenes de referencia y generar una imagen de miniatura (thumbnail) utilizando servicios de IA.

Este componente ya no depende de parámetros de URL para la edición, sino que recibe el `characterId` y `storyId` a través de props. Gestiona la lógica de creación o actualización de personajes directamente y comunica el resultado a su componente padre (`CharactersStep`) mediante callbacks (`onSave`, `onCancel`).

## 🔧 Props

```typescript
interface CharacterFormProps {
  characterId?: string | null; // ID del personaje a editar. Si es null/undefined, el formulario opera en modo creación.
  storyId: string; // ID de la historia a la que pertenece/pertenecerá el personaje.
  onSave: (character: Character | { id: string }) => Promise<void> | void; // Callback invocado tras guardar/crear exitosamente. Recibe el objeto del personaje.
  onCancel: () => void; // Callback invocado al cancelar la operación.
}
```

## 🎨 Estilos

- Optimizado para uso en modales.
- Diseño responsive que se adapta al contenedor del modal.
- Indicadores visuales para estados de carga (subida de imágenes, generación de IA).
- Feedback claro para errores de validación o de API.

## 📊 Estado Interno

- `formData`: Almacena los datos del personaje (nombre, edad, descripción, URLs de referencia, URL de miniatura).
- `isLoading`: Indica si hay una operación de guardado en curso.
- `isAnalyzing`, `isGeneratingThumbnail`: Estados para las operaciones de IA.
- `error`: Almacena mensajes de error generales del formulario.
- `fieldErrors`: Almacena errores de validación específicos por campo.
- `thumbnailGenerated`: Booleano que indica si la miniatura ha sido generada.
- `currentCharacterId`: UUID local para nuevos personajes antes de ser guardados, o `propCharacterId` para edición.

## 🔄 Funcionalidades Clave

1.  **Modos de Operación**:
    *   **Creación**: Si `characterId` no se proporciona, el formulario inicializa campos vacíos y genera un UUID local (`currentCharacterId`) para la sesión del formulario (usado para subidas de imágenes antes del guardado inicial). Al guardar, crea un nuevo personaje en la base de datos.
    *   **Edición**: Si `characterId` se proporciona, carga los datos del personaje existente y permite su modificación.

2.  **Gestión de Datos del Personaje**:
    *   Campos para nombre, edad y descripción (multilenguaje, enfocado en `es`).
    *   Validación de campos requeridos antes del envío.

3.  **Carga de Imágenes de Referencia**:
    *   Utiliza `react-dropzone` para la carga de imágenes.
    *   Sube las imágenes a Supabase Storage, asociándolas al `currentCharacterId`.

4.  **Generación de Miniatura (Thumbnail) por IA**:
    *   Botón para iniciar la generación de la miniatura.
    *   Llama a una función de Supabase Edge (`describe-and-sketch`) que puede usar IA para generar la imagen.
    *   Sube la miniatura generada a Supabase Storage.
    *   Requiere que la miniatura sea generada antes de poder guardar el personaje.

5.  **Integración con IA (Opcional - `analyze-character`)**:
    *   Incluye lógica para llamar a una función `analyze-character` (si se mantiene su uso).

6.  **Callbacks para Comunicación**:
    *   `onSave(character)`: Se invoca después de que el personaje se guarda (crea o actualiza) exitosamente en la base de datos. Retorna el objeto del personaje.
    *   `onCancel()`: Se invoca cuando el usuario cierra el formulario sin guardar.

7.  **Notificaciones**:
    *   Utiliza `useNotifications` para informar al usuario sobre el éxito o errores de las operaciones.

## 🔗 Dependencias

### Consumidores

- `CharactersStep`: Utiliza `CharacterForm` dentro de un componente `Modal` para la creación y edición de personajes.

### Dependencias Internas

1.  **Contextos**:
    *   `AuthContext`: Para obtener el `user` y cliente `supabase`.
    *   `useNotifications`: Para mostrar notificaciones al usuario.
2.  **Librerías**:
    *   `react-dropzone`: Para la funcionalidad de arrastrar y soltar imágenes.
    *   `lucide-react`: Para iconos.
    *   `uuid`: Para generar IDs locales para nuevos personajes.
3.  **Supabase**:
    *   Cliente Supabase para interactuar con la base de datos (tabla `characters`) y Storage (para imágenes de referencia y miniaturas).
    *   Llamadas a Supabase Edge Functions para generación de miniaturas y análisis (ej. `describe-and-sketch`, `analyze-character`).

## 🎯 Casos de Uso

### 1. Creación de Personaje (en Modal)

#### Criterios de Éxito
- ✅ Formulario se muestra vacío (o con valores por defecto).
- ✅ Usuario completa nombre, edad, descripción.
- ✅ Usuario carga imagen de referencia (opcional pero recomendado).
- ✅ Usuario genera la miniatura (obligatorio para guardar).
- ✅ Al guardar (`handleSubmit`), se crea un nuevo registro en la tabla `characters`.
- ✅ Se invoca `onSave` con el personaje creado.

#### Criterios de Fallo
- ❌ Validación de campos falla (ej. nombre vacío, miniatura no generada).
- ❌ Error durante la subida de imagen de referencia.
- ❌ Error durante la generación/subida de la miniatura.
- ❌ Error al guardar en la base de datos.
- ❌ Límite de solicitudes a servicios de IA.

### 2. Edición de Personaje (en Modal)

#### Criterios de Éxito
- ✅ Formulario se carga con los datos del personaje (obtenidos por `propCharacterId`).
- ✅ Usuario modifica los campos deseados.
- ✅ Usuario puede regenerar la miniatura.
- ✅ Al guardar (`handleSubmit`), se actualiza el registro existente en la tabla `characters`.
- ✅ Se invoca `onSave` con el personaje actualizado.

#### Criterios de Fallo
- ❌ Error al cargar los datos del personaje.
- ❌ Mismos criterios de fallo que en la creación si se modifican campos relevantes.

### 3. Cancelación
- ✅ Usuario hace clic en "Cancelar".
- ✅ Se invoca `onCancel`.
- ✅ El modal se cierra sin guardar cambios.


## 🛠️ Flujo de Datos y Lógica
- **Inicialización**:
    - Recibe `characterId`, `storyId`, `onSave`, `onCancel` como props.
    - Determina `isEditMode` basado en `propCharacterId`.
    - Genera un `currentCharacterId` (UUID) si está en modo creación, o usa `propCharacterId` si está en modo edición. Este ID se usa para las rutas de subida de imágenes antes de que el personaje tenga un ID final de la BD (en modo creación).
    - Si es modo edición, carga los datos del personaje desde Supabase.
    - Si es modo creación, inicializa `formData` vacío.
- **Interacción del Usuario**:
    - Rellena campos, carga imágenes. La imagen de referencia se sube inmediatamente a una ruta temporal/definitiva usando `currentCharacterId`.
    - Solicita generación de miniatura. Esta se genera y se sube. `thumbnailGenerated` se pone a `true`.
- **Guardado (`handleSubmit`)**:
    - Validaciones: nombre, descripción (opcional), miniatura generada.
    - Si es modo edición, actualiza el personaje en la tabla `characters` usando `propCharacterId`.
    - Si es modo creación, inserta el nuevo personaje en la tabla `characters` usando el `currentCharacterId` (UUID generado localmente) como `id` del nuevo registro.
    - Llama a `props.onSave(characterData)` con los datos del personaje guardado/actualizado.
- **Cancelación**:
    - Llama a `props.onCancel()`.

## 🐛 Consideraciones y Mejoras Futuras
- **Manejo de Errores**: Mejorar la granularidad de los mensajes de error para el usuario.
- **Optimistic Updates**: Para una UI más fluida, se podrían implementar actualizaciones optimistas.
- ** Internacionalización (i18n)**: Aunque el `formData.description` puede tener `es` y `en`, el resto de la UI está en español.
- **`callAnalyzeCharacter`**: Esta función se mantiene pero su integración completa y necesidad deben ser revisadas en el contexto del flujo actual.
- **Autosave**: La funcionalidad de `useCharacterAutosave` fue eliminada en la refactorización para modal. Si se requiere, debería ser reimplementada considerando el ciclo de vida del modal.
